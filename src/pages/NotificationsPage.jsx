import React, { useState } from "react";
import { useOpportunity } from "../context/OpportunityContext.jsx";
import { formatDate } from "../utils/dateUtils.js";

export default function NotificationsPage({ onOpenDetailModal }) {
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    settings,
    updateSettings,
    setActivePage,
  } = useOpportunity();

  const [filter, setFilter] = useState("all"); // 'all' or 'unread'
  const [browserPermission, setBrowserPermission] = useState(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission;
    }
    return "unsupported";
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.isRead;
    return true;
  });

  async function requestNotificationPermission() {
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const perm = await Notification.requestPermission();
        setBrowserPermission(perm);
        if (perm === "granted") {
          new Notification("OpportunityHub Notifications Enabled", {
            body: "You will receive timely reminders for application deadlines and interviews.",
            icon: "/favicon.svg",
          });
        }
      } catch (err) {
        console.error("Permission request error:", err);
      }
    }
  }

  return (
    <div className="page-container">
      {/* Top Filter & Actions */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "20px",
          background: "#ffffff",
          padding: "16px 20px",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
        }}
      >
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            type="button"
            className={`filter-tab ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All Alerts ({notifications.length})
          </button>
          <button
            type="button"
            className={`filter-tab ${filter === "unread" ? "active" : ""}`}
            onClick={() => setFilter("unread")}
          >
            Unread ({unreadCount})
          </button>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {unreadCount > 0 && (
            <button
              type="button"
              className="btn-secondary"
              onClick={markAllNotificationsRead}
              title="Mark all notifications as read"
            >
              ✓ Mark All as Read
            </button>
          )}

          <button
            type="button"
            className="btn-secondary"
            onClick={() => setActivePage("settings")}
          >
            ⚙️ Alert Preferences
          </button>
        </div>
      </div>

      {/* Browser Permission Explanatory Card */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
          background: browserPermission === "granted" ? "#ecfdf5" : "#f8fafc",
          border: `1px solid ${browserPermission === "granted" ? "#a7f3d0" : "#e2e8f0"}`,
          borderRadius: "12px",
          padding: "14px 20px",
          marginBottom: "24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "22px" }}>
            {browserPermission === "granted" ? "🔔" : "🔕"}
          </span>
          <div>
            <strong style={{ fontSize: "13px", color: "#1e293b", display: "block" }}>
              Browser Desktop Notifications:{" "}
              <span style={{ textTransform: "capitalize", color: browserPermission === "granted" ? "#047857" : "#b45309" }}>
                {browserPermission}
              </span>
            </strong>
            <span style={{ fontSize: "12px", color: "#64748b" }}>
              {browserPermission === "granted"
                ? "Your browser is allowed to display reminders for deadlines and upcoming interviews."
                : "Enable desktop alerts so you never miss an application deadline even when this tab is in background."}
            </span>
          </div>
        </div>

        {browserPermission !== "granted" && browserPermission !== "unsupported" && (
          <button
            type="button"
            className="btn-primary"
            style={{ fontSize: "12px", padding: "7px 14px" }}
            onClick={requestNotificationPermission}
          >
            Enable Browser Alerts
          </button>
        )}
      </div>

      {/* Notification List */}
      {filteredNotifications.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filteredNotifications.map((n) => {
            let icon = "🔔";
            let borderColor = "#e2e8f0";
            let bgBadge = "#f1f5f9";
            let textBadge = "#475569";

            if (n.type === "deadline_overdue") {
              icon = "⚠️";
              borderColor = "#fecaca";
              bgBadge = "#fee2e2";
              textBadge = "#991b1b";
            } else if (n.type === "deadline_today") {
              icon = "⏰";
              borderColor = "#fde68a";
              bgBadge = "#fef3c7";
              textBadge = "#92400e";
            } else if (n.type === "deadline_soon") {
              icon = "⏳";
              borderColor = "#fed7aa";
              bgBadge = "#ffedd5";
              textBadge = "#9a3412";
            } else if (n.type === "interview_active") {
              icon = "💼";
              borderColor = "#e9d5ff";
              bgBadge = "#f3e8ff";
              textBadge = "#6b21a8";
            } else if (n.type === "followup_due") {
              icon = "📬";
              borderColor = "#bae6fd";
              bgBadge = "#e0f2fe";
              textBadge = "#0369a1";
            }

            return (
              <div
                key={n.id}
                style={{
                  background: n.isRead ? "#ffffff" : "#fcfdff",
                  border: `1px solid ${borderColor}`,
                  borderRadius: "12px",
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: "16px",
                  boxShadow: n.isRead ? "none" : "0 2px 6px rgba(79, 70, 229, 0.05)",
                  position: "relative",
                  transition: "background 0.15s ease",
                }}
              >
                {!n.isRead && (
                  <div
                    style={{
                      position: "absolute",
                      left: "6px",
                      top: "20px",
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "#4f46e5",
                    }}
                    title="Unread notification"
                  />
                )}

                <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", minWidth: 0 }}>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      background: bgBadge,
                      color: textBadge,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "16px",
                      flexShrink: 0,
                    }}
                  >
                    {icon}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                      <strong style={{ fontSize: "14px", color: "#0f172a" }}>{n.title}</strong>
                      {n.badge && (
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: "999px",
                            background: bgBadge,
                            color: textBadge,
                          }}
                        >
                          {n.badge}
                        </span>
                      )}
                    </div>

                    <p style={{ margin: "0 0 6px", fontSize: "13px", color: "#475569", lineHeight: 1.5 }}>
                      {n.message}
                    </p>

                    {n.date && (
                      <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                        Due / Target: {formatDate(n.date)}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 }}>
                  {n.opportunityId && (
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ fontSize: "12px", padding: "6px 12px" }}
                      onClick={() => {
                        markNotificationRead(n.id);
                        onOpenDetailModal(n.opportunityId);
                      }}
                    >
                      View Role
                    </button>
                  )}

                  {!n.isRead && (
                    <button
                      type="button"
                      style={{ fontSize: "12px", color: "#64748b", padding: "6px" }}
                      onClick={() => markNotificationRead(n.id)}
                      title="Mark as read"
                    >
                      ✓ Mark read
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">🔔</div>
          <div className="empty-state-title">
            {filter === "unread" ? "No unread notifications" : "No notifications right now"}
          </div>
          <p className="empty-state-text">
            {filter === "unread"
              ? "You have acknowledged all active deadline alerts and reminders."
              : "When application deadlines approach or follow-ups come due, timely actionable reminders will appear here."}
          </p>
        </div>
      )}
    </div>
  );
}
