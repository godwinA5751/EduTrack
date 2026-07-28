import { supabase } from "../lib/supabaseClient";

export async function getSemesters(levelNumber) {
  if (!levelNumber) {
    return {
      level: null,
      semesters: [],
    };
  }
  
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) throw new Error("Unauthorized");

  const { data: levelData, error: levelError } = await supabase
    .from("levels")
    .select("id, level")
    .eq("user_id", session.user.id)
    .eq("level", levelNumber)
    .single();

  if (levelError) throw levelError;

  const { data: semesterData, error } = await supabase
    .from("semesters")
    .select(`
      id,
      semester,
      courses (
        id,
        code,
        unit,
        point
      )
    `)
    .eq("level_id", levelData.id)
    .order("semester");

  if (error) throw error;

  return {
    level: levelData,
    semesters: semesterData || [],
  };
}