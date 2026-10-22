import React, { useMemo, useState } from "react";
import { useOpportunity } from "../context/OpportunityContext.jsx";
import { formatDate, getDeadlineInfo, toIsoDate } from "../utils/dateUtils.js";

export default function CalendarPage({
  onOpenEventModal,
  onOpenDetailModal,
}) {
  const { allCalendarEvents, deletePersonalEvent } = useOpportunity();

  const [currentDate, setCurrentDate] = useState(() => new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Month navigation
  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  function goToToday() {
    setCurrentDate(new Date());
  }

  // Days in month calculation
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days = [];

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, d);
      days.push({
        dateNumber: d,
        isoDate: toIsoDate(prevDate),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const dateObj = new Date(year, month, d);
      days.push({
        dateNumber: d,
        isoDate: toIsoDate(dateObj),
        isCurrentMonth: true,
      });
    }

    // Next month padding (complete grid to multiple of 7)
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining && days.length < 42; d++) {
      const nextDate = new Date(year, month + 1, d);
      days.push({
        dateNumber: d,
        isoDate: toIsoDate(nextDate),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [year, month]);

  const todayIso = toIsoDate(new Date());

  // Group events by date ISO
  const eventsByDate = useMemo(() => {
    const map = {};
    allCalendarEvents.forEach((evt) => {
      if (!evt.date) return;
      if (!map[evt.date]) map[evt.date] = [];
      map[evt.date].push(evt);
    });
    return map;
  }, [allCalendarEvents]);

  // Upcoming events sorted
  const upcomingChronological = useMemo(() => {
    return allCalendarEvents
      .filter((e) => {
        if (!e.date) return false;
        return e.date >= todayIso;
      })
      .slice(0, 8);
  }, [allCalendarEvents, todayIso]);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const weekDayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="page-container">
      {/* Calendar & Upcoming split */}
      <div style={{ display: "grid", gridTemplateColumns: "2.3fr 1fr", gap: "24px" }}>
        {/* Main Calendar View */}
        <div className="calendar-wrapper">
          <div className="calendar-nav-bar">
            <div>
              <h2 className="calendar-month-title">
                {monthNames[month]} {year}
              </h2>
              <span style={{ fontSize: "12px", color: "#64748b" }}>
                Click any date cell to schedule an interview or assessment
              </span>
            </div>

            <div className="calendar-nav-buttons">
              <button
                type="button"
                className="cal-nav-btn"
                onClick={goToToday}
                title="Jump to today"
              >
                Today
              </button>
              <button
                type="button"
                className="cal-nav-btn"
                onClick={prevMonth}
                aria-label="Previous month"
              >
                ◀ Prev
              </button>
              <button
                type="button"
                className="cal-nav-btn"
                onClick={nextMonth}
                aria-label="Next month"
              >
                Next ▶
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ padding: "6px 12px", fontSize: "12px" }}
                onClick={() => onOpenEventModal(todayIso)}
              >
                + New Event
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="calendar-grid" style={{ marginBottom: "6px" }}>
            {weekDayNames.map((d) => (
              <div key={d} className="calendar-day-header">
                {d}
              </div>
            ))}
          </div>

          {/* 7x6 Calendar Grid */}
          <div className="calendar-grid">
            {calendarDays.map((cell, idx) => {
              const isToday = cell.isoDate === todayIso;
              const cellEvents = eventsByDate[cell.isoDate] || [];

              return (
                <div
                  key={`${cell.isoDate}-${idx}`}
                  className={`calendar-cell ${!cell.isCurrentMonth ? "other-month" : ""} ${
                    isToday ? "is-today" : ""
                  }`}
                  onClick={() => onOpenEventModal(cell.isoDate)}
                  title={`Click to add event on ${cell.isoDate}`}
                  style={{ cursor: "pointer" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="cell-date-num">{cell.dateNumber}</span>
                    {cellEvents.length > 2 && (
                      <span style={{ fontSize: "9px", color: "#64748b", fontWeight: 700 }}>
                        +{cellEvents.length - 2}
                      </span>
                    )}
                  </div>

                  <div className="cell-events-list">
                    {cellEvents.slice(0, 3).map((evt) => {
                      const isOppDeadline = evt.isDeadline;
                      const isPersonal = evt.isPersonal;

                      return (
                        <div
                          key={evt.id}
                          className="cell-event-badge"
                          style={{
                            background: isOppDeadline ? "#fee2e2" : isPersonal ? "#f3e8ff" : "#fef3c7",
                            color: isOppDeadline ? "#991b1b" : isPersonal ? "#6b21a8" : "#92400e",
                            border: `1px solid ${isOppDeadline ? "#fecaca" : "#e9d5ff"}`,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (evt.opportunityId) {
                              onOpenDetailModal(evt.opportunityId);
                            } else if (evt.isPersonal) {
                              onOpenEventModal(evt.date, evt);
                            }
                          }}
                          title={evt.title}
                        >
                          {evt.type === "Interview"
                            ? "💼"
                            : evt.type === "Assessment"
                            ? "📝"
                            : evt.type === "Deadline"
                            ? "⏰"
                            : "📌"}{" "}
                          {evt.title}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar: Upcoming Chronological Schedule */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="content-box">
            <div className="box-header">
              <h3 className="section-heading">Upcoming Milestones</h3>
              <span style={{ fontSize: "11px", color: "#64748b" }}>Next active</span>
            </div>

            {upcomingChronological.length > 0 ? (
              <div className="events-list">
                {upcomingChronological.map((evt) => {
                  const deadlineInfo = getDeadlineInfo(evt.date);
                  return (
                    <div
                      key={evt.id}
                      className="event-row"
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        if (evt.opportunityId) {
                          onOpenDetailModal(evt.opportunityId);
                        } else if (evt.isPersonal) {
                          onOpenEventModal(evt.date, evt);
                        }
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
                            {evt.company && ` • ${evt.company}`}
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
              <div className="empty-state" style={{ padding: "20px 10px" }}>
                <p className="empty-state-text">No upcoming events scheduled.</p>
              </div>
            )}
          </div>

          {/* Quick instructions */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              padding: "18px",
              fontSize: "12px",
              color: "#475569",
              lineHeight: 1.6,
            }}
          >
            <strong style={{ color: "#1e293b" }}>💡 Calendar Integration Tip:</strong>
            <p style={{ margin: "6px 0 0" }}>
              Deadlines for your tracked opportunities automatically appear on your calendar. You can also click "+ New Event" to record upcoming coding tests, mock interviews, and group project meetings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
