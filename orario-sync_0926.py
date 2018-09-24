import urllib,json,dateutil.parser
from icalendar import Calendar, Event

cal = Calendar()

orariourl = urllib.urlopen("https://corsi.unibo.it/laurea/IngegneriaInformatica/orario-lezioni/@@orario_reale_json?anno=2&curricula=")

#TODO: different json for each cdl?

orario = json.load(orariourl)

for e in orario["events"]:
    location = e["aule"][0]["des_risorsa"] + ", " + e["aule"][0]["des_ubicazione"]
    title = e["title"]
    start = dateutil.parser.parse(e["start"])
    end = dateutil.parser.parse(e["end"])
    event = Event()
    event.add('summary', title)
    event.add('dtstart', start)
    event.add('dtend', end)
    event.add('location', location)
    cal.add_component(event)

#TODO: fewer magic constants

corso = orario["curriculum"][0]["corso"]
ical = open(corso + '.ics', 'wb')

#TODO: more significant name

ical.write(cal.to_ical())
ical.close()


