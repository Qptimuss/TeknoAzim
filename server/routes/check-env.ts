import { RequestHandler } from "express";

export const handleCheckEnv: RequestHandler = (req, res) => {
  const supabaseUrlSet = !!process.env.SUPABASE_URL;
  const serviceKeySet = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  res.status(200).json({
    message: "Environment variable check",
    variables: {
      SUPABASE_URL_SET: supabaseUrlSet,
      SUPABASE_SERVICE_ROLE_KEY_SET: serviceKeySet,
    },
    instructions: "If either of these is false, please double-check the variable names and values in your Netlify site configuration under 'Environment variables'.",
  });
};