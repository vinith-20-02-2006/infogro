import React, { useContext } from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthContext, { AuthProvider } from './services/AuthContext';
import PrivateRoute from './services/PrivateRoute';
import Dashboard from './dashboard/Dashboard';
import Course from './dashboard/course/Course';
import Sidebar from './dashboard/sidebar/Sidebar';
import Login from './authentication/Login';
import Navbar from './dashboard/sidebar/Navbar';
import Certificate from './dashboard/certificate/Certificate';
import Profile from './dashboard/profile/Profile';
import UserManagement from './dashboard/usermanagement/UserManagement';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="light-style layout-menu-fixed">
          <div className="layout-wrapper layout-content-navbar">
            <div className="layout-container">
              <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/*" element={<ProtectedRoutes />} />
              </Routes>
            </div>
          </div>
        </div>
      </AuthProvider>
    </Router>
  );
}

function ProtectedRoutes() {
  const { hasPermission } = useContext(AuthContext);

  const canDashboard = hasPermission('dashboard');
  const canCourse = hasPermission('course');
  const canCertificate = hasPermission('certificate');
  const canUserMgmt = hasPermission('user_management');

  return (
    <>
      <Sidebar />
      <div className="layout-page">
        <Navbar />
        <div className="content-wrapper">
          <Routes>
            <Route element={<PrivateRoute />}>
              {/* Dashboard Route: requires 'dashboard' permission, otherwise redirects to /profile */}
              <Route
                path="/dashboard"
                element={canDashboard ? <Dashboard /> : <Navigate to="/profile" replace />}
              />

              {/* Profile Route: visible and accessible to all authenticated users */}
              <Route path="/profile" element={<Profile />} />

              {/* Course Route: requires 'course' permission */}
              <Route
                path="/course"
                element={canCourse ? <Course /> : <Navigate to="/profile" replace />}
              />

              {/* Certificate Route: requires 'certificate' permission */}
              <Route
                path="/adm"
                element={canCertificate ? <Certificate /> : <Navigate to="/profile" replace />}
              />
              <Route
                path="/certificate"
                element={canCertificate ? <Certificate /> : <Navigate to="/profile" replace />}
              />

              {/* User Management Route: requires 'user_management' permission */}
              <Route
                path="/user-management"
                element={canUserMgmt ? <UserManagement /> : <Navigate to="/profile" replace />}
              />

              {/* Fallback route */}
              <Route
                path="*"
                element={<Navigate to={canDashboard ? "/dashboard" : "/profile"} replace />}
              />
            </Route>
          </Routes>
        </div>
      </div>
    </>
  );
}

export default App;
