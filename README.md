# orario-sync_unibo

This is a Python script that downloads a course's schedule from my college's servers and converts it to ical.
Right now it works for most of the courses taught in Italian at unibo.

Questo è uno script in Python che converte l'orario delle lezioni della mia università in formato ical.
Per ora funziona con la maggior parte dei corsi in italiano dell'unibo.

# Usage

Run orario-sync_genconf.py, then run orario-sync.py and import the generated ical file wherever.

Eseguire orario-sync_genconf.py, poi eseguire orario-sync.py e importare il file ical generato in qualunque programma vogliate.

# Routes

This script uses Flask to work as a backend for the React GUI I wrote. The routes used are:

- /getschools
  * Gets a list of unibo's schools

- /getcourses/<school_number>
  * Gets a list of the selected school's courses

- /getcurricula/<school_number>/<course_number>/\<year>
  * Gets a list of the available curricula for the selected course and year

- /getical/<school_number>/<course_number>/\<year>/\<curriculum>
  * Generates the iCal file with the schedule for the selected course/year/curriculum
  
Questo script usa Flask per funzionare come backend per l'interfaccia che ho scritto con React. Le routes che usa sono:

- /getschools
  * Genera una lista delle Scuole dell'unibo

- /getcourses/<school_number>
  * Genera una lista dei corsi di studio afferenti alla Scuola selezionata

- /getcurricula/<school_number>/<course_number>/\<year>
  * Genera una lista dei curricula disponibili per il corso e l'anno selezionati

- /getical/<school_number>/<course_number>/\<year>/\<curriculum>
  * Genera il file iCal contenente l'orario per il corso selezionato, nell'anno e per il curriculum selezionati
