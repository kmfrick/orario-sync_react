//TODO: autoscroll

import React from "react";
import SelectList from "./SelectList";
import BitSet from "bitset"
import { getYearLabelsForCourseType, resolveCourseType } from "./courseUtils";

const defaultBackendUrl = process.env.NODE_ENV === "development" ? "http://127.0.0.1:8000/api" : "";
const beReqUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || defaultBackendUrl).replace(/\/+$/, "");
const beParamSchool = "?school=";
const beParamCourse = "&course=";
const beParamYear = "&year=";
const beParamCurr = "&curr=";
const beParamClsBtm = "&classes=";
const beGetSchools = "/getschools.py";
const beGetCourses = "/getcourses.py";
const beGetCurricula = "/getcurricula.py";
const beGetClasses = "/getclasses.py";
const beGetCalendar = "/getical.py";

const mainTitle = <>OrarioSync</>;
const schoolHeader = <>Seleziona il tuo ambito di studi</>;
const courseHeader = <>Seleziona il tuo corso di studi</>;
const yearHeader = <>Seleziona l'anno a cui sei iscritto</>;
const curriculumHeader = <>Seleziona il tuo curriculum</>;
const classesHeader = <>Seleziona i corsi che segui</>;
const buttonContent = <>Scarica orario in iCal</>;


class OrarioSyncApp extends React.Component {
    state = {
        schools: [],
        schoolIndex: -1,
        courses: [],
        courseIndex: -1,
        courseType: "",
        years: [],
        year: -1,
        curricula: [],
        curriculumIndex: -1,
        classes: [],
        selectedClasses: [],
        classesBtm: BitSet.fromBinaryString("0"),
        listBgColor: "#fafafa",
        listTextColor: "#000000",
        listSelColor: "#d7e7ff"
    };

    componentDidMount() {
        fetch(beReqUrl + beGetSchools)
            .then(response => response.json())
            .then(data => {
                this.setState({schools: data});
            });
    }

    componentDidUpdate(prevProps, prevState) {
        const colors = [
            "#EFAA00",
            "#FF7D18",
            "#68A9E0",
            "#000000",
            "#AA005F",
            "#CE1126",
            "#8B2346",
            "#AA005F",
            "#008633",
            "#008633",
            "#FF7D18",
            "#CE1126",
            "#8B2346",
            "#EFAA00",
            "#AA005F",
            "#FFFFFF"];
        const schoolIndex = this.state.schoolIndex;
        const courseIndex = this.state.courseIndex;
        const courseType = this.state.courseType;
        const curriculumIndex = this.state.curriculumIndex;
        const selectedClasses = this.state.selectedClasses;
        const year = this.state.year;
        if (prevState.schoolIndex !== schoolIndex) {
            fetch(beReqUrl + beGetCourses + beParamSchool + schoolIndex)
                .then(response => response.json())
                .then(data => this.setState({courses: data}));
            this.setState({
                courseIndex: -1,
                courseType: "",
                year: -1,
                curricula: [],
                curriculumIndex: -1
            });
            document.body.style.borderColor = colors[schoolIndex];

        }
        if (prevState.courseType !== courseType) {
            this.setState({years: getYearLabelsForCourseType(courseType)});
        }
        if ((prevState.courseIndex !== courseIndex && year > 0) || prevState.year !== year) {
            fetch(beReqUrl + beGetCurricula + beParamSchool + schoolIndex + beParamCourse + courseIndex + beParamYear + year)
                .then(response => response.json())
                .then(data => this.setState({curricula: data}));
            this.setState({
                curricula: [],
                curriculumIndex: -1
            });
        }
        if (prevState.curriculumIndex !== curriculumIndex) {
            fetch(beReqUrl + beGetClasses + beParamSchool + schoolIndex + beParamCourse + courseIndex + beParamYear + year + beParamCurr + curriculumIndex)
                .then(response => response.json())
                .then(data => this.setState({classes: data}));
            this.setState({
                classes: [],
                selectedClasses: [],
                classesBtm: BitSet.fromBinaryString("0")
            });
        }
        if (prevState.selectedClasses !== selectedClasses) {
            let counts = {};

            for (let i = 0; i < selectedClasses.length; i++) {
                let num = selectedClasses[i];
                counts[num] = counts[num] ? counts[num] + 1 : 1;
            }
            let newClasses = [];
            selectedClasses.forEach(item => {
                if ((counts[item] % 2) !== 0) newClasses.push(item);
            });
            let newBtm = BitSet.fromBinaryString("0");
            newClasses.forEach(item => newBtm.flip(item));
            this.setState({classesBtm: newBtm});
        }
    }


