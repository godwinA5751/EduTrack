import adminCache from "./adminCache.js";
import { getAdminUsers } from "../services/adminService.js";
import { CacheKeys } from "./cacheKey.js";

const CACHE_REFRESH_INTERVAL = 5 * 60 * 1000;

export async function refreshUsersCache() {
  try {
    console.log("Refreshing users cache...");

    const response = await getAdminUsers({
      page: 1,
      limit: 10,
      search: "",
      role: "all",
    });

    const cacheKey = CacheKeys.users({
      page: 1,
      limit: 10,
      role: "all",
      search: "",
    });

    adminCache.set(cacheKey, response);

    console.log(`Users cache refreshed: ${cacheKey}`);
  } catch (err) {
    console.error("Cache refresh failed:", err.message);
  }
}

export function startCacheScheduler() {
  refreshUsersCache();

  setInterval(refreshUsersCache, CACHE_REFRESH_INTERVAL);
}