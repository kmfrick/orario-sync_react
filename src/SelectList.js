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
        if (this.props.multiple) {
            return <List
                multiple={true}
                items={this.props.items}
                onChange={this.updateSelected}
                selected={this.props.selected}
            />
        } else {
            return <List
                multiple={false}
                items={this.props.items}
                onChange={this.updateSelected}
                selected={[this.props.selected]}
            />;
        }

    }
}

export default SelectList;