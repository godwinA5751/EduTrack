
import { enqueueCourseMutation } from "./offlineQueue";
import { normalizeCourseCode } from "./courseUtils";
import { GRADE_POINTS } from "./constraint";

export async function createOfflineCourse(userId, course) {
  const localId = crypto.randomUUID();

  const localCourse = {
    ...course,
    id: localId,
    created_at: new Date().toISOString(),
    _syncStatus: "pending",
  };

  await enqueueCourseMutation(userId, {
    type: "course.create",
    courseId: localId,
    payload: {
      ...course,
      id: localId,
    },
  });

  return localCourse;
}

export async function updateOfflineCourse(userId, courseId, updates) {
  const payload = {
    code: normalizeCourseCode(updates.code),
    unit: Number(updates.unit),
    grade: updates.grade,
    point: GRADE_POINTS[updates.grade],
    is_carryover: updates.grade === "F",
  };

  await enqueueCourseMutation(userId, {
    type: "course.update",
    courseId,
    payload,
  });

  return {
    ...payload,
    _syncStatus: "pending",
  };
}

export async function deleteOfflineCourse(userId, courseId) {
  if (!userId || !courseId) {
    throw new Error("A valid user and course ID are required.");
  }
  await enqueueCourseMutation(userId, {
    type: "course.delete",
    courseId,
  });

  return true;
}
