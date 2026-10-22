import React from "react";
import { useOpportunity } from "../context/OpportunityContext.jsx";
import { formatDate, formatTimeAgo, getDeadlineInfo } from "../utils/dateUtils.js";
import { STATUS_LIST, getStatusColor } from "../utils/storageUtils.js";

export default function DashboardPage({
  onOpenAddModal,
  onOpenDetailModal,
  onOpenAiAssistant,
}) {
  const {
    opportunities,
    activities,
    allCalendarEvents,
    setActivePage,
  } = useOpportunity();

  const totalTracked = opportunities.length;
  const appliedCount = opportunities.filter((o) => o.status === "Applied").length;
  const interviewCount = opportunities.filter((o) => o.status === "Interview").length;
  const selectedCount = opportunities.filter((o) => o.status === "Selected").length;

  const dueSoonOrTodayCount = opportunities.filter((o) => {
    const info = getDeadlineInfo(o.deadline);
    return info.status === "soon" || info.status === "today";
  }).length;

  const overdueCount = opportunities.filter((o) => {
    const info = getDeadlineInfo(o.deadline);
    return info.status === "overdue";
  }).length;

  // Upcoming 5 events & deadlines
  const upcomingEvents = allCalendarEvents
    .filter((e) => {
      const info = getDeadlineInfo(e.date);
      return info.status !== "overdue";
    })
    .slice(0, 5);

  // Recent 6 activities
  const recentActivities = activities.slice(0, 6);

  return (
    <div className="page-container">
      {/* Metrics Row */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Total Tracked</span>
            <div className="stat-card-icon" style={{ background: "#eef2ff", color: "#4f46e5" }}>
              📋
            </div>
          </div>
          <div className="stat-card-value">{totalTracked}</div>
          <div className="stat-card-subtext">Active applications in pipeline</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Submitted Applications</span>
            <div className="stat-card-icon" style={{ background: "#e0f2fe", color: "#0284c7" }}>
              🚀
            </div>
          </div>
          <div className="stat-card-value">{appliedCount}</div>
          <div className="stat-card-subtext">
            {totalTracked > 0
              ? `${Math.round((appliedCount / totalTracked) * 100)}% of tracked items applied`
              : "No applications submitted yet"}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Active Interviews</span>
            <div className="stat-card-icon" style={{ background: "#fef9c3", color: "#ca8a04" }}>
              💼
            </div>
          </div>
          <div className="stat-card-value">{interviewCount}</div>
          <div className="stat-card-subtext">
            {selectedCount > 0 ? `🎉 ${selectedCount} offer/selection received!` : "Interview stage active"}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Upcoming Deadlines</span>
            <div
              className="stat-card-icon"
              style={{
                background: overdueCount > 0 ? "#fee2e2" : "#ecfdf5",
                color: overdueCount > 0 ? "#dc2626" : "#059669",
              }}
            >
              ⏰
            </div>
          </div>
          <div className="stat-card-value">
            {dueSoonOrTodayCount}
            {overdueCount > 0 && (
              <span style={{ fontSize: "14px", color: "#dc2626", marginLeft: "8px", fontWeight: 600 }}>
                ({overdueCount} overdue)
              </span>
            )}
          </div>
          <div className="stat-card-subtext">Closing within 7 days</div>
        </div>
      </div>

      {/* Application Pipeline Overview */}
      <section className="pipeline-section">
        <div className="pipeline-header">
          <div>
            <h2 className="section-heading">Application Pipeline Progress</h2>
            <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
              Live distribution of your opportunities across recruitment phases
            </p>
          </div>
          <button
            type="button"
            className="box-action-link"
            onClick={() => setActivePage("tracking")}
          >
            Manage Pipeline →
          </button>
        </div>

        <div className="pipeline-grid">
          {STATUS_LIST.map((statusName) => {
            const count = opportunities.filter((o) => o.status === statusName).length;
            const style = getStatusColor(statusName);
            return (
              <div
                key={statusName}
                className="pipeline-chip"
                onClick={() => setActivePage("tracking")}
                title={`Filter by ${statusName}`}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span className="chip-name">{statusName}</span>
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: style.text,
                    }}
                  />
                </div>
                <span className="chip-value">{count}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Two Column Section */}
      <div className="dashboard-split">
        {/* Left Column: Upcoming Deadlines & Events */}
        <div className="dashboard-column">
          <div className="content-box">
            <div className="box-header">
              <div>
                <h3 className="section-heading">Upcoming Deadlines & Schedule</h3>
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  Key milestones, deadlines, and interviews
                </span>
              </div>
              <button
                type="button"
                className="box-action-link"
                onClick={() => setActivePage("calendar")}
              >
                Full Calendar →
              </button>
            </div>

            {upcomingEvents.length > 0 ? (
              <div className="events-list">
                {upcomingEvents.map((evt) => {
                  const deadlineInfo = getDeadlineInfo(evt.date);
                  return (
                    <div
                      key={evt.id}
                      className="event-row"
                      style={{ cursor: evt.opportunityId ? "pointer" : "default" }}
                      onClick={() => {
                        if (evt.opportunityId) onOpenDetailModal(evt.opportunityId);
                      }}
                    >
                      <div className="event-left">
                        <span
                          className="event-type-dot"
                          style={{ background: evt.color || "#4f46e5" }}
                        />
                        <div className="event-info">
                          <span className="event-title">{evt.title}</span>
                          <span className="event-sub">
                            {formatDate(evt.date)}
                            {evt.company && <span> • {evt.company}</span>}
                            {evt.type && <span> • {evt.type}</span>}
                          </span>
                        </div>
                      </div>

                      <div className="event-right">
                        <span className={`badge badge-${deadlineInfo.className}`}>
                          {deadlineInfo.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: "30px 16px" }}>
                <div className="empty-state-icon">🎉</div>
                <div className="empty-state-title">No upcoming deadlines</div>
                <p className="empty-state-text">
                  You are all caught up! Explore new internships or add upcoming tests in the calendar.
                </p>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setActivePage("explore")}
                >
                  Explore Opportunities
                </button>
              </div>
            )}
          </div>

          {/* Quick Action Cards Banner */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "12px",
            }}
          >
            <div
              className="content-box"
              style={{
                cursor: "pointer",
                borderLeft: "4px solid #4f46e5",
                padding: "16px",
              }}
              onClick={onOpenAddModal}
            >
              <div style={{ fontSize: "20px", marginBottom: "6px" }}>➕</div>
              <strong style={{ fontSize: "14px", display: "block", color: "#0f172a" }}>
                Add Opportunity
              </strong>
              <span style={{ fontSize: "12px", color: "#64748b" }}>
                Manually record a new role
              </span>
            </div>

            <div
              className="content-box"
              style={{
                cursor: "pointer",
                borderLeft: "4px solid #059669",
                padding: "16px",
              }}
              onClick={() => setActivePage("explore")}
            >
              <div style={{ fontSize: "20px", marginBottom: "6px" }}>🌐</div>
              <strong style={{ fontSize: "14px", display: "block", color: "#0f172a" }}>
                Live Discovery
              </strong>
              <span style={{ fontSize: "12px", color: "#64748b" }}>
                Browse verified campus portals
              </span>
            </div>

            <div
              className="content-box"
              style={{
                cursor: "pointer",
                borderLeft: "4px solid #8b5cf6",
                padding: "16px",
              }}
              onClick={onOpenAiAssistant}
            >
              <div style={{ fontSize: "20px", marginBottom: "6px" }}>✨</div>
              <strong style={{ fontSize: "14px", display: "block", color: "#0f172a" }}>
                AI Strategy
              </strong>
              <span style={{ fontSize: "12px", color: "#64748b" }}>
                Ask Gemini for application advice
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Activity Feed */}
        <div className="dashboard-column">
          <div className="content-box">
            <div className="box-header">
              <div>
                <h3 className="section-heading">Recent Activity</h3>
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  Real chronological log of your actions
                </span>
              </div>
              <button
                type="button"
                className="box-action-link"
                onClick={() => setActivePage("tracking")}
              >
                View Tracker →
              </button>
            </div>

            {recentActivities.length > 0 ? (
              <div className="activity-feed">
                {recentActivities.map((act) => {
                  let icon = "⚡";
                  if (act.type === "application_submitted") icon = "🚀";
                  else if (act.type === "status_changed") icon = "🔄";
                  else if (act.type === "note_added") icon = "📝";
                  else if (act.type === "opportunity_saved") icon = "💾";
                  else if (act.type === "calendar_event_created") icon = "📅";

                  return (
                    <div key={act.id} className="activity-item">
                      <div className="activity-icon">{icon}</div>
                      <div className="activity-content">
                        <div className="activity-text">{act.title}</div>
                        {act.details && (
                          <div className="activity-details">{act.details}</div>
                        )}
                        <div className="activity-time">{formatTimeAgo(act.timestamp)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: "24px 12px" }}>
                <p className="empty-state-text">No activity recorded yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
