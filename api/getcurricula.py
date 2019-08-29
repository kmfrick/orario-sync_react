import json
from http.server import BaseHTTPRequestHandler

from api.getters import *


class handler(BaseHTTPRequestHandler):

    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        args = get_args_from_url(self.requestline)
        course_index = args[constant.ARG_COURSE]
        school_index = args[constant.ARG_SCHOOL] + 1
        year = args[constant.ARG_YEAR]
        course_list = get_course_list(school_index)
        course_url = get_course_url(course_list, course_index)
        curricula = get_curricula(course_url, year)
        message = json.dumps(curricula)
        self.wfile.write(message.encode())
        return
