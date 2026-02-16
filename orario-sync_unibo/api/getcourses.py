from urllib.parse import parse_qs, urlparse

from api import constant
from api.getters import UpstreamDataError, get_course_list
from api.http_handler_base import JsonApiHandler
from api.security import ClientInputError, OriginNotAllowedError, parse_non_negative_int


class handler(JsonApiHandler):

    def do_GET(self):
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)
        cors_origin = None
        try:
            cors_origin = self._resolve_cors_origin()
            school_id = parse_non_negative_int(params, constant.ARG_SCHOOL, default=0) + 1
            self._json_response(get_course_list(school_id), cors_origin=cors_origin)
        except OriginNotAllowedError:
            self._json_response({"error": "Origin not allowed"}, status=403)
        except ClientInputError as exc:
            self._json_response({"error": str(exc)}, status=400, cors_origin=cors_origin)
        except UpstreamDataError:
            self._json_response({"error": "Unable to retrieve timetable data from UniBo"}, status=502, cors_origin=cors_origin)
        except Exception:
            self._json_response({"error": "Internal server error"}, status=500, cors_origin=cors_origin)
