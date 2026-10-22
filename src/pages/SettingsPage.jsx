import React, { useRef, useState } from "react";
import { useOpportunity } from "../context/OpportunityContext.jsx";

export default function SettingsPage() {
  const {
    settings,
    updateSettings,
    exportOpportunitiesCSV,
    exportActivitiesCSV,
    exportBackupJSON,
    importBackupJSON,
    opportunities,
    activities,
  } = useOpportunity();

  const [formData, setFormData] = useState({
    studentName: settings.studentName || "Student",
    university: settings.university || "",
    targetRoles: settings.targetRoles || "Software Engineer Intern, Full Stack Developer",
    graduationYear: settings.graduationYear || "2027",
    deadlineNoticeDays: settings.deadlineNoticeDays || 7,
    enableFollowUpAlerts: settings.enableFollowUpAlerts !== false,
    enableInterviewReminders: settings.enableInterviewReminders !== false,
  });

  const fileInputRef = useRef(null);

  function handleSaveProfile(e) {
    e.preventDefault();
    updateSettings(formData);
  }

  function handleFileImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === "string") {
        importBackupJSON(content);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div className="page-container" style={{ maxWidth: "900px" }}>
      {/* Profile Preferences */}
      <div className="content-box" style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>
          👤 Student Profile & Goals
        </h2>
        <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "18px" }}>
          Personalize your dashboard and AI assistant context
        </p>

        <form onSubmit={handleSaveProfile}>
          <div className="form-row" style={{ marginBottom: "14px" }}>
            <div className="form-group">
              <label className="form-label">Your Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Nameera Sadaf"
                value={formData.studentName}
                onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">University / College</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Osmania University / IIT Hyderabad"
                value={formData.university}
                onChange={(e) => setFormData({ ...formData, university: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row" style={{ marginBottom: "18px" }}>
            <div className="form-group">
              <label className="form-label">Target Roles & Interests</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Frontend Intern, Data Science, Backend"
                value={formData.targetRoles}
                onChange={(e) => setFormData({ ...formData, targetRoles: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Expected Graduation Year</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 2026 or 2027"
                value={formData.graduationYear}
                onChange={(e) => setFormData({ ...formData, graduationYear: e.target.value })}
              />
            </div>
          </div>

          <button type="submit" className="btn-primary">
            Save Profile Preferences
          </button>
        </form>
      </div>

      {/* Reminder & Notification Preferences */}
      <div className="content-box" style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>
          🔔 Reminder Preferences
        </h2>
        <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "18px" }}>
          Configure deadline alert triggers and follow-up notices
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="form-group">
            <label className="form-label">Notice Window for Upcoming Deadlines</label>
            <select
              className="form-select"
              value={formData.deadlineNoticeDays}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setFormData({ ...formData, deadlineNoticeDays: val });
                updateSettings({ deadlineNoticeDays: val });
              }}
            >
              <option value={3}>3 days before deadline</option>
              <option value={7}>7 days before deadline (Recommended)</option>
              <option value={14}>14 days before deadline</option>
            </select>
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "13px", color: "#334155" }}>
            <input
              type="checkbox"
              checked={formData.enableFollowUpAlerts}
              onChange={(e) => {
                const val = e.target.checked;
                setFormData({ ...formData, enableFollowUpAlerts: val });
                updateSettings({ enableFollowUpAlerts: val });
              }}
            />
            <strong>Enable follow-up reminders when scheduled dates are reached</strong>
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "13px", color: "#334155" }}>
            <input
              type="checkbox"
              checked={formData.enableInterviewReminders}
              onChange={(e) => {
                const val = e.target.checked;
                setFormData({ ...formData, enableInterviewReminders: val });
                updateSettings({ enableInterviewReminders: val });
              }}
            />
            <strong>Show active reminders for opportunities in Interview stage</strong>
          </label>
        </div>
      </div>

      {/* Data Export & Backup Section */}
      <div className="content-box" style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>
          💾 Data Export & Backups
        </h2>
        <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "18px" }}>
          Download your tracked opportunities, activity records, or import a JSON backup
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={exportOpportunitiesCSV}
            title="Download CSV spreadsheet of all tracked roles"
          >
            📊 Export Tracked Roles (CSV)
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={exportActivitiesCSV}
            title="Download CSV audit log of all activities"
          >
            📋 Export Activity Log (CSV)
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={exportBackupJSON}
            title="Export complete application data backup as JSON"
          >
            📦 Download JSON Backup
          </button>

          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            accept=".json,application/json"
            onChange={handleFileImport}
          />

          <button
            type="button"
            className="btn-secondary"
            onClick={() => fileInputRef.current?.click()}
            title="Restore opportunities from a previously saved JSON backup"
          >
            📥 Restore from Backup (JSON)
          </button>
        </div>

        <div style={{ fontSize: "12px", color: "#64748b", background: "#f8fafc", padding: "10px 14px", borderRadius: "8px" }}>
          Current storage status: <strong>{opportunities.length}</strong> opportunities • <strong>{activities.length}</strong> activity logs
        </div>
      </div>

      {/* Browser Local Storage Limitations Notice */}
      <div
        style={{
          background: "#fffbeb",
          border: "1px solid #fef3c7",
          borderRadius: "14px",
          padding: "18px 20px",
          fontSize: "13px",
          color: "#92400e",
          lineHeight: 1.6,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
          <span style={{ fontSize: "20px" }}>⚠️</span>
          <div>
            <strong style={{ display: "block", marginBottom: "4px", color: "#78350f" }}>
              Understanding Browser Local Storage & Multi-Device Synchronisation
            </strong>
            <p style={{ margin: "0 0 8px" }}>
              OpportunityHub saves your data securely inside your current browser's <code>localStorage</code>.
              Your data remains available across refreshes and page navigation.
            </p>
            <p style={{ margin: 0 }}>
              However, <code>localStorage</code> is isolated to this specific device and browser profile.
              If you switch laptops or phones, or clear your browsing data, cross-device synchronisation requires exporting your JSON backup or connecting a persistent cloud database (e.g. Supabase or Firebase) with user authentication.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
