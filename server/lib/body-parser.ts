import { Request } from "express";

/**
 * Robustly parses the request body, handling potential inconsistencies in serverless environments
 * where standard middleware might not work as expected. It can handle JSON objects,
 * stringified JSON, and Buffers.
 * @param req The Express request object.
 * @returns The parsed request body as an object.
 */
export function parseBody(req: Request): any {
    let bodyData = req.body;

    // Case 1: Body is a Buffer (can happen in some environments)
    if (Buffer.isBuffer(bodyData)) {
        try {
            const bodyString = bodyData.toString('utf8');
            if (bodyString) {
                return JSON.parse(bodyString);
            }
        } catch (e) {
            console.error("Failed to parse Buffer body:", e);
            throw new Error("Invalid JSON payload received from Buffer.");
        }
    }
    
    // Case 2: Body is a stringified JSON
    if (typeof bodyData === 'string' && bodyData.length > 0) {
        try {
            return JSON.parse(bodyData);
        } catch (e) {
            console.error("Failed to parse string body:", e);
            throw new Error("Invalid JSON payload received from string.");
        }
    }
    
    // Case 3: Body is already a parsed object (ideal case)
    if (typeof bodyData === 'object' && bodyData !== null) {
        return bodyData;
    }

    // Fallback: If body is empty, undefined, or another type, return an empty object
    // to prevent downstream parsing errors with Zod.
    return {};
}