import constant
from getters import get_timetable, get_ical_file, get_safe_course_name

config_file = open(constant.CONFNAME)
conf = config_file.readlines()

course = get_safe_course_name(conf[constant.NAMEPOS])
course_url = conf[constant.URLPOS].rstrip()
year = conf[constant.YEARPOS].rstrip()
curriculum = conf[constant.CURRPOS].rstrip()
timetable = get_timetable(course_url, year, curriculum)
course_code = "0000"
for i in range(0, len(timetable[constant.CURR])):
    if timetable[constant.CURR][i][constant.CURR] == curriculum:
        course_code = timetable[constant.CURR][i][constant.CURRCRS]

filename = "{}_{}.ics"

ical = open(filename.format(course_code, course), 'wb')
ical.write(get_ical_file(timetable))
ical.close()
