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


def get_course_list(school_url):
    # get url for list of courses
    course_list_url = school_url + constant.CRSSUFF

    # generate sorted list of courses
    resp = requests.get(course_list_url)
    soup = BeautifulSoup(resp.content, from_encoding=get_encoding(resp), features="html5lib")

    course_links = []
    course_numbers = []
    for atag in soup.find_all('a', href=True):
        if atag.contents:
            if atag.contents[0] == constant.COURSELINK:
                course_number = re.findall(r"\d+", atag[constant.COURSENAMETAG])[0]
                course_links.append({"code": course_number, "name": atag[constant.COURSENAMETAG], "link": atag["href"]})
                course_numbers.append(course_number)
    return {"links": course_links, "codes": course_numbers}


def get_school_url(school_links, school_number):
    school_url = school_links[school_number]["link"]
    if school_url[-3:] != "/it": school_url += "/it"
    return school_url


def get_course(course_links, course_number):
    for c in course_links:
        if c["code"] == course_number:
            course_url = c["link"]
            course_name = c["name"]
            break
    else:
        course_url = constant.NOTFOUND
        course_name = constant.NOTFOUND
    return {"url": course_url, "name": course_name}


def get_timetable(course_url, year, curriculum):
    timetable_url = constant.TIMETABLEURLFORMAT.format(course_url, year, curriculum)
    req = requests.get(url=timetable_url)
    return req.json()


def get_ical_file(timetable):
    cal = Calendar()
    for e in timetable[constant.EVENTS]:
        title = e[constant.TITLE]
        if e[constant.ROOMS]:
            location = e[constant.ROOMS][0][constant.CLASSROOM] + ", " + e[constant.ROOMS][0][constant.CAMPUS]
        else:
            location = constant.NO_LOC_AVAILABLE
        start = dateutil.parser.parse(e[constant.START])
        end = dateutil.parser.parse(e[constant.END])
        event = Event()
        event.add('summary', title)
        event.add('dtstart', start)
        event.add('dtend', end)
        event.add('location', location)
        cal.add_component(event)
    return cal.to_ical()


def get_curricula(course_url, year):
    curr_codes = []
    curr_names = []
    for curr in requests.get(constant.CURRICULAURLFORMAT.format(course_url, year)).json():
        curr_codes.append(curr[constant.CURRVAL])
        curr_names.append(curr[constant.CURRNAME])
    return {constant.CURR: curr_codes, constant.CURRNAME: curr_names}


def get_safe_course_name(name):
    return "".join([c for c in name if c.isalpha() and not c.isdigit()]).rstrip()


def get_course_url(course_list, course_number):
    return course_list["links"][course_number]
