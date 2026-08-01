import { supabase } from "../../lib/supabaseClient";
import { resolveCarryovers } from "./carryoverService";
import { normalizeCourseCode } from "./courseUtils";
import { GRADE_POINTS } from "./constraint";

export async function recalculateAcademicStats(userId) {
  try {
    if (!userId) return;

    const { data: allCourses, error } = await supabase
      .from("courses")
      .select(`
        id,
        code,
        unit,
        point,
        created_at,
        semester_id,
        semesters:semester_id(
          id,
          level_id,
          levels:level_id(user_id)
        )
      `)
      .eq("semesters.levels.user_id", userId);

    if (error) throw error;

    const resolvedCourses = resolveCarryovers(allCourses);

    const levelMap = {};

    resolvedCourses.forEach((c) => {
      const levelId = c.semesters.level_id;

      if (!levelMap[levelId]) {
        levelMap[levelId] = { points: 0, units: 0 };
      }

      levelMap[levelId].points += c.point * c.unit;
      levelMap[levelId].units += c.unit;
    });

    await Promise.all(
      Object.entries(levelMap).map(([levelId, stats]) => {
        const cgpa = stats.units
          ? Number((stats.points / stats.units).toFixed(2))
          : 0;
    
        return supabase
          .from("levels")
          .update({ cgpa })
          .eq("id", levelId);
      })
    );

    const semesterMap = {};

    resolvedCourses.forEach((c) => {
      const semId = c.semester_id;

      if (!semesterMap[semId]) {
        semesterMap[semId] = { points: 0, units: 0 };
      }

      semesterMap[semId].points += c.point * c.unit;
      semesterMap[semId].units += c.unit;
    });

    await Promise.all(
      Object.entries(semesterMap).map(([semId, stats]) =>
        supabase
          .from("semesters")
          .update({
            gpa: stats.units ? stats.points / stats.units : 0,
            total_units: stats.units,
          })
          .eq("id", semId)
      )
    );

  } catch (err) {
    console.error("GPA ERROR:", err);
    throw err;
  }
  return {
    success: true,
  };
}

export async function addCourse(course) {
  const { data, error } = await supabase
    .from("courses")
    .insert(course)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function deleteCourse(id) {
  const { error } = await supabase
    .from("courses")
    .delete()
    .eq("id", id);

  if (error) throw error;

  return true;
}

export async function updateCourse(courseId, updates) {
  const { data, error } = await supabase
    .from("courses")
    .update({
      code: normalizeCourseCode(updates.code),
      unit: Number(updates.unit),
      grade: updates.grade,
      point: GRADE_POINTS[updates.grade],
      is_carryover: updates.grade === "F",
    })
    .eq("id", courseId)
    .select()
    .single();

  if (error) throw error;

  return data;
}
