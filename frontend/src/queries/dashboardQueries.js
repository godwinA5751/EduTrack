import { supabase } from "../lib/supabaseClient";
import { calculateCGPA } from "../services/academic";

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
      semesters (
        id,
        courses (
          code,
          unit,
          point
        )
      )
    `)
    .eq("user_id", session.user.id);

  if (error) throw error;

  return calculateCGPA(levels || []);
}