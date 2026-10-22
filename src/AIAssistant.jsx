import { useState } from "react";

export default function AIAssistant({ opportunities = [] }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const suggestionPrompts = [
    "Which opportunity has the closest deadline?",
    "How should I prioritize my saved applications?",
    "Give me tips to prepare a strong application.",
  ];

  async function askGemini(event) {
    if (event) event.preventDefault();

    if (!question.trim() || loading) return;

    setLoading(true);
    setAnswer("");
    setError("");

    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.trim(),
          opportunities,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to get an AI response.");
      }

      setAnswer(data.answer);
    } catch (err) {
      setError(err.message || "Could not connect to the AI assistant.");
    } finally {
      setLoading(false);
    }
  }

  function handleSelectPrompt(promptText) {
    setQuestion(promptText);
  }

  return (
    <section
      style={{
        margin: "24px 0",
        padding: "24px",
        borderRadius: "18px",
        background: "linear-gradient(135deg, #17152d, #292052)",
        color: "#ffffff",
        boxShadow: "0 10px 25px rgba(23, 21, 45, 0.2)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <h2 style={{ margin: 0, fontSize: "20px" }}>✨ OpportunityHub AI</h2>
        <span
          style={{
            fontSize: "12px",
            background: "rgba(255, 255, 255, 0.12)",
            padding: "4px 10px",
            borderRadius: "999px",
            fontWeight: 600,
          }}
        >
          {opportunities.length} tracked item{opportunities.length === 1 ? "" : "s"} in context
        </span>
      </div>

      <p style={{ margin: "0 0 16px", color: "#cbd5e1", fontSize: "14px" }}>
        Get personalized strategy, preparation advice, and deadline guidance based on your tracked opportunities.
      </p>

      {/* Suggestion prompt chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "14px" }}>
        {suggestionPrompts.map((promptText) => (
          <button
            key={promptText}
            type="button"
            onClick={() => handleSelectPrompt(promptText)}
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.18)",
              color: "#e2e8f0",
              padding: "6px 12px",
              borderRadius: "8px",
              fontSize: "12px",
              cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.18)"; }}
            onMouseOut={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)"; }}
          >
            💬 {promptText}
          </button>
        ))}
      </div>

      <form onSubmit={askGemini}>
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask: Which opportunity should I prioritize, or how can I stand out?"
          rows={3}
          required
          style={{
            boxSizing: "border-box",
            width: "100%",
            padding: "14px",
            borderRadius: "10px",
            border: "1px solid rgba(255, 255, 255, 0.25)",
            background: "rgba(15, 23, 42, 0.6)",
            color: "#ffffff",
            font: "inherit",
            marginBottom: "12px",
            outline: "none",
          }}
        />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            type="submit"
            disabled={loading || !question.trim()}
            style={{
              padding: "11px 22px",
              border: 0,
              borderRadius: "10px",
              background: loading ? "#7c6bb0" : "#a78bfa",
              color: "#17152d",
              fontWeight: 700,
              cursor: loading ? "wait" : "pointer",
              transition: "transform 0.1s",
            }}
          >
            {loading ? "Thinking..." : "Ask Gemini ✨"}
          </button>

          {answer && (
            <button
              type="button"
              onClick={() => { setAnswer(""); setQuestion(""); }}
              style={{
                background: "transparent",
                border: "none",
                color: "#94a3b8",
                fontSize: "12px",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Clear conversation
            </button>
          )}
        </div>
      </form>

      {error && (
        <div
          role="alert"
          style={{
            marginTop: "14px",
            padding: "12px",
            borderRadius: "8px",
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.4)",
            color: "#fca5a5",
            fontSize: "13px",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {answer && (
        <div
          style={{
            marginTop: "18px",
            padding: "18px",
            borderRadius: "12px",
            background: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            whiteSpace: "pre-wrap",
            lineHeight: 1.7,
            fontSize: "14px",
          }}
        >
          {answer}
        </div>
      )}
    </section>
  );
}
