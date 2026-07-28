
import { normalizeCourseCode } from "./courseUtils";

export function validateCourse(form) {
    if (!form.code || !form.unit || !form.grade) {
        return "Fill all fields";
    }

    const code = normalizeCourseCode(form.code);

    const pattern = /^[A-Z]{3}\s?\d{3}$/i;

    if (!pattern.test(code.replace(" ", ""))) {
        return "Invalid course code";
    }

    return null;
}