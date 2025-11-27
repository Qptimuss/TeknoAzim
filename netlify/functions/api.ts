import serverless from "serverless-http";
import dotenv from "dotenv";
import { createServer } from "../../server";

// Ensure environment variables are loaded for the serverless function context
dotenv.config();

export const handler = serverless(createServer());