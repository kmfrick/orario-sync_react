from api.http_handler_base import JsonApiHandler
from api.getters import UpstreamDataError, get_department_names
from api.security import OriginNotAllowedError


class handler(JsonApiHandler):

    def do_GET(self):
        cors_origin = None
        try:
            cors_origin = self._resolve_cors_origin()
            self._json_response(get_department_names(), cors_origin=cors_origin)
        except OriginNotAllowedError:
            self._json_response({"error": "Origin not allowed"}, status=403)
        except UpstreamDataError:
            self._json_response({"error": "Unable to retrieve timetable data from UniBo"}, status=502, cors_origin=cors_origin)
        except Exception:
            self._json_response({"error": "Internal server error"}, status=500, cors_origin=cors_origin)
