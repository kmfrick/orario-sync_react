import requests,json,dateutil.parser
from icalendar import Calendar, Event
import constant

cal = Calendar()

configFile = open(constant.CONFNAME)
conf = configFile.readlines()
courseType = conf[constant.TYPEPOS].rstrip("\n\r")
course = conf[constant.NAMEPOS].rstrip("\n\r")
year = conf[constant.YEARPOS].rstrip("\n\r")

timeTableUrl = constant.CRSPREF + courseType + "/" + course + constant.CRSSUFF + year + constant.CURRSUF
timeTable =  requests.get(url = timeTableUrl).json()

for e in timeTable[constant.EVENTS]:
    title = e[constant.TITLE]
    location = e[constant.ROOMS][0][constant.CLASSROOM] + ", " + e[constant.ROOMS][0][constant.CAMPUS]
    start = dateutil.parser.parse(e[constant.START])
    end = dateutil.parser.parse(e[constant.END])
    event = Event()
    event.add('summary', title)
    event.add('dtstart', start)
    event.add('dtend', end)
    event.add('location', location)
    cal.add_component(event)

courseId = timeTable[constant.CURR][0][constant.COURSE]

ical = open(courseId + "_" + course +  ".ics", 'wb')
ical.write(cal.to_ical())
ical.close()


