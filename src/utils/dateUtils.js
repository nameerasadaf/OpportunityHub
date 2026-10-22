// Date utilities for OpportunityHub

export function formatDate(dateString) {
  if (!dateString) return "No deadline";

  const cleanDate = dateString.includes("T") ? dateString.split("T")[0] : dateString;
  const parts = cleanDate.split("-");
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatTimeAgo(timestamp) {
  if (!timestamp) return "";
  const now = new Date();
  const past = new Date(timestamp);
  const diffSec = Math.floor((now - past) / 1000);

  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;

  return past.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
  });
}

export function getDeadlineInfo(deadline) {
  if (!deadline) {
    return {
      label: "No deadline",
      className: "no-deadline",
      daysLeft: null,
      status: "none",
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const cleanDate = deadline.includes("T") ? deadline.split("T")[0] : deadline;
  const parts = cleanDate.split("-");
  let deadlineDate;

  if (parts.length === 3) {
    deadlineDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  } else {
    deadlineDate = new Date(deadline);
  }
  deadlineDate.setHours(0, 0, 0, 0);

  if (Number.isNaN(deadlineDate.getTime())) {
    return {
      label: deadline,
      className: "no-deadline",
      daysLeft: null,
      status: "unknown",
    };
  }

  const difference = deadlineDate.getTime() - today.getTime();
  const daysLeft = Math.ceil(difference / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) {
    return {
      label: `Overdue by ${Math.abs(daysLeft)} day${Math.abs(daysLeft) === 1 ? "" : "s"}`,
      className: "overdue",
      daysLeft,
      status: "overdue",
    };
  }

  if (daysLeft === 0) {
    return {
      label: "Due today",
      className: "due-today",
      daysLeft: 0,
      status: "today",
    };
  }

  if (daysLeft <= 7) {
    return {
      label: `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`,
      className: "due-soon",
      daysLeft,
      status: "soon",
    };
  }

  return {
    label: `${daysLeft} days left`,
    className: "upcoming",
    daysLeft,
    status: "upcoming",
  };
}

export function toIsoDate(date) {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
