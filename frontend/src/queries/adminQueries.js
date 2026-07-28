import adminApi from "../services/admin";

export async function getUsers({
  page,
  search,
  role,
}) {
  const { data } = await adminApi.get("/users", {
    params: {
      page,
      limit: 10,
      search,
      role,
    },
  });

  return data;
}