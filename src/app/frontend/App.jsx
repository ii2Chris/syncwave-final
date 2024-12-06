import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../../components/ProtectedRoute';
import Login from '../../components/login';
import Signup from '../../components/signup';
import Dashboard from './pages/dashboard';
import SearchResults from './pages/SearchResults';
import SwipePage from './pages/SwipePage';
import LandingPage from './pages/LandingPage';
import ProfilePage from './pages/ProfilePage';
import Chat from '../../components/Chat';
import ChatList from './pages/ChatList';

// Import other components as needed

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Navigate to="/dashboard" replace />
          </ProtectedRoute>
        } />
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/search-results" element={
          <ProtectedRoute>
            <SearchResults />
          </ProtectedRoute>
        } />
        
        <Route path="/swipe/:eventId" element={
          <ProtectedRoute>
            <SwipePage />
          </ProtectedRoute>
        } />

        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />
        
        <Route path="/chat/:matchId" element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        } />
        
        <Route path="/chats" element={
          <ProtectedRoute>
            <ChatList />
          </ProtectedRoute>
        } />
        {/* Add other protected routes as needed */}
      </Routes>
    </Router>
  );
};

export default App;
