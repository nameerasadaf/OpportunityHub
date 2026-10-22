import React, { useEffect, useState } from "react";
import { useOpportunity } from "../../context/OpportunityContext.jsx";
import { STATUS_LIST, TYPE_LIST } from "../../utils/storageUtils.js";

export default function AddOpportunityModal({ isOpen, onClose, editingOpportunity = null }) {
  const { addOpportunity, updateOpportunity } = useOpportunity();

  const [formData, setFormData] = useState({
    title: "",
    company: "",
    type: "Internship",
    status: "Saved",
    deadline: "",
    appliedDate: "",
    followUpDate: "",
    location: "",
    url: "",
    source: "",
    initialNote: "",
  });

  useEffect(() => {
    if (editingOpportunity) {
      setFormData({
        title: editingOpportunity.title || "",
        company: editingOpportunity.company || "",
        type: editingOpportunity.type || "Internship",
        status: editingOpportunity.status || "Saved",
        deadline: editingOpportunity.deadline || "",
        appliedDate: editingOpportunity.appliedDate || "",
        followUpDate: editingOpportunity.followUpDate || "",
        location: editingOpportunity.location || "",
        url: editingOpportunity.url || "",
        source: editingOpportunity.source || "",
        initialNote: "",
      });
    } else {
      setFormData({
        title: "",
        company: "",
        type: "Internship",
        status: "Saved",
        deadline: "",
        appliedDate: "",
        followUpDate: "",
        location: "",
        url: "",
        source: "Manual Entry",
        initialNote: "",
      });
    }
  }, [editingOpportunity, isOpen]);

  if (!isOpen) return null;

  function handleSubmit(e) {
    e.preventDefault();

    if (!formData.title.trim() || !formData.company.trim()) {
      alert("Please provide both Opportunity Title and Company/Organization.");
      return;
    }

    if (editingOpportunity) {
      updateOpportunity(editingOpportunity.id, {
        title: formData.title.trim(),
        company: formData.company.trim(),
        type: formData.type,
        status: formData.status,
        deadline: formData.deadline,
        appliedDate: formData.appliedDate,
        followUpDate: formData.followUpDate,
        location: formData.location.trim(),
        url: formData.url.trim(),
        source: formData.source.trim(),
      });
    } else {
      addOpportunity({
        title: formData.title.trim(),
        company: formData.company.trim(),
        type: formData.type,
        status: formData.status,
        deadline: formData.deadline,
        appliedDate: formData.appliedDate,
        followUpDate: formData.followUpDate,
        location: formData.location.trim(),
        url: formData.url.trim(),
        source: formData.source.trim() || "Manual",
        notes: formData.initialNote.trim() ? [formData.initialNote.trim()] : [],
      });
    }

    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {editingOpportunity ? "Edit Opportunity" : "Track New Opportunity"}
          </h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Opportunity Title *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Software Engineering Intern"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Company / Organization *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Microsoft, Google, ISRO"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Opportunity Type</label>
                <select
                  className="form-select"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  {TYPE_LIST.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Tracking Stage</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  {STATUS_LIST.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Application Deadline</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Application Date (if submitted)</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.appliedDate}
                  onChange={(e) => setFormData({ ...formData, appliedDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Follow-up Reminder Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.followUpDate}
                  onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Location / Mode</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Hyderabad / Remote / Hybrid"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Opportunity / Job URL</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://careers..."
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                />
              </div>
            </div>

            {!editingOpportunity && (
              <div className="form-group">
                <label className="form-label">Initial Note (optional)</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="e.g. Tailored resume submitted via referral."
                  value={formData.initialNote}
                  onChange={(e) => setFormData({ ...formData, initialNote: e.target.value })}
                />
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editingOpportunity ? "Save Changes" : "Track Opportunity"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
