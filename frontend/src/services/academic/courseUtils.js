export function normalizeCourseCode(code) {
  return code?.toUpperCase().replace(/\s+/g, "") || "";
}

export function flattenCourses(levels = []) {
  const courses = [];

  levels.forEach((level) => {
    level.semesters?.forEach((semester) => {
      semester.courses?.forEach((course) => {
        courses.push({
          ...course,
          levelId: level.id,
          semesterId: semester.id,
          level: level.level,
          semester: semester.semester,
        });
      });
    });
  });

  return courses;
}