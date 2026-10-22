// CSV and JSON export / import utilities

function escapeCsvField(field) {
  if (field === null || field === undefined) return '""';
  const stringField = String(field);
  if (stringField.includes('"') || stringField.includes(",") || stringField.includes("\n") || stringField.includes("\r")) {
    return `"${stringField.replace(/"/g, '""')}"`;
  }
  return `"${stringField}"`;
}

export function exportOpportunitiesToCsv(opportunities, filename = "opportunityhub-tracked.csv") {
  if (!opportunities || !opportunities.length) {
    alert("No tracked opportunities to export.");
    return;
  }

  const headers = [
    "Title",
    "Company / Organization",
    "Type",
    "Status",
    "Deadline",
    "Applied Date",
    "Follow-up Date",
    "Location",
    "URL",
    "Source",
    "Notes Count",
  ];

  const rows = opportunities.map((opp) => [
    escapeCsvField(opp.title),
    escapeCsvField(opp.company),
    escapeCsvField(opp.type),
    escapeCsvField(opp.status),
    escapeCsvField(opp.deadline || ""),
    escapeCsvField(opp.appliedDate || ""),
    escapeCsvField(opp.followUpDate || ""),
    escapeCsvField(opp.location || ""),
    escapeCsvField(opp.url || ""),
    escapeCsvField(opp.source || ""),
    escapeCsvField(Array.isArray(opp.notes) ? opp.notes.length : (opp.notes ? 1 : 0)),
  ]);

  const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");
  downloadBlob(csvContent, filename, "text/csv;charset=utf-8;");
}

export function exportActivitiesToCsv(activities, filename = "opportunityhub-activity-log.csv") {
  if (!activities || !activities.length) {
    alert("No activities logged yet to export.");
    return;
  }

  const headers = ["Timestamp", "Action Type", "Description", "Opportunity Title", "Details"];

  const rows = activities.map((act) => [
    escapeCsvField(new Date(act.timestamp).toLocaleString("en-IN")),
    escapeCsvField(act.type),
    escapeCsvField(act.title),
    escapeCsvField(act.opportunityTitle || ""),
    escapeCsvField(act.details || ""),
  ]);

  const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");
  downloadBlob(csvContent, filename, "text/csv;charset=utf-8;");
}

export function exportBackupToJson(data, filename = "opportunityhub-backup.json") {
  const jsonString = JSON.stringify(data, null, 2);
  downloadBlob(jsonString, filename, "application/json;charset=utf-8;");
}

function downloadBlob(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
