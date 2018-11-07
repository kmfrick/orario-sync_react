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
    soup = BeautifulSoup(resp.content, from_encoding=get_encoding(resp), features="lxml")
    school_links = []
    for atag in soup.find_all('a', class_=constant.SCHLTYPE, href=True):
        school_links.append((atag.contents[0], atag['href']))
    school_links.sort()
    return school_links


def get_course_list(school_url):
    # get url for list of courses
    course_list_url = school_url + constant.CRSSUFF

    # generate sorted list of courses
    resp = requests.get(course_list_url)
    soup = BeautifulSoup(resp.content, from_encoding=get_encoding(resp), features="lxml")

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
    school_url = school_links[school_number][1]
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


def print_courses(course_links):
    for course_link in course_links:
        print(course_link[0], ": " + course_link[1])


def print_schools(school_links):
    for i, school_link in enumerate(school_links, 0):
        print(i, ": " + school_link[0])


# prompts
school_links = get_school_links()
print_schools(school_links)

while 1:
    try:
        school_number = int(input("Select your school from the list: "))
        while school_number < 0 or school_number > len(school_links):
            school_number = int(input("The school you selected is not on the list. Enter your course number: "))
    except ValueError:
        print("Not a number!")
    break

course_list = get_course_list(get_school_url(school_links, school_number))
course_numbers = course_list["codes"]
course_links = course_list["links"]
print_courses(course_links)

while 1:
    try:
        course_number = input("Select your course's number from the list: ")
        while str(course_number) not in course_numbers:
            course_number = input("The course you selected is not on the list. Enter your course number: ")
    except ValueError:
        print("Not a number!")
    break

course = get_course(course_links, course_number)

while 1:
    try:
        year = int(input("Type the year you are enrolled in: "))
        while year < 0:
            year = int(input("This is a timetable app, not a time machine! Enter your year: "))
    except ValueError:
        print("Not a number!")
    break

# generate config file
configFileName = open(constant.CONFNAME, "w+")
configFileName.write(course["url"] + "\n")
configFileName.write(course["name"] + "\n")
configFileName.write(str(year) + "\n")
configFileName.close()
