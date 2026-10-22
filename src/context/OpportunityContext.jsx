import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  exportActivitiesToCsv,
  exportBackupToJson,
  exportOpportunitiesToCsv,
} from "../utils/exportUtils.js";
import {
  STATUS_LIST,
  STORAGE_KEYS,
  getTypeColor,
  loadActivities,
  loadCalendarEvents,
  loadOpportunities,
  loadSettings,
  normalizeOpportunity,
} from "../utils/storageUtils.js";
import { getDeadlineInfo, toIsoDate } from "../utils/dateUtils.js";

const OpportunityContext = createContext(null);

export function OpportunityProvider({ children }) {
  const [opportunities, setOpportunities] = useState(() => loadOpportunities());
  const [activities, setActivities] = useState(() => loadActivities());
  const [personalEvents, setPersonalEvents] = useState(() => loadCalendarEvents());
  const [settings, setSettings] = useState(() => loadSettings());
  const [activePage, setActivePage] = useState("dashboard");
  const [readNotificationIds, setReadNotificationIds] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [toast, setToast] = useState({ message: "", type: "info", visible: false });

  // Persistence effects
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.OPPORTUNITIES, JSON.stringify(opportunities));
  }, [opportunities]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(personalEvents));
  }, [personalEvents]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(readNotificationIds));
  }, [readNotificationIds]);

  function showToast(message, type = "success") {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3500);
  }

  function logActivity(type, title, opportunityId = null, details = "") {
    const opp = opportunityId ? opportunities.find((o) => o.id === opportunityId) : null;
    const newAct = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      title,
      opportunityId,
      opportunityTitle: opp ? opp.title : "",
      details,
      timestamp: new Date().toISOString(),
    };

    setActivities((prev) => [newAct, ...prev.slice(0, 99)]);
  }

  // Check if an item already exists in tracker
  function isTracked(item) {
    if (!item) return false;
    return opportunities.some((opp) => {
      if (item.url && opp.url && item.url.trim().toLowerCase() === opp.url.trim().toLowerCase()) {
        return true;
      }
      return (
        opp.title.trim().toLowerCase() === item.title.trim().toLowerCase() &&
        opp.company.trim().toLowerCase() === item.company.trim().toLowerCase()
      );
    });
  }

  function getTrackedOpportunity(item) {
    if (!item) return null;
    return opportunities.find((opp) => {
      if (item.url && opp.url && item.url.trim().toLowerCase() === opp.url.trim().toLowerCase()) {
        return true;
      }
      return (
        opp.title.trim().toLowerCase() === item.title.trim().toLowerCase() &&
        opp.company.trim().toLowerCase() === item.company.trim().toLowerCase()
      );
    });
  }

  // Add a new or discovered opportunity to the tracker
  function addOpportunity(item) {
    if (isTracked(item)) {
      showToast(`"${item.title}" is already in your tracker!`, "info");
      return { success: false, duplicate: true };
    }

    const normalized = normalizeOpportunity({
      ...item,
      id: item.id || `opp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      status: item.status || "Saved",
      createdAt: new Date().toISOString(),
    });

    setOpportunities((prev) => [normalized, ...prev]);

    logActivity(
      "opportunity_saved",
      `Saved "${normalized.title}" to tracker`,
      normalized.id,
      `Category: ${normalized.type} • Status: ${normalized.status}`
    );

    showToast(`Added "${normalized.title}" to your tracking list.`);
    return { success: true, item: normalized };
  }

  // Update existing opportunity
  function updateOpportunity(id, updates) {
    let updatedItem = null;
    setOpportunities((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          updatedItem = {
            ...item,
            ...updates,
            color: updates.type ? getTypeColor(updates.type) : item.color,
            lastUpdated: new Date().toISOString(),
          };
          return updatedItem;
        }
        return item;
      })
    );

    if (updatedItem) {
      logActivity(
        "opportunity_updated",
        `Updated details for "${updatedItem.title}"`,
        id,
        "Opportunity record updated"
      );
      showToast(`Updated "${updatedItem.title}".`);
    }
  }

  // Delete opportunity
  function deleteOpportunity(id) {
    const target = opportunities.find((o) => o.id === id);
    if (!target) return;

    setOpportunities((prev) => prev.filter((o) => o.id !== id));
    logActivity("opportunity_deleted", `Removed "${target.title}" from tracker`, null, `Company: ${target.company}`);
    showToast(`Deleted "${target.title}".`, "info");
  }

  // Status changer with automatic activity logging and history record
  function changeStatus(id, newStatus) {
    if (!STATUS_LIST.includes(newStatus)) return;

    let targetOpp = null;
    setOpportunities((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const oldStatus = item.status;
          if (oldStatus === newStatus) return item;

          targetOpp = item;
          const nowIso = new Date().toISOString();
          const todayIso = toIsoDate(new Date());

          const historyEntry = {
            id: `hist-${Date.now()}`,
            type: "status_changed",
            fromStatus: oldStatus,
            toStatus: newStatus,
            details: `Status transitioned from ${oldStatus} to ${newStatus}`,
            timestamp: nowIso,
          };

          return {
            ...item,
            status: newStatus,
            appliedDate: newStatus === "Applied" && !item.appliedDate ? todayIso : item.appliedDate,
            history: [historyEntry, ...(item.history || [])],
            lastUpdated: nowIso,
          };
        }
        return item;
      })
    );

    if (targetOpp) {
      const actType = newStatus === "Applied" ? "application_submitted" : "status_changed";
      logActivity(
        actType,
        newStatus === "Applied"
          ? `Submitted application for "${targetOpp.title}"`
          : `Changed status of "${targetOpp.title}" to ${newStatus}`,
        id,
        `Stage: ${newStatus}`
      );
      showToast(`Status updated to "${newStatus}".`);
    }
  }

  // Add a note to an opportunity
  function addNote(id, noteText) {
    if (!noteText || !noteText.trim()) return;

    const trimmed = noteText.trim();
    let targetOpp = null;
    const newNote = {
      id: `note-${Date.now()}`,
      text: trimmed,
      createdAt: new Date().toISOString(),
    };

    setOpportunities((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          targetOpp = item;
          const historyEntry = {
            id: `hist-${Date.now()}`,
            type: "note_added",
            details: trimmed.length > 50 ? `${trimmed.substring(0, 50)}...` : trimmed,
            timestamp: newNote.createdAt,
          };
          return {
            ...item,
            notes: [newNote, ...(item.notes || [])],
            history: [historyEntry, ...(item.history || [])],
            lastUpdated: newNote.createdAt,
          };
        }
        return item;
      })
    );

    if (targetOpp) {
      logActivity(
        "note_added",
        `Added note to "${targetOpp.title}"`,
        id,
        trimmed.length > 60 ? `${trimmed.substring(0, 60)}...` : trimmed
      );
      showToast("Note added.");
    }
  }

  // Personal calendar events
  function addPersonalEvent(event) {
    const newEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: event.title.trim(),
      date: event.date,
      type: event.type || "Interview",
      opportunityId: event.opportunityId || null,
      notes: event.notes || "",
      createdAt: new Date().toISOString(),
    };

    setPersonalEvents((prev) => [...prev, newEvent]);
    logActivity("calendar_event_created", `Added calendar event: "${newEvent.title}"`, newEvent.opportunityId, `Date: ${newEvent.date}`);
    showToast(`Added event "${newEvent.title}".`);
  }

  function updatePersonalEvent(id, updates) {
    setPersonalEvents((prev) =>
      prev.map((evt) => (evt.id === id ? { ...evt, ...updates } : evt))
    );
    showToast("Event updated.");
  }

  function deletePersonalEvent(id) {
    setPersonalEvents((prev) => prev.filter((evt) => evt.id !== id));
    showToast("Event removed.", "info");
  }

  // Unified calendar entries: Merges opportunity deadlines, follow-up dates, and personal events
  const allCalendarEvents = useMemo(() => {
    const list = [];
    const seenDeadlineKeys = new Set();

    // 1. Opportunity deadlines
    opportunities.forEach((opp) => {
      if (opp.deadline) {
        const key = `deadline-${opp.id}-${opp.deadline}`;
        if (!seenDeadlineKeys.has(key)) {
          seenDeadlineKeys.add(key);
          list.push({
            id: key,
            title: `Deadline: ${opp.title}`,
            date: opp.deadline,
            type: "Deadline",
            category: opp.type,
            color: opp.color,
            opportunityId: opp.id,
            company: opp.company,
            status: opp.status,
            isDeadline: true,
          });
        }
      }

      // 2. Opportunity follow-up dates
      if (opp.followUpDate) {
        const fKey = `followup-${opp.id}-${opp.followUpDate}`;
        list.push({
          id: fKey,
          title: `Follow-up: ${opp.company}`,
          date: opp.followUpDate,
          type: "Follow-up",
          category: opp.type,
          color: "#f59e0b",
          opportunityId: opp.id,
          company: opp.company,
          status: opp.status,
          isFollowUp: true,
        });
      }
    });

    // 3. Personal events
    personalEvents.forEach((evt) => {
      const opp = evt.opportunityId ? opportunities.find((o) => o.id === evt.opportunityId) : null;
      list.push({
        id: evt.id,
        title: evt.title,
        date: evt.date,
        type: evt.type,
        category: opp ? opp.type : "General",
        color: evt.type === "Interview" ? "#8b5cf6" : evt.type === "Assessment" ? "#ec4899" : "#10b981",
        opportunityId: evt.opportunityId,
        company: opp ? opp.company : "",
        notes: evt.notes,
        isPersonal: true,
      });
    });

    return list.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  }, [opportunities, personalEvents]);

  // Dynamic notification center generation
  const notifications = useMemo(() => {
    const list = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const noticeWindowDays = settings.deadlineNoticeDays || 7;

    // Check deadlines
    opportunities.forEach((opp) => {
      if (opp.deadline && opp.status !== "Selected" && opp.status !== "Rejected" && opp.status !== "Closed") {
        const info = getDeadlineInfo(opp.deadline);

        if (info.status === "overdue") {
          list.push({
            id: `notif-overdue-${opp.id}`,
            opportunityId: opp.id,
            type: "deadline_overdue",
            title: `Deadline passed: ${opp.title}`,
            message: `The deadline for ${opp.company} (${opp.deadline}) has passed. Update status if you applied or closed it.`,
            priority: "high",
            date: opp.deadline,
            badge: "Overdue",
            timestamp: opp.deadline,
          });
        } else if (info.status === "today") {
          list.push({
            id: `notif-today-${opp.id}`,
            opportunityId: opp.id,
            type: "deadline_today",
            title: `Deadline today: ${opp.title}`,
            message: `Last day to submit for ${opp.company}. Don't miss this opportunity!`,
            priority: "high",
            date: opp.deadline,
            badge: "Due Today",
            timestamp: opp.deadline,
          });
        } else if (info.daysLeft !== null && info.daysLeft <= noticeWindowDays) {
          list.push({
            id: `notif-soon-${opp.id}`,
            opportunityId: opp.id,
            type: "deadline_soon",
            title: `Closing soon (${info.daysLeft}d): ${opp.title}`,
            message: `Deadline for ${opp.company} is on ${opp.deadline}. Review requirements and submit on time.`,
            priority: "medium",
            date: opp.deadline,
            badge: `${info.daysLeft} days left`,
            timestamp: opp.deadline,
          });
        }
      }

      // Check follow-ups
      if (settings.enableFollowUpAlerts && opp.followUpDate && opp.status === "Applied") {
        const info = getDeadlineInfo(opp.followUpDate);
        if (info.daysLeft !== null && info.daysLeft <= 0) {
          list.push({
            id: `notif-followup-${opp.id}`,
            opportunityId: opp.id,
            type: "followup_due",
            title: `Follow-up recommended: ${opp.company}`,
            message: `Scheduled follow-up date for ${opp.title} reached. Consider checking application status.`,
            priority: "medium",
            date: opp.followUpDate,
            badge: "Follow-up",
            timestamp: opp.followUpDate,
          });
        }
      }

      // Check interviews
      if (settings.enableInterviewReminders && opp.status === "Interview") {
        list.push({
          id: `notif-interview-${opp.id}`,
          opportunityId: opp.id,
          type: "interview_active",
          title: `Interview in progress: ${opp.company}`,
          message: `You are in interview stage for ${opp.title}. Review past notes and prepare questions.`,
          priority: "high",
          date: opp.deadline || opp.lastUpdated,
          badge: "Interview",
          timestamp: opp.lastUpdated,
        });
      }
    });

    // Check personal upcoming events
    personalEvents.forEach((evt) => {
      const info = getDeadlineInfo(evt.date);
      if (info.daysLeft !== null && info.daysLeft >= 0 && info.daysLeft <= 3) {
        list.push({
          id: `notif-evt-${evt.id}`,
          type: "event_soon",
          title: `Event coming up: ${evt.title}`,
          message: `${evt.type} scheduled for ${evt.date}.`,
          priority: "medium",
          date: evt.date,
          badge: info.label,
          timestamp: evt.date,
        });
      }
    });

    return list.map((item) => ({
      ...item,
      isRead: readNotificationIds.includes(item.id),
    }));
  }, [opportunities, personalEvents, settings, readNotificationIds]);

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  function markNotificationRead(id) {
    setReadNotificationIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }

  function markAllNotificationsRead() {
    const allIds = notifications.map((n) => n.id);
    setReadNotificationIds(allIds);
    showToast("All notifications marked as read.");
  }

  function updateSettingsState(newSettings) {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    showToast("Preferences saved.");
  }

  // Export actions
  function exportOpportunitiesCSV() {
    exportOpportunitiesToCsv(opportunities);
  }

  function exportActivitiesCSV() {
    exportActivitiesToCsv(activities);
  }

  function exportBackupJSON() {
    exportBackupToJson({
      version: "2.0.0",
      exportDate: new Date().toISOString(),
      opportunities,
      activities,
      personalEvents,
      settings,
    });
  }

  function importBackupJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== "object") {
        throw new Error("Invalid backup file format.");
      }

      if (Array.isArray(parsed.opportunities)) {
        setOpportunities(parsed.opportunities.map(normalizeOpportunity).filter(Boolean));
      }
      if (Array.isArray(parsed.activities)) {
        setActivities(parsed.activities);
      }
      if (Array.isArray(parsed.personalEvents)) {
        setPersonalEvents(parsed.personalEvents);
      }
      if (parsed.settings && typeof parsed.settings === "object") {
        setSettings((prev) => ({ ...prev, ...parsed.settings }));
      }

      showToast("Data backup successfully restored!");
      return { success: true };
    } catch (err) {
      alert(`Import error: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  const value = {
    opportunities,
    setOpportunities,
    activities,
    personalEvents,
    settings,
    activePage,
    setActivePage,
    toast,
    showToast,
    isTracked,
    getTrackedOpportunity,
    addOpportunity,
    updateOpportunity,
    deleteOpportunity,
    changeStatus,
    addNote,
    logActivity,
    addPersonalEvent,
    updatePersonalEvent,
    deletePersonalEvent,
    allCalendarEvents,
    notifications,
    unreadNotificationsCount,
    markNotificationRead,
    markAllNotificationsRead,
    updateSettings: updateSettingsState,
    exportOpportunitiesCSV,
    exportActivitiesCSV,
    exportBackupJSON,
    importBackupJSON,
  };

  return <OpportunityContext.Provider value={value}>{children}</OpportunityContext.Provider>;
}

/* eslint-disable-next-line react-refresh/only-export-components */
export function useOpportunity() {
  const context = useContext(OpportunityContext);
  if (!context) {
    throw new Error("useOpportunity must be used within an OpportunityProvider");
  }
  return context;
}
