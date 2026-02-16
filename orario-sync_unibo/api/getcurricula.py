from urllib.parse import parse_qs, urlparse

from api import constant
from api.getters import UpstreamDataError, get_course_list, get_course_url, get_curricula
from api.http_handler_base import JsonApiHandler
from api.security import (
    ClientInputError,
    OriginNotAllowedError,
    parse_non_negative_int,
    validate_year,
)


class handler(JsonApiHandler):

    def do_GET(self):
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)
        cors_origin = None
        try:
            cors_origin = self._resolve_cors_origin()
            school_index = parse_non_negative_int(params, constant.ARG_SCHOOL, default=0) + 1
            course_index = parse_non_negative_int(params, constant.ARG_COURSE, default=0)
            year = validate_year(parse_non_negative_int(params, constant.ARG_YEAR, default=0))

            course_list = get_course_list(school_index)
            if course_index >= len(course_list):
                raise ClientInputError("Parameter '{}' points outside available data".format(constant.ARG_COURSE))

            course_url = get_course_url(course_list, course_index)
            self._json_response(get_curricula(course_url, year), cors_origin=cors_origin)
        except OriginNotAllowedError:
            self._json_response({"error": "Origin not allowed"}, status=403)
        except (ClientInputError, IndexError, KeyError) as exc:
            self._json_response({"error": str(exc)}, status=400, cors_origin=cors_origin)
        except UpstreamDataError:
            self._json_response({"error": "Unable to retrieve timetable data from UniBo"}, status=502, cors_origin=cors_origin)
        except Exception:
            self._json_response({"error": "Internal server error"}, status=500, cors_origin=cors_origin)
