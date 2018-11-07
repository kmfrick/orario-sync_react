import re

import requests
from bs4 import BeautifulSoup
from bs4.dammit import EncodingDetector

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
                course_links.append((course_number, atag[constant.COURSENAMETAG], atag["href"]))
                course_numbers.append(course_number)
    course_links.sort()
    return {"links": course_links, "codes": course_numbers}


def get_school_url(school_links, school_number):
    school_url = school_links[school_number]["link"]
    if school_url[-3:] != "/it": school_url += "/it"
    return school_url


def get_course(course_links, course_number):
    for c in course_links:
        if c[0] == course_number:
            course_url = c[2]
            course_name = c[1]
            break
    else:
        course_url = constant.NOTFOUND
        course_name = constant.NOTFOUND
    return {"url": course_url, "name": course_name}
