import { Router } from "express";
import { supabase } from "../supabase.js";

const router = Router();

router.get("/heartbeat", async (req, res) => {
  try {
    // Tiny query just to verify DB connectivity
    const { error } = await supabase
      .from("profiles")
      .select("id")
      .limit(1);

    if (error) throw error;

    return res.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: "Backend and database are healthy.",
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