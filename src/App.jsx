import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "opportunityhub-data";

const initialOpportunities = [
  {
    id: 1,
    title: "Google Summer Internship",
    company: "Google",
    type: "Internship",
    deadline: "2026-11-15",
    status: "Interested",
    color: "#4285F4",
  },
  {
    id: 2,
    title: "Smart India Hackathon",
    company: "Smart India Hackathon",
    type: "Hackathon",
    deadline: "2026-10-20",
    status: "Saved",
    color: "#FF6B35",
  },
  {
    id: 3,
    title: "Microsoft AI Internship",
    company: "Microsoft",
    type: "Internship",
    deadline: "2026-11-28",
    status: "Applied",
    color: "#00A4EF",
  },
];

const statuses = [
  "Saved",
  "Interested",
  "Applied",
  "Interview",
  "Selected",
];

function getTypeColor(type) {
  if (type === "Hackathon") return "#FF6B35";
  if (type === "Internship") return "#4285F4";
  if (type === "Job") return "#7C3AED";
  if (type === "Competition") return "#059669";

  return "#64748B";
}

function formatDate(dateString) {
  if (!dateString) return "No deadline";

  const date = new Date(`${dateString}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getDeadlineInfo(deadline) {
  if (!deadline) {
    return {
      label: "No deadline",
      className: "no-deadline",
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadlineDate = new Date(`${deadline}T00:00:00`);
  deadlineDate.setHours(0, 0, 0, 0);

  const difference =
    deadlineDate.getTime() - today.getTime();

  const daysLeft = Math.ceil(
    difference / (1000 * 60 * 60 * 24)
  );

  if (daysLeft < 0) {
    return {
      label: `Overdue by ${Math.abs(daysLeft)} day${
        Math.abs(daysLeft) === 1 ? "" : "s"
      }`,
      className: "overdue",
    };
  }

  if (daysLeft === 0) {
    return {
      label: "Due today",
      className: "due-today",
    };
  }

  if (daysLeft <= 7) {
    return {
      label: `${daysLeft} day${
        daysLeft === 1 ? "" : "s"
      } left`,
      className: "due-soon",
    };
  }

  return {
    label: `${daysLeft} days left`,
    className: "upcoming",
  };
}

function App() {
  const [opportunities, setOpportunities] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);

        return parsed.map((item) => ({
          ...item,
          deadline:
            item.deadline &&
            item.deadline.includes("-")
              ? item.deadline
              : convertOldDate(item.deadline),
        }));
      }

      return initialOpportunities;
    } catch {
      return initialOpportunities;
    }
  });

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [newOpportunity, setNewOpportunity] = useState({
    title: "",
    company: "",
    type: "Internship",
    deadline: "",
  });

  const opportunitiesRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(opportunities)
    );
  }, [opportunities]);

  const totalOpportunities = opportunities.length;

  const appliedCount = opportunities.filter(
    (item) => item.status === "Applied"
  ).length;

  const interestedCount = opportunities.filter(
    (item) => item.status === "Interested"
  ).length;

  const savedCount = opportunities.filter(
    (item) => item.status === "Saved"
  ).length;

  const interviewCount = opportunities.filter(
    (item) => item.status === "Interview"
  ).length;

  const selectedCount = opportunities.filter(
    (item) => item.status === "Selected"
  ).length;

  const overdueCount = opportunities.filter(
    (item) =>
      getDeadlineInfo(item.deadline).className ===
      "overdue"
  ).length;

  const dueSoonCount = opportunities.filter(
    (item) => {
      const className =
        getDeadlineInfo(item.deadline).className;

      return (
        className === "due-soon" ||
        className === "due-today"
      );
    }
  ).length;

  const filteredOpportunities = opportunities
    .filter((item) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        item.title
          .toLowerCase()
          .includes(searchText) ||
        item.company
          .toLowerCase()
          .includes(searchText);

      const matchesFilter =
        filter === "All" ||
        item.status === filter;

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;

      return (
        new Date(a.deadline) -
        new Date(b.deadline)
      );
    });

  function changeStatus(id, newStatus) {
    setOpportunities((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              status: newStatus,
            }
          : item
      )
    );
  }

  function deleteOpportunity(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this opportunity?"
    );

    if (!confirmed) {
      return;
    }

    setOpportunities((current) =>
      current.filter((item) => item.id !== id)
    );
  }

  function startEditing(item) {
    setEditingId(item.id);

    setNewOpportunity({
      title: item.title,
      company: item.company,
      type: item.type,
      deadline: convertOldDate(item.deadline),
    });

    setShowModal(true);
  }

  function openAddModal() {
    setEditingId(null);

    setNewOpportunity({
      title: "",
      company: "",
      type: "Internship",
      deadline: "",
    });

    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingId(null);

    setNewOpportunity({
      title: "",
      company: "",
      type: "Internship",
      deadline: "",
    });
  }

  function saveOpportunity(e) {
    e.preventDefault();

    if (
      !newOpportunity.title.trim() ||
      !newOpportunity.company.trim() ||
      !newOpportunity.deadline
    ) {
      alert("Please fill all fields.");
      return;
    }

    if (editingId !== null) {
      setOpportunities((current) =>
        current.map((item) =>
          item.id === editingId
            ? {
                ...item,
                title:
                  newOpportunity.title.trim(),
                company:
                  newOpportunity.company.trim(),
                type: newOpportunity.type,
                deadline:
                  newOpportunity.deadline,
                color: getTypeColor(
                  newOpportunity.type
                ),
              }
            : item
        )
      );
    } else {
      const newItem = {
        id: Date.now(),
        title: newOpportunity.title.trim(),
        company: newOpportunity.company.trim(),
        type: newOpportunity.type,
        deadline: newOpportunity.deadline,
        status: "Saved",
        color: getTypeColor(
          newOpportunity.type
        ),
      };

      setOpportunities((current) => [
        ...current,
        newItem,
      ]);
    }

    closeModal();
  }

  function scrollToOpportunities() {
    opportunitiesRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }

  function focusSearch() {
    scrollToOpportunities();

    setTimeout(() => {
      searchRef.current?.focus();
    }, 400);
  }

  function getStatusClass(status) {
    return status.toLowerCase();
  }

  return (
    <div className="app">
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family: Inter, Arial, sans-serif;
          background: #f6f8fc;
          color: #172033;
        }

        button,
        input,
        select {
          font: inherit;
        }

        button {
          cursor: pointer;
        }

        .app {
          min-height: 100vh;
          display: flex;
        }

        .sidebar {
          width: 250px;
          min-height: 100vh;
          background: #111827;
          color: white;
          padding: 28px 18px;
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
        }

        .logo {
          font-size: 22px;
          font-weight: 800;
          margin-bottom: 40px;
          padding-left: 10px;
        }

        .logo span {
          color: #6366f1;
        }

        .nav {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .nav button {
          border: none;
          background: transparent;
          color: #cbd5e1;
          text-align: left;
          padding: 13px 14px;
          border-radius: 10px;
          font-weight: 600;
        }

        .nav button:hover,
        .nav button.active {
          background: #252d3d;
          color: white;
        }

        .main {
          margin-left: 250px;
          width: calc(100% - 250px);
          padding: 32px 40px;
        }

        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }

        .welcome h1 {
          margin: 0;
          font-size: 28px;
        }

        .welcome p {
          margin: 7px 0 0;
          color: #64748b;
        }

        .add-btn {
          border: none;
          background: #4f46e5;
          color: white;
          padding: 12px 18px;
          border-radius: 10px;
          font-weight: 700;
        }

        .add-btn:hover {
          background: #4338ca;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 18px;
          margin-bottom: 28px;
        }

        .stat-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 15px;
          padding: 20px;
        }

        .stat-title {
          color: #64748b;
          font-size: 14px;
          margin-bottom: 10px;
        }

        .stat-number {
          font-size: 28px;
          font-weight: 800;
        }

        .pipeline {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 15px;
          padding: 20px;
          margin-bottom: 28px;
        }

        .section-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 18px;
        }

        .section-title h2 {
          margin: 0;
          font-size: 19px;
        }

        .pipeline-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 12px;
        }

        .pipeline-item {
          background: #f8fafc;
          border-radius: 10px;
          padding: 14px;
        }

        .pipeline-item span {
          display: block;
          color: #64748b;
          font-size: 13px;
          margin-bottom: 6px;
        }

        .pipeline-item strong {
          font-size: 22px;
        }

        .deadline-summary {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 28px;
        }

        .deadline-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 15px;
          padding: 18px;
        }

        .deadline-card-title {
          font-size: 13px;
          color: #64748b;
          margin-bottom: 6px;
        }

        .deadline-card-number {
          font-size: 24px;
          font-weight: 800;
        }

        .deadline-card.overdue-card {
          border-left: 4px solid #dc2626;
        }

        .deadline-card.soon-card {
          border-left: 4px solid #f59e0b;
        }

        .toolbar {
          display: flex;
          gap: 12px;
          margin-bottom: 18px;
        }

        .search {
          flex: 1;
          padding: 13px 15px;
          border: 1px solid #dbe1ea;
          border-radius: 10px;
          outline: none;
          background: white;
        }

        .search:focus {
          border-color: #6366f1;
        }

        .filter {
          padding: 13px;
          border: 1px solid #dbe1ea;
          border-radius: 10px;
          background: white;
        }

        .list {
          display: grid;
          gap: 14px;
        }

        .opportunity {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 15px;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }

        .opportunity-left {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .company-icon {
          width: 46px;
          height: 46px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 800;
          flex-shrink: 0;
        }

        .opportunity h3 {
          margin: 0 0 6px;
          font-size: 16px;
        }

        .company {
          color: #64748b;
          font-size: 14px;
          margin-bottom: 6px;
        }

        .deadline {
          color: #64748b;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .deadline-status {
          display: inline-flex;
          padding: 4px 8px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
        }

        .deadline-status.overdue {
          background: #fee2e2;
          color: #b91c1c;
        }

        .deadline-status.due-today {
          background: #fef3c7;
          color: #b45309;
        }

        .deadline-status.due-soon {
          background: #ffedd5;
          color: #c2410c;
        }

        .deadline-status.upcoming {
          background: #dcfce7;
          color: #15803d;
        }

        .deadline-status.no-deadline {
          background: #f1f5f9;
          color: #64748b;
        }

        .opportunity-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .type {
          background: #f1f5f9;
          color: #475569;
          padding: 7px 10px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
        }

        .status-select {
          border: 1px solid #dbe1ea;
          border-radius: 8px;
          padding: 8px 10px;
          font-weight: 700;
          outline: none;
          background: white;
        }

        .status-select.saved {
          color: #64748b;
        }

        .status-select.interested {
          color: #d97706;
        }

        .status-select.applied {
          color: #2563eb;
        }

        .status-select.interview {
          color: #7c3aed;
        }

        .status-select.selected {
          color: #059669;
        }

        .edit-btn,
        .delete-btn {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        }

        .edit-btn {
          border: 1px solid #c7d2fe;
        }

        .edit-btn:hover {
          background: #eef2ff;
        }

        .delete-btn {
          border: 1px solid #fecaca;
        }

        .delete-btn:hover {
          background: #fee2e2;
        }

        .empty {
          background: white;
          border: 1px dashed #cbd5e1;
          padding: 40px;
          text-align: center;
          border-radius: 15px;
          color: #64748b;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 100;
        }

        .modal {
          width: 100%;
          max-width: 480px;
          background: white;
          border-radius: 18px;
          padding: 25px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
        }

        .modal h2 {
          margin-top: 0;
          margin-bottom: 20px;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-group label {
          display: block;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 7px;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 12px;
          border: 1px solid #dbe1ea;
          border-radius: 9px;
          outline: none;
        }

        .form-group input:focus,
        .form-group select:focus {
          border-color: #6366f1;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 20px;
        }

        .cancel-btn {
          border: 1px solid #dbe1ea;
          background: white;
          padding: 11px 16px;
          border-radius: 9px;
        }

        .cancel-btn:hover {
          background: #f8fafc;
        }

        .submit-btn {
          border: none;
          background: #4f46e5;
          color: white;
          padding: 11px 16px;
          border-radius: 9px;
          font-weight: 700;
        }

        .submit-btn:hover {
          background: #4338ca;
        }

        @media (max-width: 900px) {
          .sidebar {
            width: 210px;
          }

          .main {
            margin-left: 210px;
            width: calc(100% - 210px);
            padding: 25px;
          }

          .stats {
            grid-template-columns: repeat(2, 1fr);
          }

          .pipeline-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 650px) {
          .sidebar {
            display: none;
          }

          .main {
            margin-left: 0;
            width: 100%;
            padding: 20px;
          }

          .topbar {
            align-items: flex-start;
            gap: 15px;
            flex-direction: column;
          }

          .stats {
            grid-template-columns: 1fr 1fr;
          }

          .deadline-summary {
            grid-template-columns: 1fr;
          }

          .opportunity {
            align-items: flex-start;
            flex-direction: column;
          }

          .opportunity-right {
            width: 100%;
            justify-content: flex-start;
            flex-wrap: wrap;
          }

          .toolbar {
            flex-direction: column;
          }
        }
      `}</style>

      <aside className="sidebar">
        <div className="logo">
          Opportunity<span>Hub</span>
        </div>

        <nav className="nav">
          <button className="active">
            Dashboard
          </button>

          <button onClick={scrollToOpportunities}>
            Opportunities
          </button>

          <button
            onClick={() => {
              setFilter("Saved");
              scrollToOpportunities();
            }}
          >
            Saved
          </button>

          <button onClick={focusSearch}>
            Search
          </button>
        </nav>
      </aside>

      <main className="main">
        <div className="topbar">
          <div className="welcome">
            <h1>Good morning 👋</h1>

            <p>
              Track your opportunities in one place.
            </p>
          </div>

          <button
            className="add-btn"
            onClick={openAddModal}
          >
            + Add Opportunity
          </button>
        </div>

        <section className="stats">
          <div className="stat-card">
            <div className="stat-title">
              Total Opportunities
            </div>

            <div className="stat-number">
              {totalOpportunities}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-title">
              Applied
            </div>

            <div className="stat-number">
              {appliedCount}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-title">
              Interested
            </div>

            <div className="stat-number">
              {interestedCount}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-title">
              Saved
            </div>

            <div className="stat-number">
              {savedCount}
            </div>
          </div>
        </section>

        <section className="pipeline">
          <div className="section-title">
            <h2>Application Pipeline</h2>
          </div>

          <div className="pipeline-grid">
            <div className="pipeline-item">
              <span>Saved</span>
              <strong>{savedCount}</strong>
            </div>

            <div className="pipeline-item">
              <span>Interested</span>
              <strong>{interestedCount}</strong>
            </div>

            <div className="pipeline-item">
              <span>Applied</span>
              <strong>{appliedCount}</strong>
            </div>

            <div className="pipeline-item">
              <span>Interview</span>
              <strong>{interviewCount}</strong>
            </div>

            <div className="pipeline-item">
              <span>Selected</span>
              <strong>{selectedCount}</strong>
            </div>
          </div>
        </section>

        <section className="deadline-summary">
          <div className="deadline-card overdue-card">
            <div className="deadline-card-title">
              Overdue
            </div>

            <div className="deadline-card-number">
              {overdueCount}
            </div>
          </div>

          <div className="deadline-card soon-card">
            <div className="deadline-card-title">
              Due Soon
            </div>

            <div className="deadline-card-number">
              {dueSoonCount}
            </div>
          </div>
        </section>

        <section ref={opportunitiesRef}>
          <div className="section-title">
            <h2>My Opportunities</h2>
          </div>

          <div className="toolbar">
            <input
              ref={searchRef}
              className="search"
              placeholder="Search opportunities or companies..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

            <select
              className="filter"
              value={filter}
              onChange={(e) =>
                setFilter(e.target.value)
              }
            >
              <option value="All">
                All Statuses
              </option>

              {statuses.map((status) => (
                <option
                  key={status}
                  value={status}
                >
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className="list">
            {filteredOpportunities.length === 0 ? (
              <div className="empty">
                No opportunities found.
              </div>
            ) : (
              filteredOpportunities.map((item) => {
                const deadlineInfo =
                  getDeadlineInfo(item.deadline);

                return (
                  <div
                    className="opportunity"
                    key={item.id}
                  >
                    <div className="opportunity-left">
                      <div
                        className="company-icon"
                        style={{
                          background:
                            item.color ||
                            getTypeColor(item.type),
                        }}
                      >
                        {item.company
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div>
                        <h3>{item.title}</h3>

                        <div className="company">
                          {item.company}
                        </div>

                        <div className="deadline">
                          <span>
                            Deadline:{" "}
                            {formatDate(
                              item.deadline
                            )}
                          </span>

                          <span
                            className={`deadline-status ${deadlineInfo.className}`}
                          >
                            {deadlineInfo.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="opportunity-right">
                      <span className="type">
                        {item.type}
                      </span>

                      <select
                        className={`status-select ${getStatusClass(
                          item.status
                        )}`}
                        value={item.status}
                        onChange={(e) =>
                          changeStatus(
                            item.id,
                            e.target.value
                          )
                        }
                      >
                        {statuses.map((status) => (
                          <option
                            key={status}
                            value={status}
                          >
                            {status}
                          </option>
                        ))}
                      </select>

                      <button
                        className="edit-btn"
                        onClick={() =>
                          startEditing(item)
                        }
                        title="Edit opportunity"
                      >
                        ✏️
                      </button>

                      <button
                        className="delete-btn"
                        onClick={() =>
                          deleteOpportunity(
                            item.id
                          )
                        }
                        title="Delete opportunity"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>

      {showModal && (
        <div
          className="modal-overlay"
          onClick={closeModal}
        >
          <div
            className="modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <h2>
              {editingId !== null
                ? "Edit Opportunity"
                : "Add Opportunity"}
            </h2>

            <form onSubmit={saveOpportunity}>
              <div className="form-group">
                <label>
                  Opportunity Title
                </label>

                <input
                  type="text"
                  placeholder="e.g. AI Product Design Internship"
                  value={newOpportunity.title}
                  onChange={(e) =>
                    setNewOpportunity({
                      ...newOpportunity,
                      title: e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label>Company</label>

                <input
                  type="text"
                  placeholder="e.g. Microsoft"
                  value={newOpportunity.company}
                  onChange={(e) =>
                    setNewOpportunity({
                      ...newOpportunity,
                      company: e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label>Type</label>

                <select
                  value={newOpportunity.type}
                  onChange={(e) =>
                    setNewOpportunity({
                      ...newOpportunity,
                      type: e.target.value,
                    })
                  }
                >
                  <option>Internship</option>
                  <option>Hackathon</option>
                  <option>Job</option>
                  <option>Competition</option>
                </select>
              </div>

              <div className="form-group">
                <label>Deadline</label>

                <input
                  type="date"
                  value={newOpportunity.deadline}
                  onChange={(e) =>
                    setNewOpportunity({
                      ...newOpportunity,
                      deadline: e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={closeModal}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="submit-btn"
                >
                  {editingId !== null
                    ? "Save Changes"
                    : "Add Opportunity"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function convertOldDate(dateString) {
  if (!dateString) return "";

  if (/^\\d{4}-\\d{2}-\\d{2}$/.test(dateString)) {
    return dateString;
  }

  const parsed = new Date(dateString);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const year = parsed.getFullYear();
  const month = String(
    parsed.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    parsed.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default App;