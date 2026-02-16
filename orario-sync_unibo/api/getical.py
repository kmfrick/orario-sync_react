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
    get_ical_file,
    get_safe_course_name,
    get_timetable,
)
from api.http_handler_base import JsonApiHandler
from api.security import (
    ClientInputError,
    OriginNotAllowedError,
    parse_non_negative_int,
    validate_classes_mask,
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
            curr_index = parse_non_negative_int(params, constant.ARG_CURR, default=0)
            selected_classes_btm = validate_classes_mask(parse_non_negative_int(params, constant.ARG_CLASSES, default=0))

            course_list = get_course_list(school_index)
            if course_index >= len(course_list):
                raise ClientInputError("Parameter '{}' points outside available data".format(constant.ARG_COURSE))

            course_code = get_course_code(course_list, course_index)
            course_name = get_safe_course_name(get_course_name(course_list, course_index))
            safe_course_name = get_safe_course_name(course_name)
            course_url = get_course_url(course_list, course_index)
            curricula = get_curricula(course_url, year)
            if curr_index >= len(curricula):
                raise ClientInputError("Parameter '{}' points outside available data".format(constant.ARG_CURR))

            curr = get_curr_code(curricula, curr_index)
            timetable = get_timetable(course_url, year, curr)
            classes = get_classes(course_url, year, curr)
            selected_classes = []
            for i, cur_class in enumerate(classes):
                if (1 << i) & selected_classes_btm:
                    selected_classes.append(cur_class)
            calendar = get_ical_file(timetable, selected_classes)

            self._set_headers(
                status=200,
                content_type="application/octet-stream",
                cors_origin=cors_origin,
                extra_headers={
                    "Content-Disposition": "attachment; filename={}_{}_{}.ics".format(course_code, safe_course_name, year)
                },
            )
            self.wfile.write(calendar)
        except OriginNotAllowedError:
            self._json_response({"error": "Origin not allowed"}, status=403)
        except (ClientInputError, IndexError, KeyError) as exc:
            self._json_response({"error": str(exc)}, status=400, cors_origin=cors_origin)
        except UpstreamDataError:
            self._json_response({"error": "Unable to retrieve timetable data from UniBo"}, status=502, cors_origin=cors_origin)
        except Exception:
            self._json_response({"error": "Internal server error"}, status=500, cors_origin=cors_origin)
