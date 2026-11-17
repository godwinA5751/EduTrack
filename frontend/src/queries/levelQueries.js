
import { supabase } from "../lib/supabaseClient";
import { calculateLevelStats } from "../services/academic";

export async function getLevels() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Not authenticated");
  }

  const { data: levels, error } = await supabase
    .from("levels")
    .select(`
      id,
      level,
      semesters (
        id,
        semester,
        courses (
          id,
          semester_id,
          code,
          unit,
          grade,
          point,
          is_carryover,
          created_at
        )
      )
    `)
    .eq("user_id", session.user.id)
    .order("level");

  if (error) throw error;

  return {
    levels: levels || [],
    stats: calculateLevelStats(levels || []),
    userId: session.user.id,
  };
}