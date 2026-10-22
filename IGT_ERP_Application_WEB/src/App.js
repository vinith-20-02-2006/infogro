import React, { useContext, useMemo } from 'react';
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
import StaffRegister from './dashboard/staff/StaffRegister';
import StudentRegister from './dashboard/admission/StudentRegister';
import DepartmentDesignation from './dashboard/master/DepartmentDesignation';
import ModulePage from './dashboard/common/ModulePage';
import AccessDenied from './dashboard/common/AccessDenied';
import SidebarData from './assets/json/sidebar.json';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="light-style layout-menu-fixed">
          <div className="layout-wrapper layout-content-navbar">
            <div className="layout-container">
              <Routes>
                {/* Public Login Route - Redirects authenticated users directly to dashboard/profile */}
                <Route path="/" element={<PublicLoginRoute />} />

                {/* All Protected ERP Routes */}
                <Route path="/*" element={<ProtectedRoutes />} />
              </Routes>
            </div>
          </div>
        </div>
      </AuthProvider>
    </Router>
  );
}

// Redirects logged in users to avoid redundant login screens
function PublicLoginRoute() {
  const { user, hasPermission } = useContext(AuthContext);

  if (user) {
    const canDashboard = hasPermission('dashboard');
    return <Navigate to={canDashboard ? "/dashboard" : "/profile"} replace />;
  }

  return <Login />;
}

function ProtectedRoutes() {
  const { hasPermission } = useContext(AuthContext);

  // Flatten sidebar.json into route definitions
  const allRoutes = useMemo(() => {
    const routes = [];
    const seenPaths = new Set();

    SidebarData.forEach((item) => {
      if (item.subNav && item.subNav.length > 0) {
        item.subNav.forEach((sub) => {
          if (!seenPaths.has(sub.path)) {
            seenPaths.add(sub.path);
            routes.push({
              path: sub.path,
              key: sub.key,
              title: sub.title,
              section: item.title,
              icon: sub.icon || item.icon,
            });
          }
        });
      } else {
        if (!seenPaths.has(item.path)) {
          seenPaths.add(item.path);
          routes.push({
            path: item.path,
            key: item.key,
            title: item.title,
            section: item.main || 'Module',
            icon: item.icon,
          });
        }
      }
    });

    return routes;
  }, []);

  // Determine which component renders for a given path
  const renderRouteElement = (route) => {
    const p = route.path;

    // 1. Dashboard
    if (p === '/dashboard') {
      return hasPermission('dashboard') ? (
        <Dashboard />
      ) : (
        <AccessDenied moduleName="Dashboard" />
      );
    }

    // 2. Profile
    if (p === '/profile') {
      return <Profile />;
    }

    // 3. Course Details
    if (p === '/course') {
      return hasPermission('course') ? (
        <Course />
      ) : (
        <AccessDenied moduleName="Course" />
      );
    }

    // 4. Certificates & Certificate Generation
    if (p === '/adm' || p === '/certificate') {
      const canCert = hasPermission('certificate') || hasPermission('certificate_generation');
      return canCert ? (
        <Certificate />
      ) : (
        <AccessDenied moduleName="Certificate" />
      );
    }

    // 5. Users & Roles
    if (p === '/settings/users' || p === '/user-management') {
      const canUserMgmt = hasPermission('settings_users') || hasPermission('user_management');
      return canUserMgmt ? (
        <UserManagement />
      ) : (
        <AccessDenied moduleName="Users & Roles" />
      );
    }

    // 6. Staff Registration
    if (p === '/staff/register') {
      return hasPermission('staff_register') ? (
        <StaffRegister />
      ) : (
        <AccessDenied moduleName="Staff Registration" />
      );
    }

    // 7. Student Registration
    if (p === '/registration') {
      return hasPermission('registration') ? (
        <StudentRegister />
      ) : (
        <AccessDenied moduleName="Registration" />
      );
    }

    // 8. Department & Designation
    if (p === '/department') {
      return hasPermission('department') ? (
        <DepartmentDesignation />
      ) : (
        <AccessDenied moduleName="Department" />
      );
    }
    if (p === '/designation') {
      return hasPermission('designation') ? (
        <DepartmentDesignation />
      ) : (
        <AccessDenied moduleName="Designation" />
      );
    }

    // 9. All other ERP modules from sidebar.json
    const canView = hasPermission(route.key, 'view');
    if (!canView) {
      return <AccessDenied moduleName={route.title} />;
    }

    return (
      <ModulePage
        title={route.title}
        category={route.section}
        menuKey={route.key}
        icon={route.icon}
      />
    );
  };

  const canDashboard = hasPermission('dashboard');

  return (
    <>
      <Sidebar />
      <div className="layout-page">
        <Navbar />
        <div className="content-wrapper">
          <Routes>
            <Route element={<PrivateRoute />}>
              {/* Profile Route: Always accessible to authenticated users */}
              <Route path="/profile" element={<Profile />} />

              {/* Legacy and alternative route aliases */}
              <Route
                path="/user-management"
                element={
                  hasPermission('settings_users') || hasPermission('user_management') ? (
                    <UserManagement />
                  ) : (
                    <AccessDenied moduleName="Users & Roles" />
                  )
                }
              />
              <Route
                path="/certificate"
                element={
                  hasPermission('certificate') ? (
                    <Certificate />
                  ) : (
                    <AccessDenied moduleName="Certificate" />
                  )
                }
              />

              {/* Map all 49 distinct paths from sidebar.json */}
              {allRoutes.map((route) => (
                <Route
                  key={route.path}
                  path={route.path}
                  element={renderRouteElement(route)}
                />
              ))}

              {/* Intelligent Fallback Route */}
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
