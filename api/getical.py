from http.server import BaseHTTPRequestHandler

from api.getters import *


class handler(BaseHTTPRequestHandler):

    def do_GET(self):
        args = get_args_from_url(self.requestline)
        course_index = args[constant.ARG_COURSE]
        school_index = args[constant.ARG_SCHOOL] + 1
        year = args[constant.ARG_YEAR]
        curr_index = args[constant.ARG_CURR]
        selected_classes_btm = args[constant.ARG_CLASSES]
        course_list = get_course_list(school_index)
        course_code = get_course_code(course_list, course_index)
        course_name = get_safe_course_name(get_course_name(course_list, course_index))
        safe_course_name = get_safe_course_name(course_name)
        self.send_response(200)
        self.send_header("Content-type", "application/octet-stream")
        self.send_header("Content-Disposition",
                         "attachment; filename={}_{}_{}.ics".format(course_code, safe_course_name, year))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        course_url = get_course_url(course_list, course_index)
        curricula = get_curricula(course_url, year)
        curr = get_curr_code(curricula, curr_index)
        timetable = get_timetable(course_url, year, curr)
        classes = get_classes(course_url, year, curr)
		print(classes)
        selected_classes = []
        for (i, cur_class) in enumerate(classes, 0):
            if (1 << i) & selected_classes_btm:
                selected_classes.append(cur_class)
        calendar = get_ical_file(timetable, selected_classes)

        self.wfile.write(calendar)
        return
