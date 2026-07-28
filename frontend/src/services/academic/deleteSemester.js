import { supabase } from "../../lib/supabaseClient";

export async function deleteSemester(id) {
  const { error } = await supabase
    .from("semesters")
    .delete()
    .eq("id", id);

  if (error) throw error;
}