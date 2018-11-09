import List from "react-list-select";
import React from "react";

class SelectList extends List {
    constructor(props) {
        super(props);
        this.updateSelected = this.updateSelected.bind(this);
    }

    updateSelected(newIndex) {
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

export default SelectList;