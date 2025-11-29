import { RequestHandler } from "express";

export const handleCheckEnv: RequestHandler = (req, res) => {
  const urlSet = !!process.env.SUPABASE_URL;
  const serviceKeySet = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hfKeySet = !!process.env.HUGGING_FACE_API_KEY;
  const adminEmailsSet = !!process.env.ADMIN_EMAILS;

  // For debugging, let's see the first few chars if they exist
  const urlPreview = process.env.SUPABASE_URL ? `${process.env.SUPABASE_URL.substring(0, 20)}...` : "Not Set";
  const serviceKeyPreview = process.env.SUPABASE_SERVICE_ROLE_KEY ? `Set (Length: ${process.env.SUPABASE_SERVICE_ROLE_KEY.length})` : "Not Set";
  const hfKeyPreview = process.env.HUGGING_FACE_API_KEY ? `Set (Length: ${process.env.HUGGING_FACE_API_KEY.length})` : "Not Set";
  const adminEmailsPreview = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.substring(0, 50) : "Not Set";

  res.status(200).json({
    message: "Server Environment Variable Check",
    variables: {
      SUPABASE_URL: {
        isSet: urlSet,
        preview: urlPreview,
      },
      SUPABASE_SERVICE_ROLE_KEY: {
        isSet: serviceKeySet,
        preview: serviceKeyPreview,
      },
      HUGGING_FACE_API_KEY: {
        isSet: hfKeySet,
        preview: hfKeyPreview,
      },
      ADMIN_EMAILS: {
        isSet: adminEmailsSet,
        preview: adminEmailsPreview,
      },
    },
  });
};