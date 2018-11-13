import re
from datetime import timedelta

import dateparser
import dateutil.parser
import requests
from bs4 import BeautifulSoup
from bs4.dammit import EncodingDetector
from icalendar import Calendar, Event

import constant


def get_encoding(resp):
    """Gets the encoding used in a webpage"""
    http_encoding = resp.encoding if "charset" in resp.headers.get("content-type", "").lower() else None
    html_encoding = EncodingDetector.find_declared_encoding(resp.content, is_html=True)
    encoding = html_encoding or http_encoding
    return encoding


def get_classes_no_json(course_url, year, curr):
    """Gets a list of classes for courses that do not use a JSON timetable

    As of 2018-11-13 their names are the content of <li> tags in a <form> tag with id=constant.CLSNOJSONFORMID"""
    classes_url = constant.TIMETABLEURLFORMATNOJSON[get_course_lang(course_url)].format(course_url, year, curr)
    resp = requests.get(classes_url)
    soup = BeautifulSoup(resp.content, from_encoding=get_encoding(resp), features="html5lib")
    classes = []
    for li in soup.find("form", id=constant.CLSNOJSONFORMID).find_all("li"):
        classes.append(li.contents[constant.CLSLABELPOS].contents[0])
    return classes


def get_location_no_json(i, soup):
    """Gets location info for courses that do not use a JSON timetable"""
    location_data = soup.find("div", id="panel{}".format(i)).find("div").contents
    classroom_name = location_data[0].lstrip().rstrip()
    classroom_info = location_data[1].find("div")
    if classroom_info is not None:
        classroom_loc = classroom_info.contents[0].lstrip().rstrip()
        classroom_name += " - " + classroom_loc
    return classroom_name


def get_class_periods_no_json(i, soup):
    """Gets the dates of the first and last lessons of a certain class for courses that do not use a JSON timetable

    As of 2018-11-13 they are saved as the content of the first <p> tag inside a <div> with id equal to panel{index}
    Since a class can last two semesters with winter break in between, it returns an array
    """
    periods = []
    for period in soup.find("div", id="panel{}".format(i)).find_all("p"):
        periods.append(period.contents[0].split("\n"))
    return periods


def get_class_name_no_json(i, soup):
    """Gets the name of a class for courses that do not use a JSON timetable

    As of 2018-11-13 it's saved as the content of an <h3> tag with id equal to tab{index}"""
    return soup.find("h3", id="tab{}".format(i)).find("a").contents[2].lstrip().rstrip()


def get_lessons_no_json(i, soup):
    """Gets days of week and times a certain class is held for courses that do not use a JSON timetable

        As of 2018-11-13 they are saved as <td> elements inside a <table class=constant.TIMETABLETBLCLASS>
        inside a <div id=panel{index}>, with the following pattern repeating every 4 lines:
        1) day of week (dict field: constant.DOWFLD)
        2) timeframe expressed as "start_time - end_time" (df: constant.LSN(START|END)FLD
        3) teacher's name (df: constant.TEACHERFLD)
        4) blank line
        Returns a dict using 4 keys in the order above (no blank line of course, start and end times are separate)"""
    class_timetables = soup.find("div", id="panel{}".format(i)).find_all("table", class_=constant.TIMETABLETBLCLASS)
    class_lessons = []

    for class_timetable in class_timetables:
        period_lessons = []
        for (j, class_time) in enumerate(class_timetable.find("tbody").find_all("td"), 0):
            class_info = class_time.contents[0].lstrip().rstrip()
            if j % 4 == 0:
                lesson = {}
                lesson[constant.DOWFLD] = class_info.lstrip().rstrip()
            if j % 4 == 1:
                timesplit = class_info.split(" - ")
                lesson[constant.LSNSTARTFLD] = timesplit[0].lstrip().rstrip()
                lesson[constant.LSNENDFLD] = timesplit[1].lstrip().rstrip()
            if j % 4 == 2:
                lesson[constant.TEACHERFLD] = class_info.lstrip().rstrip()
                period_lessons.append(lesson)
        class_lessons.append(period_lessons[:])
    return class_lessons


def get_timetable_no_json(course_url, year, curr):
    """Encodes the timetable of a course that does not use a JSON timetable in a vaguely sane format

    Dictionary fields:
    -   constant.NAMEFLD: name of the class
    -   constant.CLS(START|END)FLD: first|lass lessons of a certain class
    -   constant.LOCATIONFLD: where the class is held (the same every day that class is held)
    -   constant.LESSONSFLD: array of dicts describing the days and times a certain class is held
    The 4th field's dict fields are as returned by get_lessons_no_json()
    """
    timetable_url = constant.TIMETABLEURLFORMATNOJSON[get_course_lang(course_url)].format(course_url, year, curr)
    resp = requests.get(timetable_url)
    soup = BeautifulSoup(resp.content, from_encoding=get_encoding(resp), features="html5lib")
    classes = []
    available_classes = get_classes_no_json(course_url, year, curr)
    for i in range(0, len(available_classes)):
        class_name = get_class_name_no_json(i, soup)
        class_periods = get_class_periods_no_json(i, soup)
        classroom_name = get_location_no_json(i, soup)
        class_lessons = get_lessons_no_json(i, soup)
        for period, period_lessons in zip(class_periods, class_lessons):
            _class = {constant.NAMEFLD: class_name, constant.CLSSTARTFLD: period[2].lstrip()[:-2],
                      constant.CLSENDFLD: period[3].lstrip(), constant.LOCATIONFLD: classroom_name,
                      constant.LESSONSFLD: period_lessons}
            classes.append(_class)
    return classes


