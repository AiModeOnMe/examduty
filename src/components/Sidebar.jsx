import { NavLink } from "react-router-dom";

const Sidebar = () => {
  const navItems = [
    { path: "/", icon: "📊", label: "Dashboard", badge: null },
    { path: "/assignment", icon: "📋", label: "Duty Assignment", badge: "New" },
    { path: "/staff", icon: "👥", label: "Staff Management", badge: null },
    { path: "/halls", icon: "🏛️", label: "Hall Management", badge: null },
  ];

  const reportItems = [
    { path: "/reports", icon: "📈", label: "Reports", badge: null },
    { path: "/history", icon: "📁", label: "History", badge: null },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon">🎓</div>
          <div className="logo-text">
            <h1>ExamCell Pro</h1>
            <span>Management System</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-section-title">Main Menu</div>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
            >
              <span className="nav-item-icon">{item.icon}</span>
              <span className="nav-item-text">{item.label}</span>
              {item.badge && (
                <span className="nav-item-badge">{item.badge}</span>
              )}
            </NavLink>
          ))}
        </div>

        <div className="nav-section">
          <div className="nav-section-title">Analytics</div>
          {reportItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
            >
              <span className="nav-item-icon">{item.icon}</span>
              <span className="nav-item-text">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar">AD</div>
          <div className="user-info">
            <h4>Admin User</h4>
            <span>Exam Coordinator</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;