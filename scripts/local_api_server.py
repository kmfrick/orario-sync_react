#!/usr/bin/env python3
"""Local HTTP server that emulates the backend API routes."""

import argparse
import json
import os
import sys
import threading
import time
from collections import defaultdict, deque
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

from api import constant
from api.getters import (
    UpstreamDataError,
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
from api.security import (
    ClientInputError,
    OriginNotAllowedError,
    extract_client_ip,
    parse_non_negative_int,
    resolve_cors_origin,
    validate_classes_mask,
    validate_year,
)

CACHE_TTL_SECONDS = int(os.getenv("BACKEND_CACHE_TTL_SECONDS", "300"))
RATE_LIMIT_WINDOW_SECONDS = int(os.getenv("BACKEND_RATE_LIMIT_WINDOW_SECONDS", "60"))
RATE_LIMIT_MAX_REQUESTS = int(os.getenv("BACKEND_RATE_LIMIT_MAX_REQUESTS", "120"))


class LocalApiHandler(BaseHTTPRequestHandler):
    _cache = {}
    _cache_lock = threading.Lock()
    _rate_buckets = defaultdict(deque)
    _rate_lock = threading.Lock()

    @classmethod
    def _cache_get(cls, key):
        now = time.time()
        with cls._cache_lock:
            entry = cls._cache.get(key)
            if entry is None:
                return None
            expires_at, value = entry
            if now >= expires_at:
                cls._cache.pop(key, None)
                return None
            return value

    @classmethod
    def _cache_put(cls, key, value):
        with cls._cache_lock:
            cls._cache[key] = (time.time() + CACHE_TTL_SECONDS, value)

    @classmethod
    def _rate_limit_allows(cls, client_key):
        now = time.time()
        cutoff = now - RATE_LIMIT_WINDOW_SECONDS
        with cls._rate_lock:
            bucket = cls._rate_buckets[client_key]
            while bucket and bucket[0] <= cutoff:
                bucket.popleft()
            if len(bucket) >= RATE_LIMIT_MAX_REQUESTS:
                return False
            bucket.append(now)
            return True

    def _cached_call(self, key, loader):
        cached = self._cache_get(key)
        if cached is not None:
            return cached
        value = loader()
        self._cache_put(key, value)
        return value

    def _set_headers(self, status=200, content_type="application/json", cors_origin=None, extra=None):
        self.send_response(status)
        self.send_header("Content-type", content_type)
        if cors_origin is not None:
            self.send_header("Access-Control-Allow-Origin", cors_origin)
            self.send_header("Vary", "Origin")
            self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
        if extra:
            for key, value in extra.items():
                self.send_header(key, value)
        self.end_headers()

    def _json_response(self, payload, status=200, cors_origin=None):
        self._set_headers(status=status, content_type="application/json", cors_origin=cors_origin)
        self.wfile.write(json.dumps(payload).encode("utf-8"))

    def _resolve_cors_origin(self):
        return resolve_cors_origin(self.headers.get("Origin"))

    @staticmethod
    def _require_indexed_item(items, index, field_name):
        if index >= len(items):
            raise ClientInputError("Parameter '{}' points outside available data".format(field_name))
        return items[index]

    def _parse_school(self, params):
        return parse_non_negative_int(params, constant.ARG_SCHOOL, default=0)

    def _parse_course(self, params):
        return parse_non_negative_int(params, constant.ARG_COURSE, default=0)

    def _parse_curriculum(self, params):
        return parse_non_negative_int(params, constant.ARG_CURR, default=0)

    def _parse_year(self, params):
        year = parse_non_negative_int(params, constant.ARG_YEAR, default=0)
        return validate_year(year)

    def _parse_classes_mask(self, params):
        mask = parse_non_negative_int(params, constant.ARG_CLASSES, default=0)
        return validate_classes_mask(mask)

    def _get_course_list(self, school_index):
        return self._cached_call(("courses", school_index), lambda: get_course_list(school_index + 1))

    def do_OPTIONS(self):
        try:
            cors_origin = self._resolve_cors_origin()
        except OriginNotAllowedError:
            self._json_response({"error": "Origin not allowed"}, status=403)
            return
        self._set_headers(status=204, cors_origin=cors_origin)

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        params = parse_qs(parsed.query)
        cors_origin = None

        try:
            cors_origin = self._resolve_cors_origin()
            client_ip = extract_client_ip(self)
            if not self._rate_limit_allows(client_ip):
                self._json_response({"error": "Rate limit exceeded", "path": path}, status=429, cors_origin=cors_origin)
                return

            if path in ("/api/getschools.py", "/api/getschools"):
                schools = self._cached_call("schools", get_department_names)
                self._json_response(schools, cors_origin=cors_origin)
                return

            if path in ("/api/getcourses.py", "/api/getcourses"):
                school_index = self._parse_school(params)
                self._json_response(self._get_course_list(school_index), cors_origin=cors_origin)
                return

            if path in ("/api/getcurricula.py", "/api/getcurricula"):
                school_index = self._parse_school(params)
                course_index = self._parse_course(params)
                year = self._parse_year(params)

                course_list = self._get_course_list(school_index)
                self._require_indexed_item(course_list, course_index, constant.ARG_COURSE)
                course_url = get_course_url(course_list, course_index)
                curricula = self._cached_call(
                    ("curricula", school_index, course_index, year),
                    lambda: get_curricula(course_url, year),
                )
                self._json_response(curricula, cors_origin=cors_origin)
                return

            if path in ("/api/getclasses.py", "/api/getclasses"):
                school_index = self._parse_school(params)
                course_index = self._parse_course(params)
                year = self._parse_year(params)
                curr_index = self._parse_curriculum(params)

                course_list = self._get_course_list(school_index)
                self._require_indexed_item(course_list, course_index, constant.ARG_COURSE)
                course_url = get_course_url(course_list, course_index)
                curricula = self._cached_call(
                    ("curricula", school_index, course_index, year),
                    lambda: get_curricula(course_url, year),
                )
                self._require_indexed_item(curricula, curr_index, constant.ARG_CURR)
                curr_code = get_curr_code(curricula, curr_index)
                classes = self._cached_call(
                    ("classes", school_index, course_index, year, curr_index),
                    lambda: get_classes(course_url, year, curr_code),
                )
                self._json_response(classes, cors_origin=cors_origin)
                return

            if path in ("/api/getical.py", "/api/getical"):
                school_index = self._parse_school(params)
                course_index = self._parse_course(params)
                year = self._parse_year(params)
                curr_index = self._parse_curriculum(params)
                selected_classes_btm = self._parse_classes_mask(params)

                course_list = self._get_course_list(school_index)
                self._require_indexed_item(course_list, course_index, constant.ARG_COURSE)
                course_url = get_course_url(course_list, course_index)
                curricula = self._cached_call(
                    ("curricula", school_index, course_index, year),
                    lambda: get_curricula(course_url, year),
                )
                self._require_indexed_item(curricula, curr_index, constant.ARG_CURR)
                curr_code = get_curr_code(curricula, curr_index)

                classes = self._cached_call(
                    ("classes", school_index, course_index, year, curr_index),
                    lambda: get_classes(course_url, year, curr_code),
                )
                selected_classes = []
                for i, current_class in enumerate(classes):
                    if (1 << i) & selected_classes_btm:
                        selected_classes.append(current_class)

                timetable = self._cached_call(
                    ("timetable", school_index, course_index, year, curr_index),
                    lambda: get_timetable(course_url, year, curr_code),
                )
                calendar = get_ical_file(timetable, selected_classes)

                course_code = get_course_code(course_list, course_index)
                course_name = get_safe_course_name(get_course_name(course_list, course_index))
                filename = "{}_{}_{}.ics".format(course_code, course_name, year)
                self._set_headers(
                    status=200,
                    content_type="application/octet-stream",
                    cors_origin=cors_origin,
                    extra={"Content-Disposition": "attachment; filename={}".format(filename)},
                )
                self.wfile.write(calendar)
                return

            self._json_response({"error": "Not found", "path": path}, status=404, cors_origin=cors_origin)
        except OriginNotAllowedError:
            self._json_response({"error": "Origin not allowed", "path": path}, status=403)
        except (ClientInputError, IndexError, KeyError) as exc:
            self._json_response({"error": str(exc), "path": path}, status=400, cors_origin=cors_origin)
        except UpstreamDataError:
            self._json_response(
                {"error": "Unable to retrieve timetable data from UniBo", "path": path},
                status=502,
                cors_origin=cors_origin,
            )
        except Exception as exc:  # noqa: BLE001 - explicit debugging aid for local runs
            print("Internal API error on {}: {}".format(path, exc), file=sys.stderr)
            self._json_response({"error": "Internal server error", "path": path}, status=500, cors_origin=cors_origin)


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
