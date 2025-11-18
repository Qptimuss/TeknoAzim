import { RequestHandler } from "express";
import "dotenv/config";

export const handleModerate: RequestHandler = async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Text to moderate is required." });
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY is not set in the .env file.");
    return res.status(500).json({ error: "Server configuration error." });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({ input: text }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenAI API error:", errorData);
      throw new Error(`OpenAI API responded with status ${response.status}`);
    }

    const data = await response.json();
    const isFlagged = data.results[0].flagged;

    // If flagged, it's not appropriate.
    res.status(200).json({ isAppropriate: !isFlagged });

  } catch (error) {
    console.error("Error calling OpenAI Moderation API:", error);
    res.status(500).json({ error: "Failed to moderate content." });
  }
};