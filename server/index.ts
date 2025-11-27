import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { authMiddleware } from './middleware/auth';
import { handleLogin, handleSignup, handleLogout, handlePasswordReset, handlePasswordUpdate } from './routes/auth';
import { handleUpdateProfile } from './routes/profile';
import { handleCreatePost, handleUpdatePost, handleDeletePost, handleAddComment, handleDeleteComment, handleCastVote } from './routes/blog';
import { handleDailyReward, handleOpenCrate } from './routes/gamification';
import { handleCheckEnv } from './routes/debug';
import { handleGetProfileById, handleGetPostsByUserId } from './routes/user';

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(cookieParser());

// --- Public Routes ---
app.post('/api/auth/signup', handleSignup);
app.post('/api/auth/login', handleLogin);
app.post('/api/auth/request-password-reset', handlePasswordReset);
app.post('/api/auth/update-password', handlePasswordUpdate);
app.get('/api/check-env', handleCheckEnv);

// New public GET routes for user data
app.get('/api/user/profile/:id', handleGetProfileById);
app.get('/api/user/posts/:userId', handleGetPostsByUserId);

// --- Authenticated Routes ---
app.use(authMiddleware);

app.post('/api/auth/logout', handleLogout);

// Profile
app.put('/api/profile', handleUpdateProfile);

// Blog Posts
app.post('/api/blog/post', handleCreatePost);
app.put('/api/blog/post/:id', handleUpdatePost);
app.delete('/api/blog/post/:id', handleDeletePost);

// Comments
app.post('/api/blog/comment', handleAddComment);
app.delete('/api/blog/comment/:id', handleDeleteComment);

// Votes
app.post('/api/blog/vote', handleCastVote);

// Gamification
app.post('/api/gamification/daily-reward', handleDailyReward);
app.post('/api/gamification/open-crate', handleOpenCrate);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});