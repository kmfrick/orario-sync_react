import React from "react";
import SelectList from "./SelectList";

const beReqUrl = "https://orario-syncunibo-obxughlhjx.now.sh";
const beGetSchools = "/getschools";
const beGetCourses = "/getcourses/";
const beGetCurricula = "/getcurricula/";
const beGetCalendar = "/getical/";
const mainTitle = <>OrarioSync</>;
const schoolHeader = <>Seleziona la tua Scuola</>;
const courseHeader = <>Seleziona il tuo corso di studi</>;
const yearHeader = <>Seleziona l'anno a cui sei iscritto</>;
const curriculumHeader = <>Seleziona il tuo curriculum</>;
const buttonContent = <>Scarica orario in iCal</>;

const courseTypeRE = new RegExp("\\[(.*?)]");

class OrarioSyncApp extends React.Component {
    state = {
        schools: [],
        schoolNumber: -1,
        courses: [],
        courseNumber: -1,
        courseType: "",
        years: [],
        year: -1,
        curricula: [],
        curriculumNumber: -1,
    };

    componentDidMount() {
        fetch(beReqUrl + beGetSchools)
            .then(response => response.json())
            .then(data => {
                this.setState({schools: data});
            });
    }

    componentDidUpdate(prevProps, prevState) {

        const schoolNumber = this.state.schoolNumber;
        const courseNumber = this.state.courseNumber;
        const courseType = this.state.courseType;
        const year = this.state.year;
        if (prevState.schoolNumber !== schoolNumber) {
            fetch(beReqUrl + beGetCourses + schoolNumber)
                .then(response => response.json())
                .then(data => this.setState({courses: data.links}));
            this.setState({
                courseNumber: -1,
                courseType: "",
                year: -1,
                curricula: [],
                curriculumNumber: -1
            });

        }
        if (prevState.courseType !== courseType) {
            const durations = {"[LMCU]": 6, "[L]": 3, "[LM]": 2, "": 0};
            const yearLabels = ["Primo", "Secondo", "Terzo", "Quarto", "Quinto", "Sesto"];
            let items = [];
            let year_numbers = [...Array(durations[this.state.courseType]).keys()];
            year_numbers.forEach(i => items.push(yearLabels[i]));
            this.setState({years: items});
        }
        if ((prevState.courseNumber !== courseNumber && year > 0) || prevState.year !== year) {
            fetch(beReqUrl + beGetCurricula + schoolNumber + "/" + courseNumber + "/" + year)
                .then(response => response.json())
                .then(data => this.setState({curricula: data.label}));
            this.setState({
                curricula: [],
                curriculumNumber: -1
            });
        }

    }

    render() {
        const {schools} = this.state;
        const {schoolNumber} = this.state;
        const {courses} = this.state;
        const {courseType} = this.state;
        const {courseNumber} = this.state;
        const {year} = this.state;
        const {curricula} = this.state;
        const {curriculumNumber} = this.state;

        if (!schools.length) return <span>Getting schools...</span>;
        let schoolNames = [];
        schools.forEach(item => schoolNames.push(item.name));

        if (!courses.length && schoolNumber >= 0) return <span>Getting courses...</span>;
        let courseNames = [];
        courses.forEach(item => courseNames.push(item.name));

        if (!curricula.length && year >= 0) return <span>Getting curricula...</span>;

        return (
            <>
                <h1>{mainTitle}</h1>
                <h2>{schoolHeader}</h2>
                <SelectList items={schoolNames} onSelect={selected =>
                    this.setState({schoolNumber: selected})
                }/>
                {courses.length &&
                <>
                    <h2>{courseHeader}</h2>
                    <SelectList items={courseNames} onSelect={selected => {
                        this.setState({courseNumber: selected});
                        this.setState({courseType: courseTypeRE.exec(courseNames[selected])[0]});
                    }}/>
                </>}
                {courseType.length &&
                <>
                    <h2>{yearHeader}</h2>
                    <SelectList items={this.state.years} onSelect={selected => {
                        this.setState({year: selected + 1});
                    }}/>

                </>}
                {year >= 0 &&
                <>
                    <h2>{curriculumHeader}</h2>
                    <SelectList items={this.state.curricula} onSelect={selected => {
                        this.setState({curriculumNumber: selected})
                    }}/>
                </>}
                {curriculumNumber >= 0 &&
                <div>
                    <button
                        type="button"
                        onClick={e => window.open(beReqUrl + beGetCalendar + schoolNumber + "/" + courseNumber + "/" + year + "/" + curriculumNumber)}>
                        {buttonContent}
                    </button>
                </div>}
            </>
        )
    }
}

export default OrarioSyncApp;