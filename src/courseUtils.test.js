import {
  DEFAULT_COURSE_TYPE,
  getCourseType,
  getYearLabelsForCourseType,
  resolveCourseType,
  YEAR_LABELS
} from "./courseUtils";

describe("courseUtils", () => {
  test("extracts course type from course name when tag exists", () => {
    expect(getCourseType({ name: "Ingegneria Informatica [LM]" })).toBe("[LM]");
    expect(getCourseType({ name: "Medicina [LMCU]" })).toBe("[LMCU]");
    expect(getCourseType({ name: "Economia [L]" })).toBe("[L]");
  });

  test("infers course type from URL when name tag is missing", () => {
    expect(getCourseType({ name: "Giurisprudenza", link: "https://corsi.unibo.it/magistralecu/Giurisprudenza" })).toBe("[LMCU]");
    expect(getCourseType({ name: "Data Science", link: "https://corsi.unibo.it/laureamagistrale/DataScience" })).toBe("[LM]");
    expect(getCourseType({ name: "Biotecnologie", link: "https://corsi.unibo.it/laurea/Biotecnologie" })).toBe("[L]");
    expect(getCourseType({ name: "Business and Economics", link: "https://corsi.unibo.it/1cycle/CLaBE" })).toBe("[L]");
    expect(getCourseType({ name: "Artificial Intelligence", link: "https://corsi.unibo.it/2cycle/ArtificialIntelligence" })).toBe("[LM]");
  });

  test("falls back to default course type when inference fails", () => {
    expect(getCourseType({ name: "Corso senza metadati", link: "https://example.com/unknown" })).toBe("");
    expect(resolveCourseType({ name: "Corso senza metadati", link: "https://example.com/unknown" })).toBe(DEFAULT_COURSE_TYPE);
  });

  test("returns year labels by course type with safe fallback", () => {
    expect(getYearLabelsForCourseType("[LM]")).toEqual(["Primo", "Secondo"]);
    expect(getYearLabelsForCourseType("[L]")).toEqual(["Primo", "Secondo", "Terzo"]);
    expect(getYearLabelsForCourseType("[LMCU]")).toEqual(YEAR_LABELS);
    expect(getYearLabelsForCourseType("")).toEqual(YEAR_LABELS);
    expect(getYearLabelsForCourseType("[UNKNOWN]")).toEqual(YEAR_LABELS);
  });
});
