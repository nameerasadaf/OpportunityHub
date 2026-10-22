import React, { useEffect, useState } from "react";
import { useOpportunity } from "../../context/OpportunityContext.jsx";
import { toIsoDate } from "../../utils/dateUtils.js";

export default function EventModal({
  isOpen,
  onClose,
  initialDate = "",
  editingEvent = null,
}) {
  const {
    opportunities,
    addPersonalEvent,
    updatePersonalEvent,
    deletePersonalEvent,
  } = useOpportunity();

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState("Interview");
  const [opportunityId, setOpportunityId] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (editingEvent) {
      setTitle(editingEvent.title || "");
      setDate(editingEvent.date || "");
      setType(editingEvent.type || "Interview");
      setOpportunityId(editingEvent.opportunityId || "");
      setNotes(editingEvent.notes || "");
    } else {
      setTitle("");
      setDate(initialDate || toIsoDate(new Date()));
      setType("Interview");
      setOpportunityId("");
      setNotes("");
    }
  }, [editingEvent, initialDate, isOpen]);

  if (!isOpen) return null;

  function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !date) {
      alert("Please provide an event title and date.");
      return;
    }

    if (editingEvent) {
      updatePersonalEvent(editingEvent.id, {
        title: title.trim(),
        date,
        type,
        opportunityId: opportunityId || null,
        notes: notes.trim(),
      });
    } else {
      addPersonalEvent({
        title: title.trim(),
        date,
        type,
        opportunityId: opportunityId || null,
        notes: notes.trim(),
      });
    }

    onClose();
  }

  function handleDelete() {
    if (editingEvent && window.confirm("Are you sure you want to delete this event?")) {
      deletePersonalEvent(editingEvent.id);
      onClose();
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {editingEvent ? "Edit Calendar Event" : "Add Calendar Event"}
          </h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Event Title *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Technical Interview Round 1, Coding Assessment, SIH Team Sync"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Event Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Event Category</label>
                <select
                  className="form-select"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="Interview">Interview</option>
                  <option value="Assessment">Online Assessment (OA)</option>
                  <option value="Deadline">Personal Deadline</option>
                  <option value="Follow-up">Follow-up Reminder</option>
                  <option value="Meeting">Team / Mentor Meeting</option>
                  <option value="Other">Other Event</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Link to Tracked Opportunity (optional)</label>
              <select
                className="form-select"
                value={opportunityId}
                onChange={(e) => setOpportunityId(e.target.value)}
              >
                <option value="">-- No specific opportunity --</option>
                {opportunities.map((opp) => (
                  <option key={opp.id} value={opp.id}>
                    {opp.title} ({opp.company})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Notes / Video Call Link (optional)</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Google Meet / Zoom link, topics to revise, preparation instructions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer" style={{ justifyContent: editingEvent ? "space-between" : "flex-end" }}>
            {editingEvent && (
              <button
                type="button"
                style={{ color: "#dc2626", fontWeight: 600, fontSize: "13px" }}
                onClick={handleDelete}
              >
                Delete Event
              </button>
            )}

            <div style={{ display: "flex", gap: "8px" }}>
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                {editingEvent ? "Save Changes" : "Create Event"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
