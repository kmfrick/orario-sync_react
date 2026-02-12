import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import SelectList from "./SelectList";

jest.mock("react-list-select", () => {
  const React = require("react");

  return class MockList extends React.Component {
    render() {
      const { multiple, selected, onChange } = this.props;
      return (
        <button
          type="button"
          data-testid="mock-list"
          data-multiple={String(multiple)}
          data-selected={JSON.stringify(selected)}
          onClick={() => onChange(multiple ? [1, 2] : 1)}
        >
          mock-list
        </button>
      );
    }
  };
});

describe("SelectList", () => {
  test("wraps single-select values in an array and forwards changes", () => {
    const onSelect = jest.fn();

    render(<SelectList items={["a", "b"]} selected={1} multiple={false} onSelect={onSelect} />);

    const el = screen.getByTestId("mock-list");
    expect(el).toHaveAttribute("data-multiple", "false");
    expect(el).toHaveAttribute("data-selected", "[1]");

    fireEvent.click(el);
    expect(onSelect).toHaveBeenCalledWith(1);
  });

  test("keeps multi-select values as-is and forwards changes", () => {
    const onSelect = jest.fn();

    render(<SelectList items={["a", "b"]} selected={[0]} multiple={true} onSelect={onSelect} />);

    const el = screen.getByTestId("mock-list");
    expect(el).toHaveAttribute("data-multiple", "true");
    expect(el).toHaveAttribute("data-selected", "[0]");

    fireEvent.click(el);
    expect(onSelect).toHaveBeenCalledWith([1, 2]);
  });
});
