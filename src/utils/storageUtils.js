// Storage & Data normalization utilities for OpportunityHub

export const STORAGE_KEYS = {
  OPPORTUNITIES: "opportunityhub-data",
  ACTIVITIES: "opportunityhub-activities",
  EVENTS: "opportunityhub-events",
  NOTIFICATIONS: "opportunityhub-notifications",
  SETTINGS: "opportunityhub-settings",
};

export const STATUS_LIST = [
  "Interested",
  "Saved",
  "Applied",
  "Shortlisted",
  "Interview",
  "Selected",
  "Rejected",
  "Closed",
];

export const TYPE_LIST = [
  "Internship",
  "Hackathon",
  "Job",
  "Scholarship",
  "Competition",
  "Fellowship",
  "Other",
];

export function getTypeColor(type) {
  switch (type) {
    case "Internship":
      return "#3b82f6"; // Blue
    case "Hackathon":
      return "#f97316"; // Orange
    case "Job":
      return "#8b5cf6"; // Purple
    case "Scholarship":
      return "#06b6d4"; // Cyan
    case "Competition":
      return "#10b981"; // Emerald
    case "Fellowship":
      return "#ec4899"; // Pink
    default:
      return "#64748b"; // Slate
  }
}

export function getStatusColor(status) {
  switch (status) {
    case "Interested":
      return { bg: "#fef3c7", text: "#92400e", border: "#fde68a" };
    case "Saved":
      return { bg: "#e0f2fe", text: "#0369a1", border: "#bae6fd" };
    case "Applied":
      return { bg: "#e0e7ff", text: "#4338ca", border: "#c7d2fe" };
    case "Shortlisted":
      return { bg: "#f3e8ff", text: "#6b21a8", border: "#e9d5ff" };
    case "Interview":
      return { bg: "#fef9c3", text: "#854d0e", border: "#fef08a" };
    case "Selected":
      return { bg: "#dcfce7", text: "#166534", border: "#bbf7d0" };
    case "Rejected":
      return { bg: "#fee2e2", text: "#991b1b", border: "#fecaca" };
    case "Closed":
      return { bg: "#f1f5f9", text: "#475569", border: "#cbd5e1" };
    default:
      return { bg: "#f1f5f9", text: "#475569", border: "#e2e8f0" };
  }
}

export const INITIAL_OPPORTUNITIES = [
  {
    id: "seed-1",
    title: "Google Summer Internship",
    company: "Google",
    type: "Internship",
    deadline: "2026-11-15",
    status: "Interested",
    color: "#3b82f6",
    url: "https://careers.google.com/students/",
    location: "Bangalore / Hyderabad / Remote",
    source: "Google Careers",
    appliedDate: "",
    followUpDate: "2026-10-30",
    notes: [
      { id: "n1", text: "Resume tailored with Distributed Systems and React projects.", createdAt: "2026-10-20T10:00:00.000Z" }
    ],
    history: [
      { id: "h1", type: "created", details: "Saved to tracker as Interested", timestamp: "2026-10-20T10:00:00.000Z" }
    ],
    createdAt: "2026-10-20T10:00:00.000Z",
  },
  {
    id: "seed-2",
    title: "Smart India Hackathon",
    company: "Smart India Hackathon",
    type: "Hackathon",
    deadline: "2026-10-28",
    status: "Saved",
    color: "#f97316",
    url: "https://www.sih.gov.in/",
    location: "India / Hybrid",
    source: "AICTE / MoE",
    appliedDate: "",
    followUpDate: "",
    notes: [
      { id: "n2", text: "Team formation meeting on Sunday evening.", createdAt: "2026-10-21T14:30:00.000Z" }
    ],
    history: [
      { id: "h2", type: "created", details: "Added hackathon to tracker", timestamp: "2026-10-21T14:30:00.000Z" }
    ],
    createdAt: "2026-10-21T14:30:00.000Z",
  },
  {
    id: "seed-3",
    title: "Microsoft AI Internship",
    company: "Microsoft",
    type: "Internship",
    deadline: "2026-11-28",
    status: "Applied",
    color: "#3b82f6",
    url: "https://careers.microsoft.com/students",
    location: "Hyderabad / Noida",
    source: "Microsoft Careers",
    appliedDate: "2026-10-21",
    followUpDate: "2026-11-05",
    notes: [
      { id: "n3", text: "Submitted application via referral portal. Awaiting screening response.", createdAt: "2026-10-21T16:00:00.000Z" }
    ],
    history: [
      { id: "h3", type: "status_changed", fromStatus: "Saved", toStatus: "Applied", details: "Application submitted", timestamp: "2026-10-21T16:00:00.000Z" }
    ],
    createdAt: "2026-10-18T09:00:00.000Z",
  },
];

