import re

import dateutil.parser
import requests
from bs4 import BeautifulSoup
from bs4.dammit import EncodingDetector
from icalendar import Calendar, Event

import constant


def get_encoding(resp):
    http_encoding = resp.encoding if 'charset' in resp.headers.get('content-type', '').lower() else None
    html_encoding = EncodingDetector.find_declared_encoding(resp.content, is_html=True)
    encoding = html_encoding or http_encoding
    return encoding


def get_school_links():
    resp = requests.get(constant.SCHOOLSURL)
    soup = BeautifulSoup(resp.content, from_encoding=get_encoding(resp), features="html5lib")
    school_links = []
    for atag in soup.find_all('a', class_=constant.SCHLTYPE, href=True):
        school_links.append({"name": atag.contents[0], "link": atag['href']})
    return school_links


def get_school_url(school_links, school_index):
    school_url = school_links[school_index]["link"]
    if school_url[-3:] != "/it":
        school_url += "/it"
    return school_url


def get_course_list(school_url):
    course_list_url = school_url + constant.CRSSUFF
    resp = requests.get(course_list_url)
    soup = BeautifulSoup(resp.content, from_encoding=get_encoding(resp), features="html5lib")

    courses = []
    for atag in soup.find_all('a', href=True):
        if atag.contents:
            if atag.contents[0] == constant.COURSELINK:
                course_number = re.findall(r"\d+", atag[constant.COURSENAMETAG])[0]
                courses.append({"code": course_number, "name": atag[constant.COURSENAMETAG], "link": atag["href"]})
    return courses


def get_course_url(course_list, course_number):
    return course_list[course_number]["link"]


def get_course_name(course_list, course_number):
    return course_list[course_number]["name"]


def get_course_code(course_list, course_number):
    return course_list[course_number]["code"]


def get_curricula(course_url, year):
    curricula = []
    if "cycle" in course_url:
        curricula_req_url = constant.CURRICULAURLFORMATEN.format(course_url, year)
    else:
        curricula_req_url = constant.CURRICULAURLFORMAT.format(course_url, year)
    for curr in requests.get(curricula_req_url).json():
        curricula.append({"code": curr[constant.CURRVAL], "name": curr[constant.CURRNAME]})
    return curricula


def get_curriculum_name(curricula, curriculum_number):
    return curricula[curriculum_number]["name"]


def get_curriculum_code(curricula, curriculum_number):
    return curricula[curriculum_number]["code"]


def get_timetable(course_url, year, curriculum):
    timetable_url = constant.TIMETABLEURLFORMAT.format(course_url, year, curriculum)
    req = requests.get(url=timetable_url)
    return req.json()


def get_classes(course_url, year, curriculum):
    classes = []
    for _class in get_timetable(course_url, year, curriculum)["insegnamenti"]:
        classes.append(_class[1])
    return classes


def get_ical_file(timetable, classes):
    cal = Calendar()
    for e in timetable[constant.EVENTS]:
        title = e[constant.TITLE]
        if title in classes:
            if e[constant.ROOMS]:
                location = e[constant.ROOMS][0][constant.CLASSROOM] + ", " + e[constant.ROOMS][0][constant.CAMPUS]
            else:
                location = constant.NO_LOC_AVAILABLE
            start = dateutil.parser.parse(e[constant.START])
            end = dateutil.parser.parse(e[constant.END])
            event = Event()
            event.add("summary", title)
            event.add("dtstart", start)
            event.add("dtend", end)
            event.add("location", location)
            cal.add_component(event)
    return cal.to_ical()


def get_safe_course_name(name):
    return "".join([c for c in name if c.isalpha() and not c.isdigit()]).rstrip()
