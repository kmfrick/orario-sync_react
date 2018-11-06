import requests
import dateutil.parser
from icalendar import Calendar, Event
import constant

cal = Calendar()

config_file = open(constant.CONFNAME)
conf = config_file.readlines()
course = "".join([c for c in conf[constant.NAMEPOS] if c.isalpha() and not c.isdigit()]).rstrip()
year = conf[constant.YEARPOS].rstrip()
timetable_url = conf[constant.URLPOS].rstrip() + constant.TIMETABLESUFF + year

timetable = requests.get(url=timetable_url).json()

for e in timetable[constant.EVENTS]:
    title = e[constant.TITLE]
    if e[constant.ROOMS]:
        location = e[constant.ROOMS][0][constant.CLASSROOM] + ", " + e[constant.ROOMS][0][constant.CAMPUS]
    else:
        location = "No location data available"
    start = dateutil.parser.parse(e[constant.START])
    end = dateutil.parser.parse(e[constant.END])
    event = Event()
    event.add('summary', title)
    event.add('dtstart', start)
    event.add('dtend', end)
    event.add('location', location)
    cal.add_component(event)

courseId = timetable[constant.CURR][0][constant.COURSE]

ical = open(courseId + "_" + course + ".ics", 'wb')
ical.write(cal.to_ical())
ical.close()


