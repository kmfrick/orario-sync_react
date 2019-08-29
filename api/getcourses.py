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
        school_id = args[constant.ARG_SCHOOL] + 1
        course_list = get_course_list(school_id)
        print(course_list)
        message = json.dumps(course_list)
        self.wfile.write(message.encode())
        return
