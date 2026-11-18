
import { useEffect } from "react";
import { useQueryClient, useIsRestoring } from "@tanstack/react-query";

import { getCurrentUser } from "../../queries/userQueries";
import { getLevels } from "../../queries/levelQueries";
import { getCourses } from "../../queries/courseQueries";
import { getDashboardCGPA } from "../../queries/dashboardQueries";
import { getProfile } from "../../queries/profileQueries";

import { getPendingMutations } from "../../services/academic/offlineQueue";
import { syncOfflineCourses } from "../../services/academic";

export default function OfflineCacheInitializer({
  userId,
  children,
}) {
  const queryClient = useQueryClient();
  const isRestoring = useIsRestoring();

  useEffect(() => {
    if (!userId || isRestoring) return;

    let cancelled = false;
    let initializing = false;

    const initializeCache = async () => {
      if (cancelled || !navigator.onLine || initializing) return;

      initializing = true;

      try {
        // First synchronize pending offline changes.
        await syncOfflineCourses(userId, queryClient);

        if (cancelled || !navigator.onLine) return;

        // Do not overwrite local academic data while
        // offline mutations are still waiting to sync.
        const pendingMutations = await getPendingMutations(userId);

        if (pendingMutations.length > 0) {
          return;
        }

        if (cancelled || !navigator.onLine) return;

        // Cache the authenticated user's profile.
        const currentUser = await queryClient.fetchQuery({
          queryKey: ["current-user"],
          queryFn: getCurrentUser,
          staleTime: 0,
        });

        if (
          cancelled ||
          !currentUser ||
          currentUser.id !== userId
        ) {
          return;
        }

        // Fetch the complete academic hierarchy.
        const academicData = await queryClient.fetchQuery({
          queryKey: ["levels", userId],
          queryFn: getLevels,
          staleTime: 0,
        });

        if (cancelled) return;

        const levels = academicData?.levels || [];
        const semesterTasks = [];

        // Populate every semester and course cache.
        for (const level of levels) {
          const semesters = level.semesters || [];

          queryClient.setQueryData(
            ["semesters", level.level, userId],
            {
              level: {
                id: level.id,
                level: level.level,
              },
              semesters,
            }
          );

          for (const semester of semesters) {
            semesterTasks.push(
              queryClient.fetchQuery({
                queryKey: [
                  "courses",
                  semester.id,
                  userId,
                ],
                queryFn: () => getCourses(semester.id),
                staleTime: 0,
              })
            );
          }
        }

        await Promise.all(semesterTasks);

        if (cancelled) return;

        // Cache Dashboard and Profile data.
        await Promise.all([
          queryClient.fetchQuery({
            queryKey: ["dashboard-cgpa", userId],
            queryFn: getDashboardCGPA,
            staleTime: 0,
          }),

          queryClient.fetchQuery({
            queryKey: ["profile", userId],
            queryFn: getProfile,
            staleTime: 0,
          }),
        ]);
      } catch  {
        return;
      } finally {
        initializing = false;
      }
    };

    // Initialize immediately when online.
    initializeCache();

    // Also initialize when connectivity returns.
    window.addEventListener("online", initializeCache);

    return () => {
      cancelled = true;
      window.removeEventListener("online", initializeCache);
    };
  }, [userId, isRestoring, queryClient]);

  return children;
}
