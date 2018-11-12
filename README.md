# orario-sync_unibo

This is a Python backend using Flask that downloads a course's schedule from my college's servers and converts it to ical.
Right now it works for the majority of unibo's courses.

Questo è uno backend in Python basato su Flask che converte l'orario delle lezioni della mia università in formato ical.
Per ora funziona con la maggior parte dei corsi dell'unibo.

# Usage

A React-based GUI is available at <http://kmfrick.github.io/orario-sync_react>

Un'interfaccia basata su React è disponibile all'indirizzo <http://kmfrick.github.io/orario-sync_react>

# Routes

- /getschools
  * Gets a list of unibo's schools
  * Genera una lista delle Scuole dell'unibo

- /getcourses
  * Gets a list of the selected school's courses
  * Genera una lista dei corsi di studio afferenti alla Scuola selezionata
  * args: school

- /getcurricula
  * Gets a list of the available curricula for the selected course and year
  * Genera una lista dei curricula disponibili per il corso di studio e l'anno selezionati
  * args: school, course_number, year
  
- /getclasses
        * Gets a list of the available for the selected course, year and curriculum
        * Genera una lista dei corsi disponibili per il corso di studi, nell'anno e per il curriculum selezionati
        * args: school, course_number, year, curr

- /getical
  * Generates the iCal file with the schedule for the selected course/year/curriculum, with only the selected classes included
  * Uses a bitmask to map which classes are selected
  * Genera il file iCal contenente l'orario per il corso selezionato, nell'anno e per il curriculum selezionati, includendo solo i corsi selezionati
  * Usa una maschera binaria per esprimere le classi selezionate
  * args: school, course_number, year, curr, classes