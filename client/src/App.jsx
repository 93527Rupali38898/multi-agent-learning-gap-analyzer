import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import CourseSelect from './pages/CourseSelect';
import TopicList from './pages/TopicList';
import IDE from './pages/IDE';
import Dashboard from './pages/Dashboard';
import Achievements from './pages/Achievements';
import Login from './pages/Login';
import Lens from './pages/Lens';
import { AuthProvider, useAuth } from './context/AuthContext';

// Protected Route
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="h-screen bg-black flex items-center justify-center text-[#00CCFF]">
      Loading Sutra AI...
    </div>
  );

  return children;
};

// Layout
const Layout = ({ children }) => (
  <>
    <Navbar />
    {children}
  </>
);

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-black text-white font-sans">
        <Routes>

          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/courses" />} />

          <Route path="/courses" element={
            <ProtectedRoute>
              <Layout><CourseSelect /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/course/:courseId" element={
            <ProtectedRoute>
              <Layout><TopicList /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/ide/:problemId" element={
            <ProtectedRoute>
              <Layout><IDE /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout><Dashboard /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/achievements" element={
            <ProtectedRoute>
              <Layout><Achievements /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/lens/:problemId" element={
            <ProtectedRoute>
              <Lens />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/login" />} />

        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;