    render() {
        const {schools} = this.state;
        const {schoolIndex} = this.state;
        const {courses} = this.state;
        const {courseType} = this.state;
        const {courseIndex} = this.state;
        const {year} = this.state;
        const {curricula} = this.state;
        const {curriculumIndex} = this.state;
        const {classes} = this.state;
        const {selectedClasses} = this.state;
        const {classesBtm} = this.state;
        const listStyle = {
            backgroundColor: this.state.listBgColor,
            color: this.state.listTextColor,
        };
        const padded = {
            fontSize: "18pt",
            padding: "16px",
            margin: "16px"
        };

        if (!schools.length) return <span>Inizializzazione in breve tempo...</span>;
        let schoolNames = [];
        schools.forEach(item => schoolNames.push(item.name));

        if (!courses.length && schoolIndex >= 0) return <span>Sto chiedendo alla scuola i corsi di studio...</span>;
        let courseNames = [];
        courses.forEach(item => courseNames.push(item.name));

        if (!curricula.length && year >= 0) return <span>Sto chiedendo al corso di studio i curricula...</span>;
        let curriculumNames = [];
        curricula.forEach(item => curriculumNames.push(item.name));

        if (!classes.length && curriculumIndex >= 0) return <span>Sto chiedendo al corso di studio i corsi...</span>;


        return (
            <>
                <h1>{mainTitle}</h1>
                <h2>{schoolHeader}</h2>
                <SelectList
                    items={schoolNames}
                    onSelect={selected =>
                        this.setState({schoolIndex: selected})
                    }
                    selected={schoolIndex}
                    multiple={false}
                    style={listStyle}
                />
                {courses.length &&
                <>
                    <h2>{courseHeader}</h2>
                    <SelectList
                        items={courseNames}
                        onSelect={selected => {
                            const selectedCourse = courses[selected] || null;
                            this.setState({
                                courseIndex: selected,
                                courseType: resolveCourseType(selectedCourse)
                            });
                        }}
                        selected={courseIndex}
                        multiple={false}
                    />
                </>}
                {courseType.length &&
                <>
                    <h2>{yearHeader}</h2>
                    <SelectList
                        items={this.state.years}
                        onSelect={selected =>
                            this.setState({year: selected + 1})
                        }
                        selected={year - 1}
                        multiple={false}
                    />

                </>}
                {year >= 0 &&
                <>
                    <h2>{curriculumHeader}</h2>
                    <SelectList
                        items={curriculumNames}
                        onSelect={selected =>
                            this.setState({curriculumIndex: selected})
                        }
                        selected={curriculumIndex}
                        multiple={false}
                    />
                </>}
                {curriculumIndex >= 0 &&
                <>
                    <h2>{classesHeader}</h2>
                    <SelectList
                        items={classes}
                        multiple={true}
                        onSelect={selected => {
                            this.setState({selectedClasses: selected});
                        }}
                        selected={selectedClasses}
                    />
                </>
                }
                {classesBtm > 0 &&
                <div><div style={padded}>Sincronizza il calendario al seguente indirizzo per avere l'orario sempre aggiornato!</div>
                    <div style={padded}><input type="textarea" value={beReqUrl + beGetCalendar + beParamSchool + schoolIndex + beParamCourse + courseIndex + beParamYear + year + beParamCurr + curriculumIndex + beParamClsBtm + classesBtm.toString(10)}></input></div>
                    <div style={padded}>oppure</div>
                    <button
                        type="button"
                        onClick={e => window.open(beReqUrl + beGetCalendar + beParamSchool + schoolIndex + beParamCourse + courseIndex + beParamYear + year + beParamCurr + curriculumIndex + beParamClsBtm + classesBtm.toString(10))}>
                        {buttonContent}
                    </button>

                </div>}
            </>
        )
    }
}

export default OrarioSyncApp;
