import React from "react";
import { useOpportunity } from "../../context/OpportunityContext.jsx";

export default function Sidebar({ mobileOpen, onCloseMobile }) {
  const {
    activePage,
    setActivePage,
    opportunities,
    unreadNotificationsCount,
    settings,
  } = useOpportunity();

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    {
      id: "explore",
      label: "Explore",
      icon: "🌐",
      badge: "Live",
      badgeClass: "",
    },
    {
      id: "tracking",
      label: "My Tracking",
      icon: "📋",
      badge: opportunities.length ? String(opportunities.length) : null,
      badgeClass: "",
    },
    { id: "analysis", label: "Analysis", icon: "📈" },
    { id: "calendar", label: "Calendar", icon: "📅" },
    {
      id: "notifications",
      label: "Notifications",
      icon: "🔔",
      badge: unreadNotificationsCount > 0 ? String(unreadNotificationsCount) : null,
      badgeClass: unreadNotificationsCount > 0 ? "alert" : "",
    },
    { id: "settings", label: "Settings", icon: "⚙️" },
  ];

  function handleNavigate(pageId) {
    setActivePage(pageId);
    if (onCloseMobile) onCloseMobile();
  }

  return (
    <>
      <div
        className={`sidebar-backdrop ${mobileOpen ? "mobile-open" : ""}`}
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      <aside className={`app-sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        <div>
          <div className="brand-section">
            <div className="brand-logo-icon">🚀</div>
            <div className="brand-text">
              <span className="brand-title">
                Opportunity<span>Hub</span>
              </span>
              <span className="brand-badge">STUDENT CAREER TRACKER</span>
            </div>
          </div>

          <div className="nav-section-label">Navigation</div>
          <nav className="sidebar-nav">
            {navItems.map((item) => {
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`nav-link ${isActive ? "active" : ""}`}
                  onClick={() => handleNavigate(item.id)}
                >
                  <div className="nav-link-left">
                    <span className="nav-icon">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className={`nav-badge-pill ${item.badgeClass || ""}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="sidebar-footer">
          <div
            className="profile-chip"
            onClick={() => handleNavigate("settings")}
            title="Open Profile Settings"
          >
            <div className="profile-avatar">
              {(settings.studentName || "S").charAt(0).toUpperCase()}
            </div>
            <div className="profile-details">
              <span className="profile-name">
                {settings.studentName || "Student"}
              </span>
              <span className="profile-sub">
                {settings.university || settings.targetRoles || "View Preferences"}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
