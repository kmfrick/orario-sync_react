import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import OrarioSyncApp from "./OrarioSyncApp";

jest.mock("./SelectList", () => {
  const React = require("react");

  return function MockSelectList({ items, onSelect, multiple }) {
    return (
      <div>
        {items.map((item, idx) => (
          <button
            key={`${String(item)}-${idx}`}
            type="button"
            data-testid={`item-${idx}`}
            onClick={() => onSelect(multiple ? [idx] : idx)}
          >
            {typeof item === "string" ? item : item.name}
          </button>
        ))}
      </div>
    );
  };
});

describe("OrarioSyncApp", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    delete global.fetch;
  });

  test("does not crash when selected course name has no [L]/[LM]/[LMCU] tag", async () => {
    const fetchMock = jest.fn().mockResolvedValueOnce({
      json: async () => [{ name: "School A" }]
    }).mockResolvedValueOnce({
      json: async () => [{
        code: "6827",
        name: "Course No Tag",
        link: "https://corsi.unibo.it/magistralecu/Giurisprudenza-Bologna"
      }]
    });
    global.fetch = fetchMock;

    render(<OrarioSyncApp />);

    fireEvent.click(await screen.findByText("School A"));
    fireEvent.click(await screen.findByText("Course No Tag"));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenNthCalledWith(2, expect.stringContaining("/getcourses.py?school=0"));
      expect(screen.getByText("Seleziona l'anno a cui sei iscritto")).toBeInTheDocument();
    });

    expect(screen.getByText("Sesto")).toBeInTheDocument();
  });

  test("uses explicit course tag from name when available", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      json: async () => [{ name: "School B" }]
    }).mockResolvedValueOnce({
      json: async () => [{
        code: "1234",
        name: "Data Science [LM]",
        link: "https://corsi.unibo.it/laureamagistrale/DataScience"
      }]
    });

    render(<OrarioSyncApp />);

    fireEvent.click(await screen.findByText("School B"));
    fireEvent.click(await screen.findByText("Data Science [LM]"));

    await waitFor(() => {
      expect(screen.getByText("Seleziona l'anno a cui sei iscritto")).toBeInTheDocument();
    });

    expect(screen.getByText("Primo")).toBeInTheDocument();
    expect(screen.getByText("Secondo")).toBeInTheDocument();
    expect(screen.queryByText("Terzo")).not.toBeInTheDocument();
  });
});
