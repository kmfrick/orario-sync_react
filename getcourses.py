import json

from http.server import BaseHTTPRequestHandler

from getters import *


class handler(BaseHTTPRequestHandler):

    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        args = get_args_from_url(self.requestline)
        school_index = args[constant.ARG_SCHOOL]
        school_links = get_school_links()
        school_url = get_school_url(school_links, school_index)
        course_list = get_course_list(school_url)
        message = json.dumps(course_list)
        self.wfile.write(message.encode())
        return
