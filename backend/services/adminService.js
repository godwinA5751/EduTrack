import { supabase } from "../supabase.js";

export async function getAdminUsers({
  page = 1,
  limit = 10,
  search = "",
  role = "all",
}) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let usersQuery = supabase
    .from("profiles")
    .select(
      `
        id,
        full_name,
        matric_no,
        role,
        must_change_password
      `,
      { count: "exact" }
    )
    .order("full_name", { ascending: true });

  if (search) {
    usersQuery = usersQuery.or(
      `full_name.ilike.%${search}%,matric_no.ilike.%${search}%`
    );
  }

  if (role !== "all") {
    usersQuery = usersQuery.eq("role", role);
  }

  const {
    data: users,
    error: usersError,
    count: totalUsers,
  } = await usersQuery.range(from, to);

  if (usersError) throw usersError;

  const { data: roles, error: rolesError } = await supabase
    .from("profiles")
    .select("role");

  if (rolesError) throw rolesError;

  return {
    success: true,
    stats: {
      totalUsers: roles.length,
      students: roles.filter((u) => u.role === "student").length,
      admins: roles.filter((u) => u.role === "admin").length,
    },
    users,
    pagination: {
      page,
      limit,
      total: totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
    },
  };
}