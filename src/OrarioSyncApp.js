import React from "react";
import SchoolList from "./SchoolList";
import CourseList from "./CourseList";

class OrarioSyncApp extends React.Component {
    state = {schools: [], courses: ["init"], schoolNumber : 0};
    componentDidMount() {
        fetch("https://orario-syncunibo-pnmcnmxgjl.now.sh/getschools")
            .then(response => response.json())
            .then(data => {
                this.setState({schools: data});
            });
    }
    componentDidUpdate(prevProps, prevState) {
        if (prevState.schoolNumber !== this.state.schoolNumber) {
                fetch("https://orario-syncunibo-pnmcnmxgjl.now.sh/getcourses/" + this.state.schoolNumber)
                    .then(response => response.json())
                    .then(data => this.setState({courses: data.links}));
        }
    }
    render() {
        const schools = this.state.schools;
        if (!schools.length) return <span>Getting schools...</span>;
        let schoolNames = [];
        schools.forEach(item => schoolNames.push(item.name));
        const courses = this.state.courses;
        if (!courses.length && this.state.courses !== ["init"]) return <span>Getting courses...</span>;
        let courseNames = [];
        courses.forEach(item => courseNames.push(item.name));
        return (
            <React.Fragment>
                <h1>OrarioSync</h1>
                <h2>Seleziona la tua Scuola</h2>
                <SchoolList items = {schoolNames} onSelect={selectedSchoolNumber => this.setState({schoolNumber : selectedSchoolNumber})}/>
                <h2>Seleziona il tuo corso di studi</h2>
                <CourseList items={courseNames} onSelect={selectedCourseNumber => {
                    let selectedCourse = courseNames[selectedCourseNumber];
                    let selectedSchool = schoolNames[this.state.schoolNumber];
                    alert("Selected course " + selectedCourse + " in school " + selectedSchool);

                }}/>
            </React.Fragment>
        )
    }
}

export default OrarioSyncApp;