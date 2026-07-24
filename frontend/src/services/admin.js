import axios from "axios";
import { supabase } from "../lib/supabaseClient";

const adminUrl = import.meta.env.VITE_ADMINAPI;

const adminApi = axios.create({
  baseURL: adminUrl,
});

adminApi.interceptors.request.use(async (config) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }

  return config;
});

export default adminApi;