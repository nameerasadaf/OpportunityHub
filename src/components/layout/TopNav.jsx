import React from "react";
import { useOpportunity } from "../../context/OpportunityContext.jsx";

const PAGE_META = {
  dashboard: {
    title: "Student Dashboard",
    subtitle: "Overview of your application pipeline, active deadlines, and progress",
  },
  explore: {
    title: "Explore Opportunities",
    subtitle: "Real-time internships, hackathons, jobs, and scholarships from verified portals",
  },
  tracking: {
    title: "My Application Tracking",
    subtitle: "Organize, update stages, add notes, and track your complete application journey",
  },
  analysis: {
    title: "Application Analysis",
    subtitle: "Metrics and visual breakdowns calculated from your real tracked opportunities",
  },
  calendar: {
    title: "Calendar & Deadlines",
    subtitle: "Monthly schedule of deadlines, assessments, interviews, and follow-ups",
  },
  notifications: {
    title: "Notification Centre",
    subtitle: "Actionable alerts for approaching deadlines, follow-ups, and interview stages",
  },
  settings: {
    title: "Settings & Preferences",
    subtitle: "Manage your profile, alert preferences, and CSV / JSON data exports",
  },
};

export default function TopNav({
  onToggleMobile,
  onOpenAddModal,
  onToggleAiAssistant,
  aiAssistantOpen,
}) {
  const { activePage, setActivePage, unreadNotificationsCount } = useOpportunity();
  const meta = PAGE_META[activePage] || {
    title: "OpportunityHub",
    subtitle: "Student Opportunity & Career Management",
  };

  return (
    <header className="app-topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="menu-toggle-btn"
          onClick={onToggleMobile}
          aria-label="Toggle navigation menu"
        >
          ☰
        </button>

        <div className="page-headline">
          <h1>{meta.title}</h1>
          <p>{meta.subtitle}</p>
        </div>
      </div>

      <div className="topbar-right">
        <button
          type="button"
          className="btn-ai-sparkle"
          onClick={onToggleAiAssistant}
          title="Open Gemini AI Strategy Assistant"
        >
          <span>✨</span>
          <span>{aiAssistantOpen ? "Close AI" : "AI Assistant"}</span>
        </button>

        <button
          type="button"
          className="btn-primary"
          onClick={onOpenAddModal}
          title="Add a new opportunity manually"
        >
          <span>+</span>
          <span>Add Opportunity</span>
        </button>

        <button
          type="button"
          className="topbar-icon-btn"
          onClick={() => setActivePage("notifications")}
          title="View Notifications"
          aria-label="View notifications"
        >
          🔔
          {unreadNotificationsCount > 0 && (
            <span className="topbar-icon-badge">
              {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
