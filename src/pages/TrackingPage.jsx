import React, { useState } from "react";
import { useOpportunity } from "../context/OpportunityContext.jsx";
import { formatDate, getDeadlineInfo } from "../utils/dateUtils.js";
import { STATUS_LIST, getStatusColor, getTypeColor } from "../utils/storageUtils.js";

export default function TrackingPage({
  onOpenAddModal,
  onOpenDetailModal,
  onEditOpportunity,
}) {
  const {
    opportunities,
    changeStatus,
    deleteOpportunity,
  } = useOpportunity();

  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("deadline");

  const tabs = ["All", ...STATUS_LIST];

  // Filtering
  const filtered = opportunities.filter((item) => {
    const matchesTab = activeTab === "All" || item.status === activeTab;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.company.toLowerCase().includes(q) ||
      (item.location && item.location.toLowerCase().includes(q)) ||
      item.type.toLowerCase().includes(q);

    return matchesTab && matchesQuery;
  });

  // Sorting
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "deadline") {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return a.deadline.localeCompare(b.deadline);
    }
    if (sortBy === "company") {
      return a.company.localeCompare(b.company);
    }
    if (sortBy === "recent") {
      return (b.lastUpdated || b.createdAt || "").localeCompare(a.lastUpdated || a.createdAt || "");
    }
    return 0;
  });

  return (
    <div className="page-container">
      {/* Top Filter Bar */}
      <div className="filter-bar">
        <div className="filter-tabs">
          {tabs.map((tab) => {
            const count =
              tab === "All"
                ? opportunities.length
                : opportunities.filter((o) => o.status === tab).length;

            return (
              <button
                key={tab}
                type="button"
                className={`filter-tab ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab} <span style={{ opacity: 0.8, fontSize: "11px" }}>({count})</span>
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <select
            className="form-select"
            style={{ width: "auto", padding: "8px 12px", fontSize: "13px" }}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="deadline">Sort: Deadline (Earliest)</option>
            <option value="recent">Sort: Recently Updated</option>
            <option value="company">Sort: Company Name</option>
          </select>

          <div className="search-input-wrapper">
            <span className="search-input-icon">🔍</span>
            <input
              type="text"
              placeholder="Search in your tracker..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button
            type="button"
            className="btn-primary"
            onClick={onOpenAddModal}
          >
            + Add New
          </button>
        </div>
      </div>

      {/* Grid of Tracked Cards */}
      {sorted.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))",
            gap: "18px",
          }}
        >
          {sorted.map((item) => {
            const deadlineInfo = getDeadlineInfo(item.deadline);
            const typeColor = getTypeColor(item.type);
            const statusStyle = getStatusColor(item.status);

            return (
              <div
                key={item.id}
                className="opportunity-card"
                onClick={() => onOpenDetailModal(item.id)}
                style={{ cursor: "pointer" }}
              >
                <div>
                  <div className="card-top">
                    <span
                      className="pill-type"
                      style={{
                        background: `${typeColor}15`,
                        color: typeColor,
                        border: `1px solid ${typeColor}30`,
                      }}
                    >
                      {item.type}
                    </span>

                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: "700",
                        padding: "3px 8px",
                        borderRadius: "999px",
                        background: statusStyle.bg,
                        color: statusStyle.text,
                        border: `1px solid ${statusStyle.border}`,
                      }}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="card-title-group">
                    <h3 className="card-title">{item.title}</h3>
                    <div className="card-company">
                      <span>🏢 {item.company}</span>
                      {item.location && <span>• 📍 {item.location}</span>}
                    </div>
                  </div>

                  <div className="card-meta-row">
                    <div className="card-meta-item">
                      <span>📅 {formatDate(item.deadline)}</span>
                    </div>

                    {item.deadline && (
                      <span className={`badge badge-${deadlineInfo.className}`}>
                        {deadlineInfo.label}
                      </span>
                    )}

                    {item.appliedDate && (
                      <div className="card-meta-item" style={{ color: "#4f46e5", fontWeight: 600 }}>
                        <span>Applied: {formatDate(item.appliedDate)}</span>
                      </div>
                    )}
                  </div>

                  {item.notes && item.notes.length > 0 && (
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#475569",
                        background: "#f8fafc",
                        padding: "8px 10px",
                        borderRadius: "6px",
                        marginBottom: "10px",
                        border: "1px solid #edf2f7",
                      }}
                    >
                      <strong>Latest note:</strong> {item.notes[0].text}
                    </div>
                  )}
                </div>

                <div
                  className="card-footer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <select
                    className="status-select"
                    value={item.status}
                    onChange={(e) => changeStatus(item.id, e.target.value)}
                    title="Change pipeline stage"
                  >
                    {STATUS_LIST.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>

                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ padding: "6px 10px", fontSize: "12px" }}
                      onClick={() => onEditOpportunity(item)}
                      title="Edit opportunity details"
                    >
                      ✏️ Edit
                    </button>

                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ padding: "6px 8px", fontSize: "12px", color: "#dc2626" }}
                      onClick={() => {
                        if (window.confirm(`Delete "${item.title}"?`)) {
                          deleteOpportunity(item.id);
                        }
                      }}
                      title="Delete opportunity"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-title">
            {activeTab === "All" ? "No tracked opportunities yet" : `No opportunities in "${activeTab}"`}
          </div>
          <p className="empty-state-text">
            {activeTab === "All"
              ? "Start tracking student roles to manage application deadlines, stage progression, and interviews."
              : `You don't have any applications marked as ${activeTab}. Explore opportunities or change stage of existing items.`}
          </p>
          <button type="button" className="btn-primary" onClick={onOpenAddModal}>
            + Add New Opportunity
          </button>
        </div>
      )}
    </div>
  );
}
