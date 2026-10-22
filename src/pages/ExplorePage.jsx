import React, { useEffect, useState } from "react";
import { useOpportunity } from "../context/OpportunityContext.jsx";
import { formatDate, getDeadlineInfo } from "../utils/dateUtils.js";
import { getTypeColor } from "../utils/storageUtils.js";

export default function ExplorePage({ onOpenDetailModal }) {
  const {
    isTracked,
    getTrackedOpportunity,
    addOpportunity,
  } = useOpportunity();

  const [discoveredOpportunities, setDiscoveredOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sources, setSources] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [deadlineFilter, setDeadlineFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    "All",
    "Internship",
    "Hackathon",
    "Job",
    "Scholarship",
    "Competition",
  ];

  async function fetchOpportunities(type = "all") {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/opportunities?type=${type.toLowerCase()}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch live opportunities.");
      }
      setDiscoveredOpportunities(data.opportunities || []);
      setSources(data.sources || []);
    } catch (err) {
      console.error("Discovery error:", err);
      setError(err.message || "Failed to connect to the opportunity discovery service.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOpportunities("all");
  }, []);

  // Filter logic
  const filteredList = discoveredOpportunities.filter((item) => {
    // Category match
    const matchesCategory =
      selectedCategory === "All" ||
      item.type.toLowerCase() === selectedCategory.toLowerCase();

    // Search match
    const q = searchQuery.toLowerCase().trim();
    let matchesSearch = true;
    if (q) {
      matchesSearch =
        item.title.toLowerCase().includes(q) ||
        item.company.toLowerCase().includes(q) ||
        (item.location && item.location.toLowerCase().includes(q)) ||
        (item.source && item.source.toLowerCase().includes(q)) ||
        (Array.isArray(item.tags) && item.tags.some((t) => t.toLowerCase().includes(q)));
    }

    // Deadline filter
    let matchesDeadline = true;
    if (deadlineFilter !== "all") {
      const info = getDeadlineInfo(item.deadline);
      if (deadlineFilter === "closing_soon") {
        matchesDeadline = info.status === "soon" || info.status === "today";
      } else if (deadlineFilter === "has_deadline") {
        matchesDeadline = !!item.deadline;
      }
    }

    return matchesCategory && matchesSearch && matchesDeadline;
  });

  function handleSave(item) {
    addOpportunity({
      id: item.id || `opp-live-${item.title}-${item.company}`.toLowerCase().replace(/[^a-z0-9]/g, "-"),
      title: item.title,
      company: item.company,
      type: item.type || "Internship",
      deadline: item.deadline || "",
      url: item.url || "",
      location: item.location || "",
      source: item.source || "Discovered",
      eligibility: item.eligibility || "",
      salary: item.salary || item.stipend || "",
      status: "Saved",
    });
  }

  return (
    <div className="page-container">
      {/* Search & Category Filter Bar */}
      <div className="filter-bar">
        <div className="filter-tabs">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`filter-tab ${selectedCategory === cat ? "active" : ""}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <select
            className="form-select"
            style={{ width: "auto", padding: "8px 12px", fontSize: "13px" }}
            value={deadlineFilter}
            onChange={(e) => setDeadlineFilter(e.target.value)}
          >
            <option value="all">All Deadlines</option>
            <option value="closing_soon">Closing Soon (≤ 7 days)</option>
            <option value="has_deadline">With Deadlines Only</option>
          </select>

          <div className="search-input-wrapper">
            <span className="search-input-icon">🔍</span>
            <input
              type="text"
              placeholder="Search title, company, skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => fetchOpportunities(selectedCategory)}
            disabled={loading}
            title="Refresh verified opportunities"
          >
            {loading ? "Refreshing..." : "🔄 Refresh"}
          </button>
        </div>
      </div>

      {/* Sources & Status Indicator */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
          marginBottom: "20px",
          padding: "10px 16px",
          background: "#ffffff",
          borderRadius: "10px",
          border: "1px solid #e2e8f0",
          fontSize: "12px",
          color: "#475569",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#10b981",
              display: "inline-block",
            }}
          />
          <strong>Live Verified Portals:</strong>
          <span>
            {sources.length > 0
              ? sources.map((s) => (typeof s === "string" ? s : s.name)).join(", ")
              : "Unstop, Devpost, Official Campus Portals"}
          </span>
        </div>

        <div>
          Showing <strong>{filteredList.length}</strong> real opportunity records
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="empty-state" style={{ padding: "60px 20px" }}>
          <div style={{ fontSize: "36px", marginBottom: "12px" }}>🔄</div>
          <div className="empty-state-title">Retrieving live student opportunities...</div>
          <p className="empty-state-text">
            Connecting directly to Unstop, Devpost, and student scholarship feeds...
          </p>
        </div>
      )}

      {error && !loading && (
        <div
          role="alert"
          style={{
            background: "#fee2e2",
            border: "1px solid #fecaca",
            borderRadius: "12px",
            padding: "16px 20px",
            color: "#991b1b",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <strong>Service Notice: </strong> {error}
          </div>
          <button
            type="button"
            className="btn-secondary"
            style={{ background: "#ffffff" }}
            onClick={() => fetchOpportunities(selectedCategory)}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Opportunity Cards Grid */}
      {!loading && !error && (
        <>
          {filteredList.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: "18px",
              }}
            >
              {filteredList.map((item, index) => {
                const tracked = isTracked(item);
                const trackedOpp = tracked ? getTrackedOpportunity(item) : null;
                const deadlineInfo = getDeadlineInfo(item.deadline);
                const typeColor = getTypeColor(item.type);

                return (
                  <div key={item.id || `disc-${index}`} className="opportunity-card">
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

                        {item.source && (
                          <span
                            style={{
                              fontSize: "11px",
                              color: "#64748b",
                              background: "#f1f5f9",
                              padding: "2px 8px",
                              borderRadius: "6px",
                              fontWeight: 500,
                            }}
                          >
                            {item.source}
                          </span>
                        )}
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
                          <span>📅 Deadline: {formatDate(item.deadline)}</span>
                        </div>

                        {item.deadline && (
                          <span className={`badge badge-${deadlineInfo.className}`}>
                            {deadlineInfo.label}
                          </span>
                        )}

                        {item.stipend && (
                          <div className="card-meta-item" style={{ color: "#047857", fontWeight: 600 }}>
                            <span>💰 {item.stipend}</span>
                          </div>
                        )}
                      </div>

                      {item.eligibility && (
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#475569",
                            background: "#f8fafc",
                            padding: "8px 10px",
                            borderRadius: "6px",
                            marginBottom: "14px",
                            border: "1px solid #edf2f7",
                          }}
                        >
                          <strong>Eligibility:</strong> {item.eligibility}
                        </div>
                      )}
                    </div>

                    <div className="card-footer">
                      {item.url ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-secondary"
                          style={{ fontSize: "12px", padding: "6px 12px" }}
                        >
                          Official Portal ↗
                        </a>
                      ) : (
                        <span style={{ fontSize: "12px", color: "#94a3b8" }}>No URL provided</span>
                      )}

                      {tracked ? (
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{
                            borderColor: "#86efac",
                            background: "#f0fdf4",
                            color: "#166534",
                            fontSize: "12px",
                            padding: "6px 12px",
                            fontWeight: 600,
                          }}
                          onClick={() => {
                            if (trackedOpp) onOpenDetailModal(trackedOpp.id);
                          }}
                          title="Click to view and edit in your tracker"
                        >
                          ✓ Tracked ({trackedOpp?.status || "Saved"})
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn-primary"
                          style={{ fontSize: "12px", padding: "6px 14px" }}
                          onClick={() => handleSave(item)}
                        >
                          + Track Role
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <div className="empty-state-title">No matching opportunities found</div>
              <p className="empty-state-text">
                Try clearing search terms or selecting "All" to browse all opportunities.
              </p>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setSelectedCategory("All");
                  setSearchQuery("");
                  setDeadlineFilter("all");
                }}
              >
                Clear Filters
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
