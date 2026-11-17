
import { supabase } from "../../lib/supabaseClient";
import {
  getPendingMutations,
  removePendingMutation,
} from "./offlineQueue";
import { refreshAcademicData } from "./refreshAcademicData";

const activeSyncs = new Map();

async function processMutation(mutation) {
  let result;

  switch (mutation.type) {
    case "course.create":
      result = await supabase
        .from("courses")
        .upsert(mutation.payload, { onConflict: "id" });
      break;

    case "course.update":
      result = await supabase
        .from("courses")
        .update(mutation.payload)
        .eq("id", mutation.courseId);
      break;

    case "course.delete":
      if (!mutation.courseId) {
        throw new Error(
          `Invalid course.delete mutation: missing courseId (${mutation.mutationId})`
        );
      }

      result = await supabase
        .from("courses")
        .delete()
        .eq("id", mutation.courseId);
      break;

    case "level.create":
      result = await supabase
        .from("levels")
        .upsert(mutation.payload, { onConflict: "id" });
      break;

    case "level.delete":
      result = await supabase
        .from("levels")
        .delete()
        .eq("id", mutation.levelId);
      break;

    case "semester.create":
      result = await supabase
        .from("semesters")
        .upsert(mutation.payload, { onConflict: "id" });
      break;

    case "semester.delete":
      result = await supabase
        .from("semesters")
        .delete()
        .eq("id", mutation.semesterId);
      break;

    case "profile.update":
      result = await supabase
        .from("profiles")
        .update(mutation.payload)
        .eq("id", mutation.profileId);
      break;

    default:
      throw new Error(`Unknown mutation type: ${mutation.type}`);
  }

  if (result.error) {
    throw result.error;
  }
}

async function runSync(userId, queryClient) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) throw sessionError;

  if (!session || session.user.id !== userId) {
    return { synced: 0 };
  }

  if (!navigator.onLine) {
    return { synced: 0 };
  }

  const mutations = await getPendingMutations(userId);

  if (!mutations.length) {
    return { synced: 0 };
  }

  let synced = 0;

  // Process mutations in queue order.
  // Stop immediately if one fails so dependent operations
  // are not attempted before their parent records exist.
  for (const mutation of mutations) {
    if (mutation.status !== "pending") continue;

    await processMutation(mutation);

    // Remove each successful operation immediately.
    await removePendingMutation(userId, mutation.mutationId);

    synced += 1;
  }

  // Recalculate carryovers and academic statistics
  // after all queued operations have synced.
  const { error: rpcError } = await supabase.rpc(
    "sync_carryovers",
    { p_user_id: userId }
  );

  if (rpcError) throw rpcError;

  await refreshAcademicData({ queryClient });

  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: ["courses"],
    }),
    queryClient.invalidateQueries({
      queryKey: ["semesters"],
    }),
    queryClient.invalidateQueries({
      queryKey: ["levels"],
    }),
    queryClient.invalidateQueries({
      queryKey: ["dashboard-cgpa"],
    }),
    queryClient.invalidateQueries({
      queryKey: ["profile"],
    }),
    queryClient.invalidateQueries({
      queryKey: ["graduation-status"],
    }),
  ]);

  return { synced };
}

export async function syncOfflineCourses(userId, queryClient) {
  if (!userId || !queryClient) {
    return { synced: 0 };
  }

  if (activeSyncs.has(userId)) {
    return activeSyncs.get(userId);
  }

  const syncPromise = runSync(userId, queryClient);

  activeSyncs.set(userId, syncPromise);

  try {
    return await syncPromise;
  } finally {
    activeSyncs.delete(userId);
  }
}
