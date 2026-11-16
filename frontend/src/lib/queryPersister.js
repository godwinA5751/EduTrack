import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { get, set, del } from "idb-keyval";

export function createUserPersister(userId) {
  return createAsyncStoragePersister({
    key: `edutrack-query-cache-${userId}`,
    storage: {
      getItem: async (key) => {
        return (await get(key)) ?? null;
      },
      setItem: async (key, value) => {
        await set(key, value);
      },
      removeItem: async (key) => {
        await del(key);
      },
    },
  });
}
