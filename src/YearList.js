import React from "react";
import List from "react-list-select"

class YearList extends List {
    constructor(props) {
        super(props);
        this.updateSelected = this.updateSelected.bind(this);
    }

    updateSelected(courseIndex) {
        this.props.onSelect(courseIndex);
    }

    createYears() {
        const durations = {"[LMCU]" : 6, "[L]" : 3, "[LM]" : 2, "" : 0};
        const yearLabels = ["Primo", "Secondo", "Terzo", "Quarto", "Quinto", "Sesto"];
        let items = [];
        let years = [...Array(durations[this.props.courseType]).keys()];
        years.forEach(i => items.push(yearLabels[i]));
        return items;
    }

    render() {
        return <List
            multiple={false}
            items={this.createYears()}
            onChange={this.updateSelected}
        />
    }
}


export default YearList;