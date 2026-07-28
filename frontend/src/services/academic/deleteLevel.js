import { supabase } from "../../lib/supabaseClient";

export async function deleteLevel(id) {
  const { error } = await supabase
    .from("levels")
    .delete()
    .eq("id", id);

  if (error) throw error;
}