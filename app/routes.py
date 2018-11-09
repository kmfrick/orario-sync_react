from flask import jsonify
from flask import send_from_directory

from app import app
from getters import *


@app.route("/getschools")
def getschools_json():
    return jsonify(get_school_links())


@app.route("/getcourses/<school_number>")
def getcourses_json(school_number):
    school_links = get_school_links()
    school_url = get_school_url(school_links, int(school_number))
    course_list = get_course_list(school_url)
    return jsonify(course_list)


@app.route("/getcurricula/<school_number>/<course_number>/<year>")
def getcurricula_json(school_number, course_number, year):
    school_links = get_school_links()
    school_url = get_school_url(school_links, int(school_number))
    course_list = get_course_list(school_url)
    course_url = get_course_url(course_list, int(course_number))
    curricula = get_curricula(course_url, int(year))
    return jsonify(curricula)


@app.route("/getical/<school_number>/<course_number>/<year>/<curriculum>")
def getical(school_number, course_number, year, curriculum):
    school_links = get_school_links()
    school_url = get_school_url(school_links, int(school_number))
    course_list = get_course_list(school_url)
    course_code = get_course_code(course_list, int(course_number))
    course_name = get_safe_course_name(get_course_name(course_list, int(course_number)))
    course_url = get_course_url(course_list, int(course_number))
    curricula = get_curricula(course_url, int(year))
    curriculum = get_curriculum(curricula, int(curriculum))
    timetable = get_timetable(course_url, year, curriculum)
    calendar = get_ical_file(timetable)
    filename = "{}_{}_{}.ics".format(course_name, course_code, year)

    ical = open(filename, 'wb')
    ical.write(calendar)
    ical.close()

    return send_from_directory("../", filename, as_attachment=True)
