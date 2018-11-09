import List from "react-list-select";
import React from "react";

class SchoolList extends List {

    state = { selectedIndex : 0}; // init with some value
    constructor(props) {
        super(props);
        this.updateSelected = this.updateSelected.bind(this);
    }

    updateSelected(newIndex) {
        this.setState({selectedIndex : newIndex}); //executed when exiting updateSelected
        this.props.onSelect(newIndex);
    }
    render() {

        return <List
            multiple={false}
            items={this.props.items}
            onChange={this.updateSelected}
        />;

    }
}

export default SchoolList;