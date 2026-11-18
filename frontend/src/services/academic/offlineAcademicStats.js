
import {
  calculateCGPA,
  calculateLevelStats,
  calculateSemesterStats,
  calculateProfileStats,
} from "./cgpaService";
import { getPendingMutations } from "./offlineQueue";

function applyPendingCourseMutations(levels, mutations) {
  const updatedLevels = structuredClone(levels || []);
  const courseLocations = new Map();

  updatedLevels.forEach((level) => {
    level.semesters?.forEach((semester) => {
      semester.courses = semester.courses || [];

      semester.courses.forEach((course) => {
        if (!course.id) return;
        courseLocations.set(course.id, { level, semester, course });
      });
    });
  });

  mutations
    .filter(
      (mutation) =>
        mutation.type?.startsWith("course.") && mutation.courseId
    )
    .forEach((mutation) => {
      const location = courseLocations.get(mutation.courseId);

      if (mutation.type === "course.create") {
        const payload = mutation.payload;

        if (!payload?.semester_id || !payload?.id) return;

        const level = updatedLevels.find((item) =>
          item.semesters?.some(
            (semester) => semester.id === payload.semester_id
          )
        );

        const semester = level?.semesters?.find(
          (item) => item.id === payload.semester_id
        );

        if (!semester) return;

        const existingCourse = courseLocations.get(payload.id);

        if (existingCourse) {
          Object.assign(existingCourse.course, payload);
          return;
        }

        const course = {
          ...payload,
          created_at:
            payload.created_at ||
            mutation.createdAt ||
            new Date().toISOString(),
        };

        semester.courses.push(course);
        courseLocations.set(course.id, { level, semester, course });
        return;
      }

      if (!location) return;

      if (mutation.type === "course.update") {
        Object.assign(location.course, mutation.payload || {});
      }

      if (mutation.type === "course.delete") {
        location.semester.courses =
          location.semester.courses.filter(
            (course) => course.id !== mutation.courseId
          );

        courseLocations.delete(mutation.courseId);
      }
    });

  return updatedLevels;
}

export async function recalculateOfflineAcademicStats({
  userId,
  queryClient,
}) {
  if (!userId || !queryClient) return;

  const levelsQueryKey = ["levels", userId];
  const cachedData = queryClient.getQueryData(levelsQueryKey);

  if (!Array.isArray(cachedData?.levels)) return;

  const mutations = await getPendingMutations(userId);
  
  const calculatedLevels = applyPendingCourseMutations(
    cachedData.levels,
    mutations
  );

  const cgpaStats = calculateCGPA(calculatedLevels);
  const levelStats = calculateLevelStats(calculatedLevels);
  const semesterStats = calculateSemesterStats(calculatedLevels);
  const profileStats = calculateProfileStats(calculatedLevels);

  // Keep the complete nested course records in the levels cache.
  queryClient.setQueryData(levelsQueryKey, (old) => {
    if (!old) return old;

    return {
      ...old,
      levels: calculatedLevels,
      stats: levelStats,
    };
  });

  const trend = calculatedLevels.map((level, index) => {
    const cumulative = calculateCGPA(
      calculatedLevels.slice(0, index + 1)
    );

    return {
      label: `${level.level}lvl`,
      gpa: levelStats[level.id]?.gpa ?? 0,
      cgpa: cumulative.cgpa,
    };
  });

  queryClient.setQueryData(["dashboard-cgpa", userId], (old) => {
    if (!old) return old;

    return {
      ...old,
      cgpa: cgpaStats.cgpa,
      trend,
    };
  });

  // Store precomputed profile statistics.
  queryClient.setQueryData(["profile", userId], (old) => {
    if (!old) return old;

    return {
      ...old,
      stats: profileStats,
    };
  });

  // Update semester caches using the complete nested course records.
  calculatedLevels.forEach((calculatedLevel) => {
    queryClient.setQueryData(
      ["semesters", calculatedLevel.level, userId],
      (old) => {
        if (!old) return old;

        return {
          ...old,
          semesters: old.semesters?.map((semester) => {
            const calculatedSemester =
              calculatedLevel.semesters?.find(
                (item) => item.id === semester.id
              );

            if (!calculatedSemester) return semester;

            return {
              ...semester,
              courses: calculatedSemester.courses,
              gpa: semesterStats[semester.id]?.gpa ?? 0,
              total_units: semesterStats[semester.id]?.units ?? 0,
            };
          }),
        };
      }
    );
  });

  return {
    cgpa: cgpaStats.cgpa,
    units: cgpaStats.units,
    points: cgpaStats.points,
    levelStats,
    semesterStats,
    profileStats,
  };
}