export function normalizeOpportunity(rawItem) {
  if (!rawItem) return null;

  let notes = [];
  if (Array.isArray(rawItem.notes)) {
    notes = rawItem.notes.map((n, idx) => (typeof n === "string" ? { id: `note-${idx}`, text: n, createdAt: new Date().toISOString() } : n));
  } else if (typeof rawItem.notes === "string" && rawItem.notes.trim()) {
    notes = [{ id: "note-init", text: rawItem.notes.trim(), createdAt: new Date().toISOString() }];
  }

  let history = Array.isArray(rawItem.history) ? rawItem.history : [];
  if (history.length === 0) {
    history = [
      {
        id: `hist-init-${rawItem.id || Math.random()}`,
        type: "created",
        details: `Saved opportunity as ${rawItem.status || "Saved"}`,
        timestamp: rawItem.createdAt || new Date().toISOString(),
      },
    ];
  }

  return {
    id: rawItem.id ? String(rawItem.id) : `opp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title: String(rawItem.title || "Untitled Opportunity").trim(),
    company: String(rawItem.company || "Unknown Company").trim(),
    type: TYPE_LIST.includes(rawItem.type) ? rawItem.type : "Internship",
    deadline: rawItem.deadline ? String(rawItem.deadline).split("T")[0] : "",
    status: STATUS_LIST.includes(rawItem.status) ? rawItem.status : "Saved",
    color: rawItem.color || getTypeColor(rawItem.type || "Internship"),
    url: String(rawItem.url || "").trim(),
    location: String(rawItem.location || "").trim(),
    source: String(rawItem.source || "").trim(),
    eligibility: String(rawItem.eligibility || "").trim(),
    salary: String(rawItem.salary || rawItem.stipend || "").trim(),
    appliedDate: rawItem.appliedDate ? String(rawItem.appliedDate).split("T")[0] : "",
    followUpDate: rawItem.followUpDate ? String(rawItem.followUpDate).split("T")[0] : "",
    notes,
    history,
    createdAt: rawItem.createdAt || new Date().toISOString(),
    lastUpdated: rawItem.lastUpdated || rawItem.createdAt || new Date().toISOString(),
  };
}

export function loadOpportunities() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.OPPORTUNITIES);
    if (!raw) return INITIAL_OPPORTUNITIES;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return INITIAL_OPPORTUNITIES;
    return parsed.map(normalizeOpportunity).filter(Boolean);
  } catch (err) {
    console.error("Failed to load opportunities from localStorage:", err);
    return INITIAL_OPPORTUNITIES;
  }
}

export function loadActivities() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
    if (!raw) {
      return [
        {
          id: "act-init-1",
          type: "application_submitted",
          title: "Submitted application for Microsoft AI Internship",
          opportunityId: "seed-3",
          opportunityTitle: "Microsoft AI Internship",
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          details: "Status changed to Applied",
        },
        {
          id: "act-init-2",
          type: "note_added",
          title: "Added note on Smart India Hackathon",
          opportunityId: "seed-2",
          opportunityTitle: "Smart India Hackathon",
          timestamp: new Date(Date.now() - 172800000).toISOString(),
          details: "Team formation meeting on Sunday evening.",
        },
        {
          id: "act-init-3",
          type: "opportunity_saved",
          title: "Tracked Google Summer Internship",
          opportunityId: "seed-1",
          opportunityTitle: "Google Summer Internship",
          timestamp: new Date(Date.now() - 259200000).toISOString(),
          details: "Marked as Interested",
        },
      ];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Failed to load activities:", err);
    return [];
  }
}

export function loadCalendarEvents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EVENTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Failed to load calendar events:", err);
    return [];
  }
}

export function loadSettings() {
  const defaultSettings = {
    studentName: "Student",
    university: "",
    targetRoles: "Software Engineer, Full Stack, AI/ML Intern",
    graduationYear: "2027",
    deadlineNoticeDays: 7,
    enableFollowUpAlerts: true,
    enableInterviewReminders: true,
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return defaultSettings;
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    return defaultSettings;
  }
}