def get_school_links():
    """Gets a list of unibo's schools parsing a webpage"""
    resp = requests.get(constant.SCHOOLSURL)
    soup = BeautifulSoup(resp.content, from_encoding=get_encoding(resp), features="html5lib")
    school_links = []
    for atag in soup.find_all("a", class_=constant.SCHLTYPE, href=True):
        school_links.append({constant.NAMEFLD: atag.contents[0], constant.LINKFLD: atag["href"]})
    return school_links


def get_school_url(school_links, school_index):
    """Ensures all school URLs are in the same format and end with  "/it"

    If this is not checked for, every function that uses a school's URL will fail because most of the webpages
    are under the /it (or /en) subfolder"""
    school_url = school_links[school_index][constant.LINKFLD]
    if school_url[-3:] != "/it":
        school_url += "/it"
    return school_url


def get_course_list(school_url):
    """Gets a list of courses for a given school

    As of 2018-11-13, every school's course list is under the constant.CRSSUFF subfolder. <a> tags holding
    course URLs have constant.COURSENAMETAG as text
    Dictionary fields:
    -   constant.CODEFLD: course code for internal use
    -   constant.NAMEFLD: course name
    -   constant.LINKFLD: link to the course's site, used to get timetables"""
    course_list_url = school_url + constant.CRSSUFF
    resp = requests.get(course_list_url)
    soup = BeautifulSoup(resp.content, from_encoding=get_encoding(resp), features="html5lib")

    courses = []
    for atag in soup.find_all("a", href=True):
        if atag.contents:
            if atag.contents[0] == constant.COURSELINK:
                course_number = re.findall(r"\d+", atag[constant.COURSENAMETAG])[0]
                courses.append({constant.CODEFLD: course_number, constant.NAMEFLD: atag[constant.COURSENAMETAG],
                                constant.LINKFLD: atag["href"]})
    return courses


def get_course_url(course_list, course_index):
    """Getter function to get a course's URL without directly accessing the dictionary"""
    return course_list[course_index][constant.LINKFLD]


def get_course_name(course_list, course_index):
    """Getter function to get a course's name without directly accessing the dictionary"""
    return course_list[course_index][constant.NAMEFLD]


def get_course_code(course_list, course_index):
    """Getter function to get a course's internal code without directly accessing the dictionary"""
    return course_list[course_index][constant.CODEFLD]


def get_course_lang(course_url):
    """Getter function to get a course's language without directly analyzing the URL"""
    return constant.CRSLANG_EN if "cycle" in course_url else constant.CRSLANG_IT


def get_curricula(course_url, year):
    """Encodes the available curricula for a given course in a given year in a vaguely sane format

    Dictionary fields:
    -   constant.CODEFLD: curr code as used in JSON requests
    -   constant.NAMEFLD: human-readable curr name"""
    curricula = []
    curricula_req_url = constant.CURRICULAURLFORMAT[get_course_lang(course_url)].format(course_url, year)
    for curr in requests.get(curricula_req_url).json():
        curricula.append({constant.CODEFLD: curr[constant.CURRVAL], constant.NAMEFLD: curr[constant.CURRNAME]})
    return curricula


def get_curr_name(curricula, curr_index):
    """Getter function to get a curr's name without directly accessing the dictionary"""
    return curricula[curr_index][constant.NAMEFLD]


def get_curr_code(curricula, curr_index):
    """Getter function to get a curr's internal code without directly accessing the dictionary"""
    return curricula[curr_index][constant.CODEFLD]


def encode_json_timetable(raw_timetable):
    """Encodes a JSON timetable in a vaguely sane format

    Dictionary fields:
    -   constant.NAMEFLD: class name
    -   constant.LSNSTARTFLD: datetime object with lesson start time
    -   constant.LSNENDFLD: datetime object with lesson end time
    -   constant.LOCATIONFLD: where the lesson is held, if available
    """
    lessons = []
    for e in raw_timetable[constant.EVENTS]:
        title = e[constant.TITLE]
        if e[constant.ROOMS]:
            location = e[constant.ROOMS][0][constant.CLASSROOM] + ", " + e[constant.ROOMS][0][constant.CAMPUS]
        else:
            location = constant.NO_LOC_AVAILABLE
        start = dateutil.parser.parse(e[constant.START])
        end = dateutil.parser.parse(e[constant.END])
        lessons.append({constant.NAMEFLD: title, constant.LSNSTARTFLD: start, constant.LSNENDFLD: end,
                        constant.LOCATIONFLD: location})
    return lessons


