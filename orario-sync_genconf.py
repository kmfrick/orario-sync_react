from getters import *

def print_courses(course_links):
    for course_link in course_links:
        print(course_link[0], ": " + course_link[1])


def print_schools(school_links):
    for i, school_link in enumerate(school_links, 0):
        print(i, ": " + school_link[0])


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

# generate config file
configFileName = open(constant.CONFNAME, "w+")
configFileName.write(course["url"] + "\n")
configFileName.write(course["name"] + "\n")
configFileName.write(str(year) + "\n")
configFileName.close()
