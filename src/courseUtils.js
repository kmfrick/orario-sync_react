const COURSE_TYPE_BY_DURATION = {
  "[LMCU]": 6,
  "[L]": 3,
  "[LM]": 2
};

const COURSE_TYPE_RE = /\[(LMCU|LM|L)]/i;
const DEFAULT_COURSE_TYPE = "[LMCU]";

const YEAR_LABELS = ["Primo", "Secondo", "Terzo", "Quarto", "Quinto", "Sesto"];

const COURSE_TYPE_BY_LINK = [
  [/\/magistralecu\//i, "[LMCU]"],
  [/\/singlecycle\//i, "[LMCU]"],
  [/\/laureamagistrale\//i, "[LM]"],
  [/\/magistrale\//i, "[LM]"],
  [/\/2cycle\//i, "[LM]"],
  [/\/laurea\//i, "[L]"],
  [/\/1cycle\//i, "[L]"]
];

function normalizeCourseType(typeToken) {
  if (!typeToken) {
    return "";
  }

  const upper = typeToken.toUpperCase();
  if (upper === "L" || upper === "[L]") {
    return "[L]";
  }
  if (upper === "LM" || upper === "[LM]") {
    return "[LM]";
  }
  if (upper === "LMCU" || upper === "[LMCU]") {
    return "[LMCU]";
  }

  return "";
}

export function getCourseType(course) {
  const courseName = (course && course.name) || "";
  const nameMatch = COURSE_TYPE_RE.exec(courseName);
  if (nameMatch) {
    return normalizeCourseType(nameMatch[1]);
  }

  const courseLink = (course && course.link) || "";
  for (const [regex, type] of COURSE_TYPE_BY_LINK) {
    if (regex.test(courseLink)) {
      return type;
    }
  }

  return "";
}

export function resolveCourseType(course) {
  return getCourseType(course) || DEFAULT_COURSE_TYPE;
}

export function getYearLabelsForCourseType(courseType) {
  const normalized = normalizeCourseType(courseType);
  const yearCount = COURSE_TYPE_BY_DURATION[normalized] || COURSE_TYPE_BY_DURATION[DEFAULT_COURSE_TYPE];
  return YEAR_LABELS.slice(0, yearCount);
}

export { YEAR_LABELS, DEFAULT_COURSE_TYPE };
