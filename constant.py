# language
CRSLANG_IT = "it"
CRSLANG_EN = "en"

# url building

TIMETABLEURLFORMAT = {CRSLANG_IT: "{}/orario-lezioni/@@orario_reale_json?anno={}&curricula={}",
                      CRSLANG_EN: "{}/timetable/@@orario_reale_json?year={}&curricula={}"}
CURRICULAURLFORMAT = {CRSLANG_IT: "{}/orario-lezioni/@@available_curricula?anno={}",
                      CRSLANG_EN: "{}/timetable/@@available_curricula?year={}"}
TIMETABLEURLFORMATNOJSON = {CRSLANG_IT: "{}/orario-lezioni?calendar_view=&date=&anno={}&curricula={}",
                            CRSLANG_EN: "{}/timetable?calendar_view=&date=&anno={}&curricula={}"}
CHECKJSONURLFORMAT = {CRSLANG_IT: "{}/orario-lezioni",
                      CRSLANG_EN: "{}/timetable"}
SCHLTYPE = "output-list-school"
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
CLASSES = "insegnamenti"

# html info
COURSELINK = "Sito del Corso"
COURSENAMETAG = "data-title"
CLSLABELPOS = 3
CLSNOJSONFORMID = "insegnamenti-popup"
TIMETABLETBLCLASS = "timetable"

# error handling
NOTFOUND = "NOTFOUND"
NO_LOC_AVAILABLE = "No location data available"

# config fields
URLPOS = 0
NAMEPOS = 1
YEARPOS = 2
CURRPOS = 3

# list of schools
SCHOOLSURL = "https://www.unibo.it/it/didattica/corsi-di-studio/?sort=area"

# flask arguments
ARG_CURR = "curr"
ARG_YEAR = "year"
ARG_COURSE = "course"
ARG_SCHOOL = "school"
ARG_CLASSES = "classes"

# custom dictionary keys
CLSENDFLD = "end"
CLSSTARTFLD = "start"
LSNENDFLD = "end"
LSNSTARTFLD = "start"
TEACHERFLD = "teacher"
DOWFLD = "day"
NAMEFLD = "name"
CODEFLD = "code"
LINKFLD = "link"
LESSONSFLD = "lessons"
LOCATIONFLD = "location"

# ical file properties
ICALLOCATION = "location"
ICALEND = "dtend"
ICALSTART = "dtstart"
ICALTITLE = "summary"

# template for lesson dict
DEFLSN = {DOWFLD: "", CLSSTARTFLD: "", CLSENDFLD: "", TEACHERFLD: ""}
SCHLTAG = "dt"
