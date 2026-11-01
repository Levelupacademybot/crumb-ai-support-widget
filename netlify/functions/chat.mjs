// Production mode: grounded answer from the FAQ via the Claude API.
// Set ANTHROPIC_API_KEY in Netlify env. The browser demo works without it.
import faq from "../../faq.json" with { type: "json" };

const SYSTEM = `You are the customer-support assistant of a bakery.
Answer ONLY from the FAQ below. If the answer is not there, reply exactly "HANDOFF".
Be short and friendly, 1-3 sentences.

FAQ:
${faq.map((f) => `Q: ${f.q}\nA: ${f.a}`).join("\n\n")}`;

export default async (req) => {
  const { question } = await req.json();
  if (!question || question.length > 500) return new Response("Bad request", { status: 400 });

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.MODEL || "claude-haiku-5-5",
      max_tokens: 300,
      system: SYSTEM,
      messages: [{ role: "user", content: question }],
    }),
  });
  if (!r.ok) return Response.json({ handoff: true }, { status: 200 });
  const text = (await r.json()).content?.[0]?.text?.trim() ?? "HANDOFF";
  return Response.json(text === "HANDOFF" ? { handoff: true } : { answer: text });
};
