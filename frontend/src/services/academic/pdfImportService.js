
import { supabase } from "../../lib/supabaseClient";

export async function importPdfCourses(level, courses) {
  if (!navigator.onLine) {
    throw new Error(
      "PDF importing requires an internet connection."
    );
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Your session has expired. Please log in again.");
  }

  const currentLevel = Number(level);

  if (![100, 200, 300, 400, 500, 600].includes(currentLevel)) {
    throw new Error("Invalid destination level.");
  }

  if (!Array.isArray(courses) || courses.length === 0) {
    throw new Error("There are no courses to import.");
  }

  const invalidCourse = courses.find(
    (course) =>
      !course.valid ||
      !course.code ||
      !Number.isInteger(Number(course.unit)) ||
      Number(course.unit) <= 0 ||
      ![1, 2].includes(Number(course.semester))
  );

  if (invalidCourse) {
    throw new Error(
      "Some courses still need attention before importing."
    );
  }

  const payload = courses.map((course) => ({
    code: String(course.code).trim().toUpperCase(),
    unit: Number(course.unit),
    grade: String(course.grade).trim().toUpperCase(),
    semester: Number(course.semester),
  }));

  const { data, error } = await supabase.rpc(
    "import_pdf_courses",
    {
      p_level: currentLevel,
      p_courses: payload,
    }
  );

  if (error) {
    throw new Error(error.message || "Failed to import courses.");
  }

  if (!data?.success) {
    throw new Error("The import could not be completed.");
  }

  return data;
}
