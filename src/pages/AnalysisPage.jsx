import React, { useMemo, useState } from "react";
import { useOpportunity } from "../context/OpportunityContext.jsx";
import { STATUS_LIST, TYPE_LIST, getStatusColor, getTypeColor } from "../utils/storageUtils.js";

export default function AnalysisPage() {
  const { opportunities, activities } = useOpportunity();
  const [dateRange, setDateRange] = useState("all"); // 'all', '90d', '30d', 'this_year'

  // Filter opportunities by dateRange based on createdAt / appliedDate
  const filteredOpps = useMemo(() => {
    if (dateRange === "all") return opportunities;

    const now = new Date();
    let cutoff = new Date(0);

    if (dateRange === "30d") {
      cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (dateRange === "90d") {
      cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    } else if (dateRange === "this_year") {
      cutoff = new Date(now.getFullYear(), 0, 1);
    }

    return opportunities.filter((o) => {
      const d = o.appliedDate || o.createdAt;
      if (!d) return true;
      return new Date(d) >= cutoff;
    });
  }, [opportunities, dateRange]);

  // Key metrics
  const totalTracked = filteredOpps.length;
  const appliedCount = filteredOpps.filter((o) => o.status === "Applied").length;
  const interviewCount = filteredOpps.filter((o) => o.status === "Interview").length;
  const selectedCount = filteredOpps.filter((o) => o.status === "Selected").length;
  const rejectedCount = filteredOpps.filter((o) => o.status === "Rejected").length;
  const totalSubmitted = filteredOpps.filter((o) =>
    ["Applied", "Shortlisted", "Interview", "Selected", "Rejected"].includes(o.status)
  ).length;

  // Rate calculations
  const interviewRate =
    totalSubmitted > 0
      ? Math.round(((interviewCount + selectedCount) / totalSubmitted) * 100)
      : null;

  const offerRate =
    totalSubmitted > 0 ? Math.round((selectedCount / totalSubmitted) * 100) : null;

  const responseRate =
    totalSubmitted > 0
      ? Math.round(
          ((filteredOpps.filter((o) =>
            ["Shortlisted", "Interview", "Selected", "Rejected"].includes(o.status)
          ).length) /
            totalSubmitted) *
            100
        )
      : null;

  // 1. Applications over time data (grouped by month)
  const applicationsByMonth = useMemo(() => {
    const months = {};
    const now = new Date();

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString("default", { month: "short" });
      months[key] = 0;
    }

    filteredOpps.forEach((opp) => {
      const dateStr = opp.appliedDate || opp.createdAt;
      if (dateStr) {
        const d = new Date(dateStr);
        if (!Number.isNaN(d.getTime())) {
          const key = d.toLocaleString("default", { month: "short" });
          if (months[key] !== undefined) {
            months[key] += 1;
          }
        }
      }
    });

    return Object.entries(months).map(([month, count]) => ({ month, count }));
  }, [filteredOpps]);

  // 2. Statuses distribution
  const statusDistribution = useMemo(() => {
    return STATUS_LIST.map((status) => {
      const count = filteredOpps.filter((o) => o.status === status).length;
      const percentage = totalTracked > 0 ? Math.round((count / totalTracked) * 100) : 0;
      return { status, count, percentage, style: getStatusColor(status) };
    });
  }, [filteredOpps, totalTracked]);

  // 3. Category distribution
  const categoryDistribution = useMemo(() => {
    return TYPE_LIST.map((type) => {
      const count = filteredOpps.filter((o) => o.type === type).length;
      return { type, count, color: getTypeColor(type) };
    }).filter((c) => c.count > 0 || c.type === "Internship" || c.type === "Hackathon" || c.type === "Job");
  }, [filteredOpps]);

  // 4. Weekly activity data (actions over last 7 days)
  const weeklyActivity = useMemo(() => {
    const days = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayName = d.toLocaleDateString("en-IN", { weekday: "short" });
      const dayIso = d.toISOString().split("T")[0];

      const count = activities.filter((a) => {
        if (!a.timestamp) return false;
        return a.timestamp.startsWith(dayIso);
      }).length;

      days.push({ day: dayName, date: dayIso, count });
    }

    return days;
  }, [activities]);

  const maxMonthCount = Math.max(...applicationsByMonth.map((m) => m.count), 4);
  const maxCategoryCount = Math.max(...categoryDistribution.map((c) => c.count), 4);
  const maxWeeklyCount = Math.max(...weeklyActivity.map((w) => w.count), 3);

  return (
    <div className="page-container">
      {/* Date Range Selector Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "24px",
          background: "#ffffff",
          padding: "14px 20px",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
        }}
      >
        <div>
          <h2 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "#0f172a" }}>
            Performance Metrics & Success Analytics
          </h2>
          <span style={{ fontSize: "12px", color: "#64748b" }}>
            Calculated strictly from your {totalTracked} stored opportunity records
          </span>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "#64748b" }}>Date Scope:</span>
          <select
            className="form-select"
            style={{ width: "auto", padding: "6px 12px", fontSize: "13px" }}
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="30d">Past 30 Days</option>
            <option value="90d">Past 90 Days</option>
            <option value="this_year">This Year</option>
          </select>
        </div>
      </div>

      {/* Conversion Rate Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: "28px" }}>
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Interview Rate</span>
            <div className="stat-card-icon" style={{ background: "#e0e7ff", color: "#4f46e5" }}>
              🎯
            </div>
          </div>
          <div className="stat-card-value">
            {interviewRate !== null ? `${interviewRate}%` : "—"}
          </div>
          <div className="stat-card-subtext">
            {totalSubmitted > 0
              ? `${interviewCount + selectedCount} invited out of ${totalSubmitted} submitted`
              : "Formula: (Interviews + Offers) / Submitted"}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Offer / Selection Rate</span>
            <div className="stat-card-icon" style={{ background: "#dcfce7", color: "#166534" }}>
              🏆
            </div>
          </div>
          <div className="stat-card-value">
            {offerRate !== null ? `${offerRate}%` : "—"}
          </div>
          <div className="stat-card-subtext">
            {totalSubmitted > 0
              ? `${selectedCount} offer out of ${totalSubmitted} submitted`
              : "Formula: Offers / Submitted"}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Company Response Rate</span>
            <div className="stat-card-icon" style={{ background: "#fef9c3", color: "#854d0e" }}>
              📬
            </div>
          </div>
          <div className="stat-card-value">
            {responseRate !== null ? `${responseRate}%` : "—"}
          </div>
          <div className="stat-card-subtext">
            {totalSubmitted > 0
              ? `${Math.round(totalSubmitted * (responseRate / 100))} responses received`
              : "Formula: Non-pending / Submitted"}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Awaiting Response</span>
            <div className="stat-card-icon" style={{ background: "#f1f5f9", color: "#475569" }}>
              ⏳
            </div>
          </div>
          <div className="stat-card-value">{appliedCount}</div>
          <div className="stat-card-subtext">Applications currently pending screening</div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
          gap: "24px",
          marginBottom: "28px",
        }}
      >
        {/* Chart 1: Applications Over Time (SVG Line Chart) */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">Applications Over Time</h3>
              <span className="chart-subtitle">Monthly application trajectory</span>
            </div>
          </div>

          <div className="chart-container" style={{ height: "220px" }}>
            <svg viewBox="0 0 400 180" style={{ width: "100%", height: "100%", overflow: "visible" }}>
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="30" y1="30" x2="380" y2="30" stroke="#f1f5f9" strokeDasharray="3 3" />
              <line x1="30" y1="80" x2="380" y2="80" stroke="#f1f5f9" strokeDasharray="3 3" />
              <line x1="30" y1="130" x2="380" y2="130" stroke="#f1f5f9" strokeDasharray="3 3" />

              {/* Points calculation */}
              {(() => {
                const width = 350;
                const height = 110;
                const startX = 30;
                const startY = 140;

                const step = width / (applicationsByMonth.length - 1 || 1);
                const points = applicationsByMonth.map((item, idx) => {
                  const x = startX + idx * step;
                  const ratio = maxMonthCount > 0 ? item.count / maxMonthCount : 0;
                  const y = startY - ratio * height;
                  return { x, y, count: item.count, month: item.month };
                });

                const polyPoints = points.map((p) => `${p.x},${p.y}`).join(" ");
                const areaPoints = `${startX},${startY} ${polyPoints} ${points[points.length - 1].x},${startY}`;

                return (
                  <>
                    <polygon points={areaPoints} fill="url(#lineGrad)" />
                    <polyline
                      fill="none"
                      stroke="#4f46e5"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={polyPoints}
                    />
                    {points.map((p, idx) => (
                      <g key={idx}>
                        <circle cx={p.x} cy={p.y} r="4" fill="#ffffff" stroke="#4f46e5" strokeWidth="2.5" />
                        <text
                          x={p.x}
                          y={p.y - 8}
                          fontSize="10"
                          fontWeight="700"
                          fill="#312e81"
                          textAnchor="middle"
                        >
                          {p.count > 0 ? p.count : ""}
                        </text>
                        <text
                          x={p.x}
                          y="160"
                          fontSize="11"
                          fontWeight="600"
                          fill="#94a3b8"
                          textAnchor="middle"
                        >
                          {p.month}
                        </text>
                      </g>
                    ))}
                  </>
                );
              })()}
            </svg>
          </div>
        </div>

        {/* Chart 2: Application Pipeline Distribution */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">Status Breakdown</h3>
              <span className="chart-subtitle">Distribution across all pipeline phases</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
            {statusDistribution.map((item) => (
              <div key={item.status}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                  <span style={{ fontWeight: 600, color: "#334155" }}>{item.status}</span>
                  <span style={{ color: "#64748b" }}>
                    <strong>{item.count}</strong> ({item.percentage}%)
                  </span>
                </div>
                <div
                  style={{
                    height: "8px",
                    width: "100%",
                    borderRadius: "4px",
                    background: "#f1f5f9",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${item.percentage}%`,
                      background: item.style.text,
                      borderRadius: "4px",
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 3: Opportunity Categories (Bar Chart) */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">Opportunities by Category</h3>
              <span className="chart-subtitle">Role types in your tracker</span>
            </div>
          </div>

          <div style={{ height: "200px", display: "flex", alignItems: "flex-end", gap: "16px", padding: "10px 0" }}>
            {categoryDistribution.map((cat) => {
              const heightRatio = maxCategoryCount > 0 ? (cat.count / maxCategoryCount) * 130 : 0;
              return (
                <div
                  key={cat.type}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#0f172a" }}>
                    {cat.count}
                  </span>
                  <div
                    style={{
                      width: "100%",
                      maxWidth: "40px",
                      height: `${Math.max(heightRatio, 6)}px`,
                      borderRadius: "6px 6px 0 0",
                      background: cat.color,
                      transition: "height 0.3s ease",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#64748b",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: "70px",
                    }}
                    title={cat.type}
                  >
                    {cat.type}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 4: Weekly Activity Frequency */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">Weekly Engagement</h3>
              <span className="chart-subtitle">Actions logged over past 7 days</span>
            </div>
          </div>

          <div style={{ height: "200px", display: "flex", alignItems: "flex-end", gap: "12px", padding: "10px 0" }}>
            {weeklyActivity.map((w) => {
              const heightRatio = maxWeeklyCount > 0 ? (w.count / maxWeeklyCount) * 130 : 0;
              return (
                <div
                  key={w.date}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#0f172a" }}>
                    {w.count}
                  </span>
                  <div
                    style={{
                      width: "100%",
                      maxWidth: "36px",
                      height: `${Math.max(heightRatio, 6)}px`,
                      borderRadius: "6px 6px 0 0",
                      background: w.count > 0 ? "#10b981" : "#e2e8f0",
                      transition: "height 0.3s ease",
                    }}
                  />
                  <span style={{ fontSize: "11px", fontWeight: 600, color: "#64748b" }}>
                    {w.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Explanatory Calculation Card */}
      <div
        style={{
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          padding: "16px 20px",
          fontSize: "12px",
          color: "#64748b",
          lineHeight: 1.6,
        }}
      >
        <strong style={{ color: "#334155" }}>ℹ️ How OpportunityHub Calculates Your Metrics:</strong>
        <p style={{ margin: "4px 0 0" }}>
          All percentages and figures are calculated live from your actual opportunities and activity logs. We never invent sample data.
          When an opportunity stage moves to <em>Applied</em>, <em>Interview</em>, or <em>Selected</em>, success rates update immediately.
        </p>
      </div>
    </div>
  );
}
