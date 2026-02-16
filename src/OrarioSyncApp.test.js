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

function jsonResponse(body, { ok = true, status = 200 } = {}) {
  return {
    ok,
    status,
    json: async () => body
  };
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("OrarioSyncApp", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    delete global.fetch;
  });

  test("does not crash when selected course name has no [L]/[LM]/[LMCU] tag", async () => {
    const fetchMock = jest.fn(async (url) => {
      if (url.includes("/getschools.py")) {
        return jsonResponse([{ name: "School A" }]);
      }
      if (url.includes("/getcourses.py?school=0")) {
        return jsonResponse([
          {
            code: "6827",
            name: "Course No Tag",
            link: "https://corsi.unibo.it/magistralecu/Giurisprudenza-Bologna"
          }
        ]);
      }
      if (url.includes("/getcurricula.py?school=0&course=0&year=1")) {
        return jsonResponse([]);
      }
      throw new Error(`Unexpected URL ${url}`);
    });

    global.fetch = fetchMock;

    render(<OrarioSyncApp />);

    fireEvent.click(await screen.findByText("School A"));
    fireEvent.click(await screen.findByText("Course No Tag"));

    await waitFor(() => {
      expect(screen.getByText("Seleziona l'anno a cui sei iscritto")).toBeInTheDocument();
    });

    expect(screen.getByText("Sesto")).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([url]) => url.includes("/getcourses.py?school=0"))).toBe(true);
  });

  test("uses explicit course tag from name when available", async () => {
    global.fetch = jest.fn(async (url) => {
      if (url.includes("/getschools.py")) {
        return jsonResponse([{ name: "School B" }]);
      }
      if (url.includes("/getcourses.py?school=0")) {
        return jsonResponse([
          {
            code: "1234",
            name: "Data Science [LM]",
            link: "https://corsi.unibo.it/laureamagistrale/DataScience"
          }
        ]);
      }
      if (url.includes("/getcurricula.py?school=0&course=0&year=1")) {
        return jsonResponse([]);
      }
      throw new Error(`Unexpected URL ${url}`);
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

  test("shows loading skeleton while schools are loading", async () => {
    const schoolsDeferred = deferred();
    global.fetch = jest.fn().mockReturnValue(schoolsDeferred.promise);

    const { container } = render(<OrarioSyncApp />);

    expect(container.querySelector(".list-skeleton")).toBeInTheDocument();

    schoolsDeferred.resolve(jsonResponse([{ name: "School Load" }]));

    await screen.findByText("School Load");
  });

  test("shows retry when courses request fails and recovers", async () => {
    let courseCalls = 0;
    global.fetch = jest.fn(async (url) => {
      if (url.includes("/getschools.py")) {
        return jsonResponse([{ name: "School Retry" }]);
      }
      if (url.includes("/getcourses.py?school=0")) {
        courseCalls += 1;
        if (courseCalls === 1) {
          return jsonResponse({}, { ok: false, status: 500 });
        }
        return jsonResponse([
          {
            code: "9999",
            name: "Recovered Course [L]",
            link: "https://corsi.unibo.it/laurea/Foo"
          }
        ]);
      }
      if (url.includes("/getcurricula.py?school=0&course=0&year=1")) {
        return jsonResponse([]);
      }
      throw new Error(`Unexpected URL ${url}`);
    });

    render(<OrarioSyncApp />);

    fireEvent.click(await screen.findByText("School Retry"));

    await screen.findByText(/Impossibile caricare i corsi/i);

    fireEvent.click(screen.getByRole("button", { name: "Riprova" }));

    await screen.findByText("Recovered Course [L]");
    expect(courseCalls).toBe(2);
  });
});
