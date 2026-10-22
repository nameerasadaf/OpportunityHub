import React from "react";
import { useOpportunity } from "../../context/OpportunityContext.jsx";

export default function MobileNav() {
  const { activePage, setActivePage, unreadNotificationsCount } = useOpportunity();

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "explore", label: "Explore", icon: "🌐" },
    { id: "tracking", label: "Tracker", icon: "📋" },
    { id: "calendar", label: "Calendar", icon: "📅" },
    {
      id: "notifications",
      label: "Alerts",
      icon: "🔔",
      hasBadge: unreadNotificationsCount > 0,
    },
  ];

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      {tabs.map((tab) => {
        const isActive = activePage === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            className={`mobile-nav-tab ${isActive ? "active" : ""}`}
            onClick={() => setActivePage(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.hasBadge && (
              <span
                style={{
                  position: "absolute",
                  top: "4px",
                  right: "12px",
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#ef4444",
                }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
