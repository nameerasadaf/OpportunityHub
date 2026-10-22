import React from "react";
import { useOpportunity } from "../../context/OpportunityContext.jsx";

export default function Toast() {
  const { toast } = useOpportunity();

  if (!toast.visible || !toast.message) return null;

  const icon =
    toast.type === "success"
      ? "✓"
      : toast.type === "error"
      ? "✕"
      : "ℹ";

  return (
    <div className="toast-container" role="alert" aria-live="polite">
      <div className="toast-item">
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            background:
              toast.type === "success"
                ? "#10b981"
                : toast.type === "error"
                ? "#ef4444"
                : "#6366f1",
            color: "#ffffff",
            fontSize: "12px",
            fontWeight: "bold",
          }}
        >
          {icon}
        </span>
        <span>{toast.message}</span>
      </div>
    </div>
  );
}
