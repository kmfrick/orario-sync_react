import constant
from getters import get_school_links, get_course_list, get_school_url, get_course, get_curricula


def print_courses(course_links):
    for course_link in course_links:
        print(course_link["code"], ": " + course_link["name"])


def print_schools(school_links):
    for i, school_link in enumerate(school_links, 0):
        print(i, ": " + school_link["name"])


def print_curricula(curricula):
    for curr_code, curr_name in zip(curricula[constant.CURR], curricula[constant.CURRNAME]):
        print("{} - {}".format(curr_code, curr_name))


# prompts
school_links = get_school_links()
print_schools(school_links)

while 1:
    try:
        school_number = int(input("Select your school from the list: "))
        while school_number < 0 or school_number > len(school_links):
            school_number = int(input("The school you selected is not on the list. Enter your course number: "))
    except ValueError:
        print("Not a number!")
    break

course_list = get_course_list(get_school_url(school_links, school_number))
course_numbers = course_list["codes"]
course_links = course_list["links"]
print_courses(course_links)

while 1:
    try:
        course_number = input("Select your course's number from the list: ")
        while str(course_number) not in course_numbers:
            course_number = input("The course you selected is not on the list. Enter your course number: ")
    except ValueError:
        print("Not a number!")
    break

course = get_course(course_links, course_number)

while 1:
    try:
        year = int(input("Type the year you are enrolled in: "))
        while year < 0:
            year = int(input("This is a timetable app, not a time machine! Enter your year: "))
    except ValueError:
        print("Not a number!")
    break

curricula = get_curricula(course[constant.CRSURL], year)
print_curricula(curricula)
curriculum_codes = curricula[constant.CURR]

while 1:
    try:
        curr_code = input("Select your curriculum from the list: ")
        while str(curr_code) not in curriculum_codes:
            curr_code = input("The curriculum you selected is not on the list. Enter your curriculum number: ")
    except ValueError:
        print("Not a number!")
    break

# generate config file
configFileName = open(constant.CONFNAME, "w+")
configFileName.write(course[constant.CRSURL] + "\n")
configFileName.write(course[constant.CRSNAME] + "\n")
configFileName.write(str(year) + "\n")
configFileName.write(str(curr_code) + "\n")
configFileName.close()
