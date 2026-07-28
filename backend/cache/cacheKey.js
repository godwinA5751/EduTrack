export const CacheKeys = {
  users: ({ page, limit, role, search }) =>
    `users:${page}:${limit}:${role}:${search}`,
};