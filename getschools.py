import json

from http.server import BaseHTTPRequestHandler

from getters import get_school_links


class handler(BaseHTTPRequestHandler):

    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        message = json.dumps(get_school_links())
        self.wfile.write(message.encode())
        return
