import React, { useState, useEffect, useContext, useMemo } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import SidebarData from "../../assets/json/sidebar.json";
import AuthContext from "../../services/AuthContext";
import "./sidebar.css";

const Sidebar = () => {
  const { hasPermission } = useContext(AuthContext);
  const [sidebar, setSidebar] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState({});
  const location = useLocation();

  const toggleSidebar = () => setSidebar(!sidebar);

  const toggleSubmenu = (index) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Compute filtered sidebar based on dynamic permissions
  const permittedItems = useMemo(() => {
    const list = [];
    let currentHeader = null;
    let lastRenderedHeader = null;

    for (const item of SidebarData) {
      if (item.main) {
        currentHeader = item.main;
      }

      let isVisible = false;
      let visibleSubNav = null;

      if (item.subNav && item.subNav.length > 0) {
        visibleSubNav = item.subNav.filter(sub => hasPermission(sub.key, 'view'));
        if (visibleSubNav.length > 0 || (item.key && hasPermission(item.key, 'view'))) {
          isVisible = true;
        }
      } else {
        if (item.key && hasPermission(item.key, 'view')) {
          isVisible = true;
        }
      }

      if (isVisible) {
        const showHeader = currentHeader && currentHeader !== lastRenderedHeader;
        if (showHeader) {
          lastRenderedHeader = currentHeader;
        }
        list.push({
          ...item,
          subNav: visibleSubNav || item.subNav,
          showHeader: showHeader ? currentHeader : null,
        });
      }
    }
    return list;
  }, [hasPermission]);

  useEffect(() => {
    permittedItems.forEach((item, index) => {
      if (item.subNav && item.subNav.some((s) => s.path === location.pathname)) {
        setOpenSubmenus((prev) => ({ ...prev, [index]: true }));
      }
    });
  }, [location.pathname, permittedItems]);

  return (
    <div
      id="layout-menu"
      className={`layout-menu menu-vertical menu bg-menu-theme ${
        sidebar ? "show" : "hide"
      }`}
    >
      <div className="app-brand demo">
        <Link to="/" className="app-brand-link">
          <span className="app-brand-text demo menu-text fw-bolder text-uppercase ms-2">
            IGT
          </span>
        </Link>
        <i
          className="layout-menu-toggle menu-link text-large ms-auto d-block d-xl-none"
          onClick={toggleSidebar}
        >
          <i className="bx bx-chevron-left bx-sm align-middle"></i>
        </i>
      </div>

      <div className="menu-inner-shadow"></div>

      <ul className="menu-inner py-1 menu-scroll-container">
        {/* Profile Menu (Always visible by default to all users) */}
        <li className={`menu-item ${location.pathname === "/profile" ? "active" : ""}`}>
          <Link
            to="/profile"
            className="menu-link"
            style={{ color: location.pathname === "/profile" ? "#696cff" : "" }}
          >
            <i className="menu-icon tf-icons bx bx-user"></i>
            <div data-i18n="Profile">Profile</div>
          </Link>
        </li>

        {/* Dynamic Permitted Sidebar Items from sidebar.json */}
        {permittedItems.map((item, index) => (
          <React.Fragment key={index}>
            {item.showHeader && (
              <li className="menu-header small text-uppercase">
                <span className="menu-header-text">{item.showHeader}</span>
              </li>
            )}
            <li
              className={`menu-item ${
                location.pathname === item.path ||
                (item.subNav && item.subNav.some(s => location.pathname === s.path))
                  ? "active"
                  : ""
              }`}
            >
              {item.subNav && item.subNav.length > 0 ? (
                <>
                  <a
                    href="#/"
                    className={`menu-link menu-toggle ${openSubmenus[index] ? "show" : ""}`}
                    onClick={(e) => {
                      e.preventDefault();
                      toggleSubmenu(index);
                    }}
                    aria-expanded={openSubmenus[index] ? "true" : "false"}
                  >
                    <i className={item.icon}></i>
                    <div data-i18n={item.title}>{item.title}</div>
                  </a>
                  {openSubmenus[index] && (
                    <ul className="menu-sub">
                      {item.subNav.map((subItem, subIndex) => (
                        <li
                          className={`menu-item ${
                            location.pathname === subItem.path ? "active" : ""
                          }`}
                          key={subIndex}
                        >
                          <NavLink
                            to={subItem.path}
                            style={{
                              color:
                                location.pathname === subItem.path
                                  ? "#696cff"
                                  : "",
                            }}
                            className={`menu-link ${
                              location.pathname === subItem.path ? "active" : ""
                            }`}
                          >
                            {subItem.icon && (
                              <i className={subItem.icon + " me-1"}></i>
                            )}
                            <div data-i18n={subItem.title}>{subItem.title}</div>
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <NavLink
                  to={item.path}
                  className={`menu-link ${
                    location.pathname === item.path ? "active" : ""
                  }`}
                  style={{
                    color: location.pathname === item.path ? "#696cff" : "",
                  }}
                >
                  <i className={item.icon}></i>
                  <div data-i18n={item.title}>{item.title}</div>
                </NavLink>
              )}
            </li>
          </React.Fragment>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
