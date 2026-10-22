export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Only POST requests are allowed.",
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "Gemini API key is not configured on the server.",
    });
  }

  try {
    const { question, opportunities } = req.body || {};

    if (typeof question !== "string" || !question.trim()) {
      return res.status(400).json({
        error: "Please enter a question.",
      });
    }

    const safeOpportunities = Array.isArray(opportunities)
      ? opportunities.slice(0, 50).map((item) => ({
          title: String(item.title || ""),
          company: String(item.company || ""),
          type: String(item.type || ""),
          deadline: String(item.deadline || ""),
          status: String(item.status || ""),
        }))
      : [];

    const prompt =
      "Student opportunities:\n" +
      JSON.stringify(safeOpportunities) +
      "\n\nQuestion:\n" +
      question.trim().slice(0, 3000);

    const models = [
      "gemini-3.8-flash",
      "gemini-3.6-flash",
      "gemini-3.5-flash",
      "gemini-3.1-flash-lite",
      "gemini-flash-latest",
    ];

    let lastError = "";

    for (const model of models) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": apiKey,
            },
            body: JSON.stringify({
              systemInstruction: {
                parts: [
                  {
                    text:
                      "You are OpportunityHub AI, a helpful student " +
                      "opportunity assistant. Give clear, concise, " +
                      "practical advice based on the student's tracker. " +
                      "Do not invent opportunities, deadlines, or " +
                      "eligibility rules. If information is missing, " +
                      "say so.",
                  },
                ],
              },
              contents: [
                {
                  role: "user",
                  parts: [{ text: prompt }],
                },
              ],
              generationConfig: {
                temperature: 0.4,
                maxOutputTokens: 700,
              },
            }),
          }
        );

        const data = await response.json().catch(() => ({}));

        if (response.ok) {
          const answer = data.candidates?.[0]?.content?.parts
            ?.map((part) => part.text || "")
            .join("")
            .trim();

          if (answer) {
            return res.status(200).json({ answer });
          }

          lastError = "Gemini returned an empty response.";
          continue;
        }

        lastError = data.error?.message || `HTTP ${response.status}`;
        console.warn(`Gemini ${model} fallback trigger:`, lastError);
      } catch (err) {
        lastError = err.message;
        console.warn(`Gemini ${model} network error:`, lastError);
      }
    }

    return res.status(503).json({
      error:
        lastError || "Gemini is temporarily unavailable. Please try again in a little while.",
    });
  } catch (error) {
    console.error("OpportunityHub AI error:", error.message);

    return res.status(500).json({
      error: "Something went wrong while contacting Gemini.",
    });
  }
}
