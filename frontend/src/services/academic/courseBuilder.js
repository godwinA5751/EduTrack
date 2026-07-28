import { normalizeCourseCode } from "./courseUtils";
import { GRADE_POINTS } from "./constraint";

export function buildCourse(form, semesterId) {
  const code = normalizeCourseCode(form.code);

  return {
    semester_id: semesterId,
    code,
    unit: Number(form.unit),
    grade: form.grade,
    point: GRADE_POINTS[form.grade],
  };
}