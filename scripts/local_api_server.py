#!/usr/bin/env python3
"""Local HTTP server that emulates the backend API routes."""

import argparse
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

from api import constant
from api.getters import (
    get_classes,
    get_course_code,
    get_course_list,
    get_course_name,
    get_course_url,
    get_curr_code,
    get_curricula,
    get_department_names,
    get_ical_file,
    get_safe_course_name,
    get_timetable,
)


def _query_int(params, key, default=0):
    try:
        return int(params.get(key, [default])[0])
    except (ValueError, TypeError):
        return default


class LocalApiHandler(BaseHTTPRequestHandler):
    def _set_headers(self, status=200, content_type="application/json", extra=None):
        self.send_response(status)
        self.send_header("Content-type", content_type)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        if extra:
            for key, value in extra.items():
                self.send_header(key, value)
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        params = parse_qs(parsed.query)
        try:
            if path in ("/api/getschools.py", "/api/getschools"):
                self._json_response(get_department_names())
                return

            school_index = _query_int(params, constant.ARG_SCHOOL, 0) + 1
            course_index = _query_int(params, constant.ARG_COURSE, 0)
            year = _query_int(params, constant.ARG_YEAR, 0)
            curr_index = _query_int(params, constant.ARG_CURR, 0)
            selected_classes_btm = _query_int(params, constant.ARG_CLASSES, 0)
            course_list = get_course_list(school_index)

            if path in ("/api/getcourses.py", "/api/getcourses"):
                self._json_response(course_list)
                return

            course_url = get_course_url(course_list, course_index)
            curricula = get_curricula(course_url, year)

            if path in ("/api/getcurricula.py", "/api/getcurricula"):
                self._json_response(curricula)
                return

            curr = get_curr_code(curricula, curr_index)

            if path in ("/api/getclasses.py", "/api/getclasses"):
                self._json_response(get_classes(course_url, year, curr))
                return

            if path in ("/api/getical.py", "/api/getical"):
                classes = get_classes(course_url, year, curr)
                selected_classes = []
                for i, current_class in enumerate(classes):
                    if (1 << i) & selected_classes_btm:
                        selected_classes.append(current_class)
                timetable = get_timetable(course_url, year, curr)
                calendar = get_ical_file(timetable, selected_classes)

                course_code = get_course_code(course_list, course_index)
                course_name = get_safe_course_name(get_course_name(course_list, course_index))
                filename = "{}_{}_{}.ics".format(course_code, course_name, year)
                self._set_headers(
                    status=200,
                    content_type="application/octet-stream",
                    extra={"Content-Disposition": "attachment; filename={}".format(filename)},
                )
                self.wfile.write(calendar)
                return

            self._json_response({"error": "Not found", "path": path}, status=404)
        except Exception as exc:  # noqa: BLE001 - explicit debugging aid for local runs
            self._json_response({"error": str(exc), "path": path}, status=500)

    def _json_response(self, payload, status=200):
        self._set_headers(status=status, content_type="application/json")
        self.wfile.write(json.dumps(payload).encode("utf-8"))


def main():
    parser = argparse.ArgumentParser(description="Run local backend API server.")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", default=8000, type=int)
    args = parser.parse_args()

    server = ThreadingHTTPServer((args.host, args.port), LocalApiHandler)
    print("Local API running on http://{}:{}/api".format(args.host, args.port))
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
