# orario-sync_unibo

This is a Python backend using Flask that downloads a course's schedule from my college's servers and converts it to ical.
Right now it works for the majority of unibo's courses.

Questo è uno backend in Python basato su Flask che converte l'orario delle lezioni della mia università in formato ical.
Per ora funziona con la maggior parte dei corsi dell'unibo.

# Usage

You can find a React GUI at <http://kmfrick.github.io/orario-sync_react>

Puoi trovare un'interfaccia basata su React all'indirizzo <http://kmfrick.github.io/orario-sync_react>

# Routes

- /getschools
  * Gets a list of unibo's schools
  * Genera una lista delle Scuole dell'unibo

- /getcourses/<school_number>
  * Gets a list of the selected school's courses
  * Genera una lista dei corsi di studio afferenti alla Scuola selezionata

- /getcurricula/<school_number>/<course_number>/\<year>
  * Gets a list of the available curricula for the selected course and year
  * Genera una lista dei curricula disponibili per il corso e l'anno selezionati

- /getical/<school_number>/<course_number>/\<year>/\<curriculum>
  * Generates the iCal file with the schedule for the selected course/year/curriculum
  * Genera il file iCal contenente l'orario per il corso selezionato, nell'anno e per il curriculum selezionati