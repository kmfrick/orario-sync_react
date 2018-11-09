import List from "react-list-select";
import React from "react";

class CourseList extends List {
    constructor(props) {
        super(props);
        this.alertCourseSelected = this.alertCourseSelected.bind(this);
    }

    alertCourseSelected(courseIndex) {
        this.props.onSelect(courseIndex);
    }
    render() {
        return <List
            multiple = {false}
            items = {this.props.items}
            onChange = {this.alertCourseSelected}
        />;
    }
}

export default CourseList;