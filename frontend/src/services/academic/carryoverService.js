import {
  normalizeCourseCode,
} from "./courseUtils";

export function resolveCarryovers(courses = []) {
  const grouped = {};

  courses.forEach((course) => {
    const code = normalizeCourseCode(course.code);

    if (!grouped[code]) {
      grouped[code] = [];
    }

    grouped[code].push(course);
  });

  const resolved = [];

  Object.values(grouped).forEach((attempts) => {

    // Highest grade wins
    const best = attempts.reduce((a, b) =>
      (a.point || 0) >= (b.point || 0) ? a : b
    );

    // Preserve the original registration
    const original = attempts.reduce((a, b) =>
      new Date(a.created_at) <
      new Date(b.created_at)
        ? a
        : b
    );

    resolved.push({
      ...original,
      point: best.point || 0,
      grade: best.grade,
      is_carryover: best.grade === "F",
    });
  });

  return resolved;
}