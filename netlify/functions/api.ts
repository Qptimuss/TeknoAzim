import serverless from "serverless-http";
import { createServer } from "../../server";

// Explicitly read variables at the function's entry point.
// This is the most robust way to ensure they are captured in a serverless environment.
console.log("[Netlify Handler] Reading environment variables from process.env...");
const env = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  HUGGING_FACE_API_KEY: process.env.HUGGING_FACE_API_KEY,
  ADMIN_EMAILS: process.env.ADMIN_EMAILS, // ADMIN_EMAILS eklendi
};

console.log(`[Netlify Handler] SUPABASE_URL is set: ${!!env.SUPABASE_URL}`);
console.log(`[Netlify Handler] SUPABASE_SERVICE_ROLE_KEY is set: ${!!env.SUPABASE_SERVICE_ROLE_KEY}`);
console.log(`[Netlify Handler] ADMIN_EMAILS is set: ${!!env.ADMIN_EMAILS}`); // Log eklendi

// Pass the collected env variables directly into the server factory.
export const handler = serverless(createServer(env));