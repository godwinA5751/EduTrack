import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "../supabase.js";
import { verifyAdmin } from "../middleware/auth.js";
import { generateTempPassword } from "../utils/password.js";

const router = Router();
router.use(verifyAdmin);

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

router.get("/users", async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const search = req.query.search?.trim() || "";
    const role = req.query.role || "all";

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Build users query
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

    // Search by full name or matric number
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

    // Get role statistics
    const { data: roles, error: rolesError } = await supabase
      .from("profiles")
      .select("role");

    if (rolesError) throw rolesError;

    const stats = {
      totalUsers: roles.length,
      students: roles.filter((u) => u.role === "student").length,
      admins: roles.filter((u) => u.role === "admin").length,
    };

    return res.status(200).json({
      success: true,
      stats,
      users,
      pagination: {
        page,
        limit,
        total: totalUsers,
        totalPages: Math.ceil(totalUsers / limit),
      },
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { profileId } = req.body;

    if (!profileId || typeof profileId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid profile ID",
      });
    }

    // Ensure the profile exists
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, matric_no, role")
      .eq("id", profileId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (profile.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin passwords cannot be reset.",
      });
    }

    const temporaryPassword = generateTempPassword();

    // Update Supabase Auth password
    const { error: authError } =
      await supabaseAdmin.auth.admin.updateUserById(profileId, {
        password: temporaryPassword,
      });

    if (authError) {
      if (authError.code === "user_not_found") {
        return res.status(404).json({
          success: false,
          message: "This user no longer exists in the authentication system.",
        });
      }
    
      throw authError;
    }

    // Require password change
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        must_change_password: true,
      })
      .eq("id", profileId);

    if (updateError) throw updateError;

    // Audit log (for now)
    console.log(
      `${req.user.email} reset password for ${profile.full_name} (${profile.matric_no})`
    );

    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
      temporaryPassword,
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

export default router;