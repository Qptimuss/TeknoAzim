import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { UserProvider, useUser } from './contexts/UserContext';
import { GamificationProvider } from './contexts/GamificationContext';
import { SnackbarProvider } from './contexts/SnackbarContext';
import theme from './theme';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';
import ProfilePage from './pages/ProfilePage';
import AuthPage from './pages/AuthPage';
import CreatePostPage from './pages/CreatePostPage';
import EditPostPage from './pages/EditPostPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import GlobalSnackbar from './components/ui/GlobalSnackbar';
import LoadingScreen from './components/ui/LoadingScreen'; // Import the new component
import StorePage from './pages/StorePage';

// AppContent will contain the router and all pages.
// It will only be rendered after the initial user loading is complete.
const AppContent = () => {
  const { loading } = useUser();

  // While the session and profile are being fetched, show a loading screen
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Router>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <main style={{ flex: 1, paddingTop: '64px' }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:id" element={<BlogPostPage />} />
            <Route path="/profile/:id" element={<ProfilePage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/store" element={<StorePage />} />

            {/* Protected Routes */}
            <Route path="/create-post" element={<ProtectedRoute><CreatePostPage /></ProtectedRoute>} />
            <Route path="/edit-post/:id" element={<ProtectedRoute><EditPostPage /></ProtectedRoute>} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <SnackbarProvider>
        <UserProvider>
          <GamificationProvider>
            <AppContent />
            <GlobalSnackbar />
          </GamificationProvider>
        </UserProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;