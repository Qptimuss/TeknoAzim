import { RequestHandler } from "express";

// POST /api/announcement
export const handleCreateAnnouncement: RequestHandler = async (req, res) => {
  // Since requireAdmin runs before this, we know the user is an admin.
  const userId = req.userId;
  const { title, content } = req.body;

  // In a real scenario, you would insert this into a 'announcements' table.
  console.log(`Admin ${userId} created announcement: ${title}`);

  if (!title || !content) {
    return res.status(400).json({ error: "Title and content are required." });
  }

  // Mock success response
  res.status(201).json({ 
    message: "Announcement created successfully (MOCK).",
    title,
    content,
    adminId: userId,
  });
};