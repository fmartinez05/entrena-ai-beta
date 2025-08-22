export default async function handler(req, res) {
  // Configuración CORS
  const allowedOrigin = process.env.ALLOWED_ORIGIN || "*";
  const origin = req.headers.origin || "";
  const allow = allowedOrigin === "*" || origin === allowedOrigin ? origin || allowedOrigin : allowedOrigin;

  res.setHeader("Access-Control-Allow-Origin", allow);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

  try {
    const { message } = req.body || {};
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Falta 'message'" });
    }

    const systemPrompt = [
      "Eres un entrenador personal experto en running, maratón y triatlón.",
      "Responde en español, tono profesional, motivador y breve."
    ].join(" ");

    const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";
    const url = `${endpoint}?key=${process.env.GEMINI_API_KEY}`;

    const payload = {
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemPrompt}\n\nPregunta: ${message}` }]
        }
      ]
    };

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!r.ok) {
      const errText = await r.text();
      return res.status(r.status).json({ error: "Gemini error", detail: errText });
    }

    const data = await r.json();
    const reply = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("\n").trim();

    return res.status(200).json({ reply: reply || "Lo siento, no pude generar respuesta." });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
