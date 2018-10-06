from bs4 import BeautifulSoup
from bs4.dammit import EncodingDetector
import requests
import constant

def getCourseType(courseLink):
    courseName = courseLink[len(constant.CRSPREF):]
    return courseName.split("/", 2)[constant.TYPEPOS]
    
def getCourseName(courseLink):
    courseName = courseLink[len(constant.CRSPREF):]
    return courseName.split("/", 2)[constant.NAMEPOS]

#get raw data
resp = requests.get(constant.TIMETABLEURL)
http_encoding = resp.encoding if 'charset' in resp.headers.get('content-type', '').lower() else None
html_encoding = EncodingDetector.find_declared_encoding(resp.content, is_html=True)
encoding = html_encoding or http_encoding
soup = BeautifulSoup(resp.content, from_encoding=encoding, features="lxml")

#generated sorted list of courses
courseLinks = []
for atag in soup.find_all('a', href=True):
    if constant.CRSPREF in atag['href']:
        courseLinks.append(atag['href'])
courseLinks.sort()

print("Found courses:\n")    
for i, courseLink in enumerate(courseLinks, 0):    
    print(i, ": " + getCourseType(courseLink) + "/" + getCourseName(courseLink))

valid = True

try:
    courseNumber = int(input("Select your course's number from the list: "))
    while (courseNumber < 0 or courseNumber > len(courseLinks)):
        courseNumber = int(input("The course you selected is not on the list. Enter your course number: "))
except ValueError:
    print("Not a number!")
    valid = False

try:
    year = int(input("Type the year you are enrolled in: "))
    while (year < 0):
        year = int(input("This is a timetable app, not a time machine! Enter your year: "))
except ValueError:
    valid = False
    print("Not a number!")

if (valid): 
#generate config file
    configFileName = open(constant.CONFNAME, "w+")
    configFileName.write(getCourseType(courseLinks[courseNumber]) + "\n")
    configFileName.write(getCourseName(courseLinks[courseNumber]) + "\n")
    configFileName.write(str(year) + "\n")
    configFileName.close()
else:
    print("You entered invalid parameters")