def date_range(start_date, end_date):
    """Gets a range of dates as array"""
    for n in range(int((end_date - start_date).days)):
        yield start_date + timedelta(n)


def encode_no_json_timetable(raw_timetable):
    """Encodes a non-JSON timetable in the same vaguely sane format

        Dictionary fields:
        -   constant.NAMEFLD: class name
        -   constant.LSNSTARTFLD: datetime object with lesson start time
        -   constant.LSNENDFLD: datetime object with lesson end time
        -   constant.LOCATIONFLD: where the lesson is held, if available
        """
    days_of_week_it = ["lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato", "domenica"]
    lessons = []
    for _class in raw_timetable:
        title = _class[constant.NAMEFLD]
        location = _class[constant.LOCATIONFLD]
        class_first_lesson = dateparser.parse(_class[constant.LSNSTARTFLD], languages=["it"])
        class_last_lesson = dateparser.parse(_class[constant.LSNENDFLD], languages=["it"])
        class_period = date_range(class_first_lesson, class_last_lesson)
        for period_date in class_period:
            weekday = period_date.weekday()
            for lesson in _class[constant.LESSONSFLD]:
                starthr = int(lesson[constant.LSNSTARTFLD].split(":")[0])
                startmm = int(lesson[constant.LSNSTARTFLD].split(":")[1])
                endhr = int(lesson[constant.LSNENDFLD].split(":")[0])
                endmm = int(lesson[constant.LSNENDFLD].split(":")[1])
                lesson_weekday = days_of_week_it.index(lesson[constant.DOWFLD].lower())
                if weekday == lesson_weekday:
                    startdatetime = period_date.replace(hour=starthr, minute=startmm)
                    enddatetime = period_date.replace(hour=endhr, minute=endmm)
                    lessons.append(
                        {constant.NAMEFLD: title, constant.LSNSTARTFLD: startdatetime, constant.LSNENDFLD: enddatetime,
                         constant.LOCATIONFLD: location})
    return lessons


def has_json_timetable(course_url):
    """Checks if a course uses a JSON timetable

    As of 2018-11-13, if a course uses a JSON timetable it has a <div id="calendar"> in its timetable page"""
    page_url = constant.CHECKJSONURLFORMAT[get_course_lang(course_url)].format(course_url)
    resp = requests.get(page_url)
    soup = BeautifulSoup(resp.content, from_encoding=get_encoding(resp), features="html5lib")
    hjt = (soup.find("div", id="calendar") is not None)
    return hjt


def get_timetable(course_url, year, curr):
    """Checks if the selected course uses a JSON calendar and calls the appropriate get_timetable function"""
    if has_json_timetable(course_url):
        timetable_url = constant.TIMETABLEURLFORMAT[get_course_lang(course_url)].format(course_url, year, curr)
        req = requests.get(url=timetable_url)
        timetable = encode_json_timetable(req.json())
    else:
        timetable = encode_no_json_timetable(get_timetable_no_json(course_url, year, curr))
    return timetable


def get_classes_json(course_url, year, curr):
    """Gets a list of classes from a JSON timetable

    As of 2018-11-13, JSON timetables have a constant.CLASSES field which holds an array of classes;
    its index 1 is the class's name"""
    resp = requests.get(constant.TIMETABLEURLFORMAT[get_course_lang(course_url)].format(course_url, year, curr))
    classes = []
    for _class in resp.json()[constant.CLASSES]:
        classes.append(_class[1])
    return classes


def get_classes(course_url, year, curr):
    """Checks if the selected course uses a JSON calendar and calls the appropriate get_classes() function"""
    if has_json_timetable(course_url):
        return get_classes_json(course_url, year, curr)
    else:
        return get_classes_no_json(course_url, year, curr)


def get_ical_file(timetable, classes):
    """Creates an iCalendar file with the timetable as requested"""
    cal = Calendar()
    for lesson in timetable:
        if lesson[constant.NAMEFLD] in classes:
            event = Event()
            event.add(constant.ICALTITLE, lesson[constant.NAMEFLD])
            event.add(constant.ICALSTART, lesson[constant.LSNSTARTFLD])
            event.add(constant.ICALEND, lesson[constant.LSNENDFLD])
            event.add(constant.ICALLOCATION, lesson[constant.LOCATIONFLD])
            cal.add_component(event)
    return cal.to_ical()


def get_safe_course_name(name):
    """Generates a string that is safe to use as a file name

    Strips special characters and removes digits to remove the internal code from the course's name"""
    return "".join([c for c in name if c.isalpha() and not c.isdigit()]).rstrip()
