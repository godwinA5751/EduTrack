
import { get, set } from "idb-keyval";

function getQueueKey(userId) {
  if (!userId) {
    throw new Error("A user ID is required for the offline queue.");
  }

  return `edutrack-pending-mutations-${userId}`;
}

function createMutationEntry(mutation) {
  return {
    ...mutation,
    mutationId: mutation.mutationId || crypto.randomUUID(),
    createdAt: mutation.createdAt || new Date().toISOString(),
    status: mutation.status || "pending",
  };
}

export async function getPendingMutations(userId) {
  const storedMutations = await get(getQueueKey(userId));

  if (!Array.isArray(storedMutations)) return [];

  let needsSave = false;

  const mutations = storedMutations.map((mutation) => {
    if (mutation.mutationId) return mutation;

    needsSave = true;
    return createMutationEntry(mutation);
  });

  if (needsSave) {
    await savePendingMutations(userId, mutations);
  }

  return mutations;
}

export async function savePendingMutations(userId, mutations) {
  await set(getQueueKey(userId), mutations);
}

export async function addPendingMutation(userId, mutation) {
  const mutations = await getPendingMutations(userId);

  mutations.push(createMutationEntry(mutation));

  await savePendingMutations(userId, mutations);

  return mutations;
}

export async function clearPendingMutations(userId) {
  await savePendingMutations(userId, []);
}

export async function getPendingMutationCount(userId) {
  const mutations = await getPendingMutations(userId);
  return mutations.length;
}

function getEntityId(mutation) {
  if (mutation.type.startsWith("course.")) {
    return mutation.courseId;
  }

  if (mutation.type.startsWith("semester.")) {
    return mutation.semesterId;
  }

  if (mutation.type.startsWith("level.")) {
    return mutation.levelId;
  }

  if (mutation.type === "profile.update") {
    return mutation.profileId;
  }

  return null;
}

function removeSemesterMutations(mutations, semesterId) {
  return mutations.filter(
    (item) =>
      item.semesterId !== semesterId &&
      item.payload?.semester_id !== semesterId
  );
}

function removeLevelMutations(mutations, levelId, knownSemesterIds = []) {
  // Include semesters created offline under this level.
  const semesterIds = new Set(knownSemesterIds);

  mutations.forEach((item) => {
    if (
      item.type.startsWith("semester.") &&
      (
        item.levelId === levelId ||
        item.payload?.level_id === levelId
      )
    ) {
      if (item.semesterId) {
        semesterIds.add(item.semesterId);
      }
    }
  });

  return mutations.filter((item) => {
    if (item.levelId === levelId) return false;

    if (
      item.semesterId &&
      semesterIds.has(item.semesterId)
    ) {
      return false;
    }

    if (
      item.payload?.semester_id &&
      semesterIds.has(item.payload.semester_id)
    ) {
      return false;
    }

    return true;
  });
}

export async function enqueueAcademicMutation(userId, mutation) {
  const mutations = await getPendingMutations(userId);
  const entityId = getEntityId(mutation);

  if (!entityId) {
    throw new Error("A valid entity ID is required for this mutation.");
  }

  // Deleting a semester created offline cancels its creation
  // and any queued course operations inside it.
  if (mutation.type === "semester.delete") {
    const hasPendingCreate = mutations.some(
      (item) =>
        item.type === "semester.create" &&
        item.semesterId === entityId
    );

    const updatedMutations = removeSemesterMutations(
      mutations,
      entityId
    );

    if (!hasPendingCreate) {
      updatedMutations.push(createMutationEntry(mutation));
    }

    await savePendingMutations(userId, updatedMutations);
    return updatedMutations;
  }

  // Deleting a level removes its queued operations and
  // operations belonging to its known descendant semesters.
  if (mutation.type === "level.delete") {
    const hasPendingCreate = mutations.some(
      (item) =>
        item.type === "level.create" &&
        item.levelId === entityId
    );

    const updatedMutations = removeLevelMutations(
      mutations,
      entityId,
      mutation.semesterIds || []
    );

    if (!hasPendingCreate) {
      updatedMutations.push(createMutationEntry(mutation));
    }

    await savePendingMutations(userId, updatedMutations);
    return updatedMutations;
  }

  // Keep only the latest profile update.
  if (mutation.type === "profile.update") {
    const existingIndex = mutations.findIndex(
      (item) =>
        item.type === "profile.update" &&
        item.profileId === entityId &&
        item.status === "pending"
    );

    if (existingIndex !== -1) {
      mutations[existingIndex] = {
        ...mutations[existingIndex],
        payload: {
          ...mutations[existingIndex].payload,
          ...mutation.payload,
        },
      };

      await savePendingMutations(userId, mutations);
      return mutations;
    }
  }

  // Consolidate repeated updates to the same entity.
  if (mutation.type.endsWith(".update")) {
    const existingIndex = mutations.findIndex(
      (item) =>
        item.type === mutation.type &&
        getEntityId(item) === entityId &&
        item.status === "pending"
    );

    if (existingIndex !== -1) {
      mutations[existingIndex] = {
        ...mutations[existingIndex],
        payload: {
          ...mutations[existingIndex].payload,
          ...mutation.payload,
        },
      };

      await savePendingMutations(userId, mutations);
      return mutations;
    }
  }

  mutations.push(createMutationEntry(mutation));

  await savePendingMutations(userId, mutations);

  return mutations;
}


export async function enqueueCourseMutation(userId, mutation) {
  if (!userId || !mutation?.courseId || !mutation?.type?.startsWith("course.")) {
    throw new Error("A valid user, course ID, and course mutation type are required.");
  }

  const mutations = await getPendingMutations(userId);

  const existingIndex = mutations.findIndex(
    (item) =>
      item.courseId === mutation.courseId &&
      item.status === "pending"
  );

  if (existingIndex !== -1) {
    const existing = mutations[existingIndex];

    if (existing.type === "course.create" && mutation.type === "course.delete") {
      mutations.splice(existingIndex, 1);
      await savePendingMutations(userId, mutations);
      return mutations;
    }

    if (
      existing.type === "course.create" &&
      mutation.type === "course.delete"
    ) {
      mutations.splice(existingIndex, 1);
      await savePendingMutations(userId, mutations);
      return mutations;
    }

    if (
      existing.type === "course.create" &&
      mutation.type === "course.update"
    ) {
      mutations[existingIndex] = {
        ...existing,
        payload: {
          ...existing.payload,
          ...mutation.payload,
        },
      };

      await savePendingMutations(userId, mutations);
      return mutations;
    }

    if (
      existing.type === "course.update" &&
      mutation.type === "course.update"
    ) {
      mutations[existingIndex] = {
        ...existing,
        payload: mutation.payload,
      };

      await savePendingMutations(userId, mutations);
      return mutations;
    }

    if (
      existing.type === "course.update" &&
      mutation.type === "course.delete"
    ) {
      mutations[existingIndex] = {
        ...mutation,
        mutationId: existing.mutationId,
        createdAt: existing.createdAt,
        status: "pending",
      };

      await savePendingMutations(userId, mutations);
      return mutations;
    }
  }

  mutations.push(createMutationEntry(mutation));

  await savePendingMutations(userId, mutations);

  return mutations;
}

export async function removePendingMutation(userId, mutationId) {
  const mutations = await getPendingMutations(userId);

  const updatedMutations = mutations.filter(
    (mutation) => mutation.mutationId !== mutationId
  );

  await savePendingMutations(userId, updatedMutations);

  return updatedMutations;
}
