import { supabase } from "../lib/supabaseClient";
import { calculateCGPA, calculateLevelStats } from "../services/academic";

export async function getDashboardCGPA() {
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
        courses (
          code,
          unit,
          point
        )
      )
    `)
    .eq("user_id", session.user.id)
    .order("level");

  if (error) throw error;

  const { cgpa } = calculateCGPA(levels || []);
  const levelStats = calculateLevelStats(levels || []);

  const trend = (levels || []).map((lvl, index) => {
    const levelsSoFar = (levels || []).slice(0, index + 1);
    const cumulative = calculateCGPA(levelsSoFar).cgpa;

    return {
      label: `${lvl.level}lvl`,
      gpa: levelStats[lvl.id]?.gpa ?? 0,
      cgpa: cumulative,
    };
  });

  return { cgpa, trend };
}