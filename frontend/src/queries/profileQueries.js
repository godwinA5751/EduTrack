import { supabase } from "../lib/supabaseClient";

export async function getProfile() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) throw new Error("Unauthenticated");

  const userId = session.user.id;

  const [profileRes, levelsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        `
        id,
        full_name,
        matric_no
      `
      )
      .eq("id", userId)
      .single(),

    supabase
      .from("levels")
      .select(`
        id,
        level,
        semesters(
          id,
          semester,
          courses(
            code,
            unit,
            point
          )
        )
      `)
      .eq("user_id", userId),
  ]);

  if (profileRes.error) throw profileRes.error;
  if (levelsRes.error) throw levelsRes.error;

  return {
    profile: profileRes.data,
    levels: levelsRes.data ?? [],
  };
}