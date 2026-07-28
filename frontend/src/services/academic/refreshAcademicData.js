import { supabase } from "../../lib/supabaseClient";
import { recalculateAcademicStats } from "./courseService";

export async function refreshAcademicData({
  queryClient,
  semesterId,
  level,
}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return;

  await recalculateAcademicStats(session.user.id);

  const queries = [
    queryClient.invalidateQueries({
      queryKey: ["levels"],
    }),
    queryClient.invalidateQueries({
      queryKey: ["dashboard-cgpa"],
    }),
    queryClient.invalidateQueries({
      queryKey: ["profile"],
    }),
  ];

  if (semesterId) {
    queries.push(
      queryClient.invalidateQueries({
        queryKey: ["courses", semesterId],
      })
    );
  }

  if (level !== undefined) {
    queries.push(
      queryClient.invalidateQueries({
        queryKey: ["semesters", level],
      })
    );
  }

  await Promise.all(queries);
}