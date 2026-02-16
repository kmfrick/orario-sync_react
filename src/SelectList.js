import React from "react";
import List from "react-list-select";

function SelectList({ items, multiple, onSelect, selected, ariaLabel }) {
  const normalizedSelected = multiple ? selected : [selected];

  return (
    <div className={`list-shell ${multiple ? "is-multi" : "is-single"}`} aria-label={ariaLabel}>
      <List multiple={multiple} items={items} onChange={onSelect} selected={normalizedSelected} />
    </div>
  );
}

export default SelectList;
