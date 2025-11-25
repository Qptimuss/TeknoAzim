import express from 'express';
import { getSupabase } from '../db';
import { authenticate } from '../middleware/auth';
import { moderateContent } from '../services/moderation';

const router = express.Router();
const supabase = getSupabase();

// Update user profile (name, description, avatar_url)
router.put('/profile', authenticate, async (req, res) => {
  const userId = req.user.id;
  const { name, description, avatar_url } = req.body;

  // Basic validation
  if (!name && !description && avatar_url === undefined) {
    return res.status(400).json({ error: 'At least one field (name, description, avatar_url) must be provided.' });
  }

  const updateData: { [key: string]: any } = {};

  if (name) {
    const isNameSafe = await moderateContent(name);
    if (!isNameSafe) {
      return res.status(400).json({ error: 'Provided name contains inappropriate content.' });
    }
    updateData.name = name;
  }

  if (description) {
    const isDescriptionSafe = await moderateContent(description);
    if (!isDescriptionSafe) {
      return res.status(400).json({ error: 'Provided description contains inappropriate content.' });
    }
    updateData.description = description;
  }
  
  // Add avatar_url to the update object if it was provided
  if (avatar_url !== undefined) {
    // Allow setting it to null or a new URL string
    updateData.avatar_url = avatar_url;
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ error: 'Failed to update profile.' });
  }

  res.status(200).json(data);
});

export default router;