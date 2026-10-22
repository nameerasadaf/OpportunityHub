import React, { useState } from "react";
import { useOpportunity } from "../../context/OpportunityContext.jsx";
import { formatDate, formatTimeAgo, getDeadlineInfo } from "../../utils/dateUtils.js";
import { STATUS_LIST, getStatusColor, getTypeColor } from "../../utils/storageUtils.js";

export default function OpportunityDetailModal({
  opportunityId,
  isOpen,
  onClose,
  onEdit,
}) {
  const {
    opportunities,
    changeStatus,
    addNote,
    deleteOpportunity,
  } = useOpportunity();

  const [newNoteText, setNewNoteText] = useState("");

  if (!isOpen || !opportunityId) return null;

  const opp = opportunities.find((o) => o.id === opportunityId);
  if (!opp) return null;

  const deadlineInfo = getDeadlineInfo(opp.deadline);
  const statusStyle = getStatusColor(opp.status);
  const typeColor = getTypeColor(opp.type);

  function handleAddNote(e) {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    addNote(opp.id, newNoteText.trim());
    setNewNoteText("");
  }

  function handleDelete() {
    if (window.confirm(`Are you sure you want to delete "${opp.title}" from your tracking?`)) {
      deleteOpportunity(opp.id);
      onClose();
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card" style={{ maxWidth: "700px" }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header" style={{ alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span
                className="pill-type"
                style={{
                  background: `${typeColor}15`,
                  color: typeColor,
                  border: `1px solid ${typeColor}30`,
                }}
              >
                {opp.type}
              </span>

              <span
                style={{
                  fontSize: "12px",
                  fontWeight: "700",
                  padding: "3px 10px",
                  borderRadius: "999px",
                  background: statusStyle.bg,
                  color: statusStyle.text,
                  border: `1px solid ${statusStyle.border}`,
                }}
              >
                {opp.status}
              </span>
            </div>

            <h2 className="modal-title" style={{ fontSize: "20px" }}>
              {opp.title}
            </h2>
            <p style={{ color: "#475569", fontWeight: 600, fontSize: "14px", marginTop: "2px" }}>
              🏢 {opp.company}
              {opp.location && <span> • 📍 {opp.location}</span>}
            </p>
          </div>

          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ gap: "20px" }}>
          {/* Key Dates Bar */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "12px",
              background: "#f8fafc",
              padding: "14px",
              borderRadius: "10px",
              border: "1px solid #e2e8f0",
            }}
          >
            <div>
              <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, display: "block" }}>
                APPLICATION DEADLINE
              </span>
              <strong style={{ fontSize: "13px", color: "#0f172a" }}>
                {formatDate(opp.deadline)}
              </strong>
              {opp.deadline && (
                <div style={{ marginTop: "3px" }}>
                  <span className={`badge badge-${deadlineInfo.className}`}>
                    {deadlineInfo.label}
                  </span>
                </div>
              )}
            </div>

            <div>
              <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, display: "block" }}>
                APPLIED ON
              </span>
              <strong style={{ fontSize: "13px", color: "#0f172a" }}>
                {opp.appliedDate ? formatDate(opp.appliedDate) : "Not yet submitted"}
              </strong>
            </div>

            <div>
              <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, display: "block" }}>
                NEXT FOLLOW-UP
              </span>
              <strong style={{ fontSize: "13px", color: "#0f172a" }}>
                {opp.followUpDate ? formatDate(opp.followUpDate) : "None scheduled"}
              </strong>
            </div>

            <div>
              <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, display: "block" }}>
                STAGE / STATUS
              </span>
              <select
                className="status-select"
                style={{ marginTop: "4px", width: "100%" }}
                value={opp.status}
                onChange={(e) => changeStatus(opp.id, e.target.value)}
              >
                {STATUS_LIST.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick links & source info */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
            {opp.url && (
              <a
                href={opp.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
                style={{ fontSize: "12px", padding: "6px 12px" }}
              >
                🔗 Open Official Link ↗
              </a>
            )}

            {opp.source && (
              <span style={{ fontSize: "12px", color: "#64748b", background: "#f1f5f9", padding: "6px 10px", borderRadius: "6px" }}>
                Source: <strong>{opp.source}</strong>
              </span>
            )}

            {opp.salary && (
              <span style={{ fontSize: "12px", color: "#047857", background: "#ecfdf5", padding: "6px 10px", borderRadius: "6px", fontWeight: 600 }}>
                💰 {opp.salary}
              </span>
            )}
          </div>

          {/* Notes Section */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b", margin: 0 }}>
                📝 Notes & Journal ({opp.notes?.length || 0})
              </h3>
            </div>

            <form onSubmit={handleAddNote} style={{ marginBottom: "14px" }}>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Add a preparation note, interview detail, or question..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                />
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flexShrink: 0, padding: "8px 16px" }}
                  disabled={!newNoteText.trim()}
                >
                  Add Note
                </button>
              </div>
            </form>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "160px", overflowY: "auto" }}>
              {opp.notes && opp.notes.length > 0 ? (
                opp.notes.map((note) => (
                  <div
                    key={note.id || note.createdAt}
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #edf2f7",
                      borderRadius: "8px",
                      padding: "10px 12px",
                    }}
                  >
                    <p style={{ margin: 0, fontSize: "13px", color: "#334155" }}>{note.text}</p>
                    <span style={{ fontSize: "11px", color: "#94a3b8", display: "block", marginTop: "4px" }}>
                      {formatTimeAgo(note.createdAt)}
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ color: "#94a3b8", fontSize: "12px", fontStyle: "italic", padding: "8px 0" }}>
                  No notes recorded yet. Add your resume tailoring tips or follow-up notes above.
                </div>
              )}
            </div>
          </div>

          {/* Application History Timeline */}
          <div>
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b", marginBottom: "10px" }}>
              ⏱️ Application Activity History
            </h3>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                maxHeight: "140px",
                overflowY: "auto",
                borderLeft: "2px solid #e2e8f0",
                paddingLeft: "12px",
                marginLeft: "4px",
              }}
            >
              {opp.history && opp.history.length > 0 ? (
                opp.history.map((h) => (
                  <div key={h.id || h.timestamp} style={{ position: "relative" }}>
                    <div
                      style={{
                        position: "absolute",
                        left: "-18px",
                        top: "4px",
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "#6366f1",
                      }}
                    />
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "#1e293b" }}>
                      {h.details || (h.toStatus ? `Status: ${h.toStatus}` : "Activity logged")}
                    </div>
                    <span style={{ fontSize: "10px", color: "#94a3b8" }}>
                      {new Date(h.timestamp).toLocaleString("en-IN")}
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: "12px", color: "#94a3b8" }}>Created on {formatDate(opp.createdAt)}</div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ justifyContent: "space-between" }}>
          <button
            type="button"
            style={{ color: "#dc2626", fontSize: "13px", fontWeight: 600, padding: "8px 12px" }}
            onClick={handleDelete}
          >
            🗑️ Delete Opportunity
          </button>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                onClose();
                if (onEdit) onEdit(opp);
              }}
            >
              ✏️ Edit Details
            </button>
            <button type="button" className="btn-primary" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
