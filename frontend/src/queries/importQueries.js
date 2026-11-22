
import { supabase } from "../lib/supabaseClient";

export async function getExistingAcademicRecords(levelNumbers) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  const normalizedLevels = [
    ...new Set(levelNumbers.map(Number)),
  ];

  if (
    normalizedLevels.length === 0 ||
    normalizedLevels.some((level) => !Number.isInteger(level))
  ) {
    throw new Error("Invalid academic levels.");
  }

  const { data: levels, error: levelsError } = await supabase
    .from("levels")
    .select("id, level")
    .eq("user_id", session.user.id)
    .in("level", normalizedLevels);

  if (levelsError) throw levelsError;

  if (!levels?.length) {
    return {
      levels: [],
      semesters: [],
    };
  }

  const levelIds = levels.map((level) => level.id);

  const { data: semesters, error: semestersError } =
    await supabase
      .from("semesters")
      .select(`
        id,
        level_id,
        semester,
        courses (
          id,
          code,
          unit,
          grade,
          point,
          is_carryover
        )
      `)
      .in("level_id", levelIds)
      .order("semester");

  if (semestersError) throw semestersError;

  return {
    levels,
    semesters: semesters || [],
  };
}
