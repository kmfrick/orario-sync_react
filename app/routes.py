from flask import jsonify
from flask import request
from flask import send_from_directory

from app import app
from getters import *


@app.route("/getschools")
def getschools_json():
    return jsonify(get_school_links())


@app.route("/getcourses")
def getcourses_json():
    school_index = request.args.get(constant.ARG_SCHOOL, type=int)
    school_links = get_school_links()
    school_url = get_school_url(school_links, school_index)
    course_list = get_course_list(school_url)
    return jsonify(course_list)


@app.route("/getcurricula")
def getcurricula_json():
    school_index = request.args.get(constant.ARG_SCHOOL, type=int)
    course_index = request.args.get(constant.ARG_COURSE, type=int)
    year = request.args.get(constant.ARG_YEAR, type=int)
    school_links = get_school_links()
    school_url = get_school_url(school_links, school_index)
    course_list = get_course_list(school_url)
    course_url = get_course_url(course_list, course_index)
    curricula = get_curricula(course_url, year)
    return jsonify(curricula)


@app.route("/getclasses")
def getclasses():
    school_index = request.args.get(constant.ARG_SCHOOL, type=int)
    course_index = request.args.get(constant.ARG_COURSE, type=int)
    year = request.args.get(constant.ARG_YEAR, type=int)
    curr_index = request.args.get(constant.ARG_CURR, type=int)
    school_links = get_school_links()
    school_url = get_school_url(school_links, school_index)
    course_list = get_course_list(school_url)
    course_url = get_course_url(course_list, course_index)
    curricula = get_curricula(course_url, year)
    curr = get_curr_code(curricula, curr_index)
    return jsonify(get_classes(course_url, year, curr))


@app.route("/gettimetablenojson")
def gettimetablenojson():
    school_index = request.args.get(constant.ARG_SCHOOL, type=int)
    course_index = request.args.get(constant.ARG_COURSE, type=int)
    year = request.args.get(constant.ARG_YEAR, type=int)
    curr_index = request.args.get(constant.ARG_CURR, type=int)
    school_links = get_school_links()
    school_url = get_school_url(school_links, school_index)
    course_list = get_course_list(school_url)
    course_url = get_course_url(course_list, course_index)
    curricula = get_curricula(course_url, year)
    curr = get_curr_code(curricula, curr_index)
    return jsonify(get_timetable_no_json(course_url, year, curr))

@app.route("/getical")
def getical():
    school_index = request.args.get(constant.ARG_SCHOOL, type=int)
    course_index = request.args.get(constant.ARG_COURSE, type=int)
    year = request.args.get(constant.ARG_YEAR, type=int)
    curr_index = request.args.get(constant.ARG_CURR, type=int)
    school_links = get_school_links()
    school_url = get_school_url(school_links, school_index)
    course_list = get_course_list(school_url)
    course_code = get_course_code(course_list, course_index)
    course_name = get_safe_course_name(get_course_name(course_list, course_index))
    course_url = get_course_url(course_list, course_index)
    curricula = get_curricula(course_url, year)
    curr_index = get_curr_code(curricula, curr_index)
    timetable = get_timetable(course_url, year, curr_index)
    selected_classes_btm = request.args.get(constant.ARG_CLASSES, type=int)  # bitmask.
    classes = get_classes(course_url, year, curr_index)
    selected_classes = []
    for (i, _class) in enumerate(classes, 0):
        if (1 << i) & selected_classes_btm:
            selected_classes.append(_class)
    calendar = get_ical_file(timetable, selected_classes)
    filename = "{}_{}_{}.ics".format(course_name, course_code, year)

    ical = open(filename, "wb")
    ical.write(calendar)
    ical.close()

    return send_from_directory("../", filename, as_attachment=True)
