from bs4 import BeautifulSoup
from bs4.dammit import EncodingDetector
import requests
import constant
import re


def get_encoding(resp):
    http_encoding = resp.encoding if 'charset' in resp.headers.get('content-type', '').lower() else None
    html_encoding = EncodingDetector.find_declared_encoding(resp.content, is_html=True)
    encoding = html_encoding or http_encoding
    return encoding


# get list of schools
resp = requests.get(constant.SCHOOLSURL)
soup = BeautifulSoup(resp.content, from_encoding=get_encoding(resp), features="lxml")
school_links = []
for atag in soup.find_all('a', class_=constant.SCHLTYPE, href=True):
    school_links.append((atag.contents[0], atag['href']))
school_links.sort()

print("Found schools:")
for i, school_link in enumerate(school_links, 0):
    print(i, ": " + school_link[0])

# school selection
while 1:
    try:
        school_number = int(input("Select your school from the list: "))
        while school_number < 0 or school_number > len(school_links):
            school_number = int(input("The school you selected is not on the list. Enter your course number: "))
    except ValueError:
        print("Not a number!")
    break
school_url = school_links[school_number][1]
if school_url[-3:] != "/it": school_url += "/it"

# get url for list of courses
course_list_url = school_url + constant.CRSSUFF

# generate sorted list of courses
resp = requests.get(course_list_url)
soup = BeautifulSoup(resp.content, from_encoding=get_encoding(resp), features="lxml")

course_links = []
course_numbers = []
for atag in soup.find_all('a', href=True):
    if atag.contents:
        if atag.contents[0] == "Sito del Corso":
            course_number = re.findall(r"\d+", atag["data-title"])[0]
            course_links.append((course_number, atag["data-title"], atag["href"]))
            course_numbers.append(course_number)
course_links.sort()

print("Found courses:")
for course_link in course_links:
    print(course_link[0], ": " + course_link[1])

while 1:
    try:
        course_number = input("Select your course's number from the list: ")
        while str(course_number) not in course_numbers:
            course_number = input("The course you selected is not on the list. Enter your course number: ")
    except ValueError:
        print("Not a number!")
    break

for c in course_links:
    if c[0] == course_number:
        course_url = c[2]
        course_name = c[1]
        break
else:
    course_url = "NOTFOUND"
    course_name = "NOTFOUND"

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
configFileName.write(course_url + "\n")
configFileName.write(course_name + "\n")
configFileName.write(str(year) + "\n")
configFileName.close()
