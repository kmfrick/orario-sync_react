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

try:
    courseNumber = int(input("Select your course's number from the list: "))
except ValueError:
    print("Not a number!")

try:
    year = int(input("Type the year you are enrolled in: "))
except ValueError:
    print("Not a number!")

#generate config file
configFileName = open(constant.CONFNAME, "w+")
configFileName.write(getCourseType(courseLinks[courseNumber]) + "\n")
configFileName.write(getCourseName(courseLinks[courseNumber]) + "\n")
configFileName.write(str(year) + "\n")
configFileName.close()


