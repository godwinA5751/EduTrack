import { supabase } from "../lib/supabaseClient";

export async function getCourses(semesterId) {
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("semester_id", semesterId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return data ?? [];
}