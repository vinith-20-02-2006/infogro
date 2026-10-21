import React, { useState, useContext } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import SidebarData from "../../assets/json/sidebar.json";
import AuthContext from "../../services/AuthContext";
import "./sidebar.css";

const Sidebar = () => {
  const { user, hasPermission } = useContext(AuthContext);
  const [sidebar, setSidebar] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState({});
  const [openSubItem, setOpenSubItem] = useState({});
  const location = useLocation();

  const toggleSidebar = () => setSidebar(!sidebar);

  const toggleSubmenu = (index) => {
    const updatedOpenSubmenus = Object.keys(openSubmenus).reduce((acc, key) => {
      acc[key] = false;
      return acc;
    }, {});

    updatedOpenSubmenus[index] = !openSubmenus[index];
    setOpenSubmenus(updatedOpenSubmenus);
  };

  const toggleSubar = (index, subIndex) => {
    const updatedOpenSubItems = Object.keys(openSubItem).reduce((acc, key) => {
      acc[key] = false;
      return acc;
    }, {});

    updatedOpenSubItems[index] = {
      ...updatedOpenSubItems[index],
      [subIndex]: !openSubItem[index]?.[subIndex]
    };
    setOpenSubItem(updatedOpenSubItems);
  };

  const isItemPermitted = (item) => {
    if (item.path === "/course") return hasPermission("course");
    if (item.path === "/adm" || item.path === "/certificate") return hasPermission("certificate");
    // Other miscellaneous sections in sidebar.json are visible to Admin
    return user?.role === "Admin" || user?.is_superuser;
  };

  return (
    <div
      id="layout-menu"
      className={`layout-menu menu-vertical menu bg-menu-theme ${
        sidebar ? "show" : "hide"
      }`}
    >
      <div className="app-brand demo">
        <a href="/" className="app-brand-link">
          <span className="app-brand-text demo menu-text fw-bolder text-uppercase ms-2">
            IGT
          </span>
        </a>
        <i
          className="layout-menu-toggle menu-link text-large ms-auto d-block d-xl-none"
          onClick={toggleSidebar}
        >
          <i className="bx bx-chevron-left bx-sm align-middle"></i>
        </i>
      </div>

      <div className="menu-inner-shadow"></div>

      <ul className="menu-item py-1 menu-scroll-container">
        {/* Dashboard Menu (Visible only if user has dashboard permission) */}
        {hasPermission("dashboard") && (
          <li className={`menu-item ${location.pathname === "/dashboard" ? "active" : ""}`}>
            <Link
              to="/dashboard"
              className="menu-link"
              style={{ color: location.pathname === "/dashboard" ? "#696cff" : "" }}
            >
              <i className="menu-icon tf-icons bx bx-home-circle"></i>
              <div data-i18n="Analytics">Dashboard</div>
            </Link>
          </li>
        )}

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

        {/* User Management Menu (Visible if Admin or granted permission) */}
        {hasPermission("user_management") && (
          <li className={`menu-item ${location.pathname === "/user-management" ? "active" : ""}`}>
            <NavLink
              to="/user-management"
              className="menu-link"
              style={{ color: location.pathname === "/user-management" ? "#696cff" : "" }}
            >
              <i className="menu-icon tf-icons bx bx-user-check"></i>
              <div data-i18n="User Management">User Management</div>
            </NavLink>
          </li>
        )}

        {/* SidebarData items from sidebar.json rendered in original design */}
        {SidebarData.filter(isItemPermitted).map((item, index) => (
          <React.Fragment key={index}>
            {item.main && (
              <li className="menu-header small text-uppercase">
                <span className="menu-header-text">{item.main}</span>
              </li>
            )}
            <li className={`menu-item ${location.pathname === item.path ? "active" : ""}`}>
              <NavLink
                to={item.path}
                className={`${item.iconopen} ${
                  openSubmenus[index] ? "selected" : ""
                } ${location.pathname === item.path ? "current" : ""} `}
                style={{ color: location.pathname === item.path ? "#696cff" : "" }}
                onClick={() => toggleSubmenu(index)}
                aria-expanded={openSubmenus[index] ? "true" : "false"}
              >
                <i className={item.icon}></i>
                <div data-i18n="Account Settings">{item.title}</div>
                <div>
                  {item.subNav &&
                    (openSubmenus[index] ? item.iconOpened : item.iconClosed)}
                </div>
              </NavLink>
              {item.subNav && openSubmenus[index] && (
                <ul className="menu-sub">
                  {item.subNav.map((subItem, subIndex) => (
                    <li
                      className={`menu-item ${location.pathname === item.path ? "active" : ""}`}
                      key={subIndex}
                    >
                      <NavLink
                        to={subItem.path}
                        style={{ color: location.pathname === subItem.path ? "#696cff" : "" }}
                        className={`menu-link ${subItem.iconopen} ${
                          openSubItem[index]?.[subIndex] ? "selected" : ""
                        } ${location.pathname === subItem.path ? "current" : ""}`}
                        onClick={() => toggleSubar(index, subIndex)}
                        aria-expanded={openSubItem[index]?.[subIndex] ? "true" : "false"}
                      >
                        <div data-i18n="Account">{subItem.title}</div>
                        <div>
                          {subItem.subNav &&
                            (openSubItem[index]?.[subIndex] ? subItem.iconOpened : subItem.iconClosed)}
                        </div>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          </React.Fragment>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
