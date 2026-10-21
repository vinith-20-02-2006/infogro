import React, { useContext, useState } from "react";
import AuthContext from "../../services/AuthContext";
// import "./sidebar.css";
import Sidebar from "./Sidebar";

const Navbar = () => {
  const { user, logoutUser } = useContext(AuthContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false); // State for dropdown menu

  const handleUpdate = async () => {
    logoutUser();
  };

  const toggleSidebar = () => {
    setSidebarOpen(prevSidebarOpen => !prevSidebarOpen);
  };

  const toggleDropdown = () => {
    setDropdownOpen(prevDropdownOpen => !prevDropdownOpen); // Toggle dropdown state
  };

  return (
    <div className={`layout-menu-100vh ${sidebarOpen ? "layout-menu-expanded" : ""}`}>
      {sidebarOpen && <Sidebar />}
      <nav className="layout-navbar container-xxl navbar navbar-expand-xl navbar-detached align-items-center bg-navbar-theme" id="layout-navbar">
        <div className="layout-menu-toggle navbar-nav align-items-xl-center me-3 me-xl-0 d-xl-none">
          <i className="nav-item nav-link px-0 me-xl-4" onClick={toggleSidebar}>
            <i className="bx bx-menu bx-sm"></i>
          </i>
        </div>
        <ul className="navbar-nav flex-row align-items-center ms-auto">
         
          {/* Dropdown */}
          <li className={`nav-item navbar-dropdown dropdown-user dropdown ${dropdownOpen ? "show" : ""}`}>
            <span className="nav-link dropdown-toggle hide-arrow" style={{ cursor: "pointer" }} onClick={toggleDropdown}>
              <div className="avatar avatar-online">
                <img src="./1.png" alt="s" className="w-px-40 h-auto rounded-circle" />
              </div>
            </span>
            <ul className={`dropdown-menu dropdown-menu-end ${dropdownOpen ? "show" : ""}`} style={{ marginLeft: '-115px' }}>
              <li>
                <div className="dropdown-item">
                  <div className="d-flex">
                    <div className="flex-shrink-0 me-3">
                      <div className="avatar avatar-online">
                        <img src="./1.png" alt="" className="w-px-40 h-auto rounded-circle" />
                      </div>
                    </div>
                    <div className="flex-grow-1">
                      <span className="fw-semibold d-block">{user?.full_name || user?.username || "John Doe"}</span>
                      <small className="text-muted">{user?.role || "Admin"}</small>
                    </div>
                  </div>
                </div>
              </li>
              <li><div className="dropdown-divider"></div></li>
              <li>
                <a className="dropdown-item" href="/profile">
                  <i className="bx bx-user me-2"></i>
                  <span className="align-middle">My Profile</span>
                </a>
              </li>
              <li>
                <span className="dropdown-item" style={{ cursor: "pointer" }}>
                  <i className="bx bx-cog me-2"></i>
                  <span className="align-middle">Settings</span>
                </span>
              </li>
              <li>
                <span className="dropdown-item" style={{ cursor: "pointer" }}>
                  <span className="d-flex align-items-center align-middle">
                    <i className="flex-shrink-0 bx bx-credit-card me-2"></i>
                    <span className="flex-grow-1 align-middle">Billing</span>
                    <span className="flex-shrink-0 badge badge-center rounded-pill bg-danger w-px-20 h-px-20">4</span>
                  </span>
                </span>
              </li>
              <li><div className="dropdown-divider"></div></li>
              <li>
                <button className="dropdown-item" onClick={handleUpdate}>
                  <i className="bx bx-power-off me-2"></i>
                  <span className="align-middle">Log Out</span>
                </button>
              </li>
            </ul>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Navbar;
