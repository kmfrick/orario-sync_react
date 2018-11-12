# url building
TIMETABLEURLFORMAT = "{}/orario-lezioni/@@orario_reale_json?anno={}&curricula={}"
TIMETABLEURLFORMATEN = "{}/timetable/@@orario_reale_json?year={}&curricula={}"
CURRICULAURLFORMAT = "{}/orario-lezioni/@@available_curricula?anno={}"
CURRICULAURLFORMATEN = "{}/timetable/@@available_curricula?year={}"
SCHLTYPE = "internal-link"
CRSSUFF = "/corsi/corsi-di-studio"

# json fields
EVENTS = "events"
TITLE = "title"
ROOMS = "aule"
CLASSROOM = "des_risorsa"
CAMPUS = "des_ubicazione"
START = "start"
END = "end"
CURR = "curriculum"
CURRVAL = "value"
COURSE = "corso"
CURRNAME = "label"
CURRCRS = "corso"
CRSNAME = "name"
CRSURL = "url"

# html info
COURSELINK = "Sito del Corso"
COURSENAMETAG = "data-title"

# error handling
NOTFOUND = "NOTFOUND"
NO_LOC_AVAILABLE = "No location data available"

# config filename
CONFNAME = "orario-sync.ini"

# config fields
URLPOS = 0
NAMEPOS = 1
YEARPOS = 2
CURRPOS = 3

# list of schools
SCHOOLSURL = "https://www.unibo.it/it/ateneo/sedi-e-strutture/scuole"

# flask arguments
ARG_CURR = "curr"
ARG_YEAR = "year"
ARG_COURSE = "course"
ARG_SCHOOL = "school"
ARG_CLASSES = "classes"
