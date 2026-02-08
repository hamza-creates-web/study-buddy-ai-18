import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPTS: Record<string, string> = {
  simple: `You are a friendly CS tutor for university students. Explain concepts in simple, easy-to-understand language. Use analogies and avoid jargon. Keep explanations concise but thorough. Format using markdown with headers, bullet points, and code blocks where appropriate.`,
  "step-by-step": `You are a detailed CS tutor. Break down every concept into numbered steps. Show the reasoning process clearly. Include pseudocode or code snippets. Highlight key takeaways. Format using markdown.`,
  "real-world": `You are a practical CS tutor. Explain concepts through real-world examples and applications. Show how theory applies in industry. Include practical code examples. Format using markdown.`,
  problem: `You are a CS problem-solving tutor. When given a problem:
1. Clarify the problem statement
2. Discuss approach and reasoning
3. Show step-by-step solution
4. Highlight common mistakes to avoid
5. Suggest practice variations
Format using markdown with code blocks.`,
  quiz: `You are a quiz generator for CS students. Generate exactly 5 questions based on the topic and difficulty. Return ONLY valid JSON (no markdown, no code fences) with this exact structure:
{"questions":[{"question":"...","type":"mcq","options":["opt1","opt2","opt3","opt4"],"correct_answer":"A","explanation":"..."}]}
For MCQs, correct_answer should be the letter (A, B, C, or D). For short/long questions, correct_answer should be the answer text.`,
  notes: `You are a study notes generator. Convert the given text into clean, well-organized study notes. Include:
- Key concepts highlighted
- Important definitions
- Formulas or algorithms in code blocks
- Summary points
- Mnemonics or memory aids where helpful
Format using markdown with clear headers and bullet points.`,
  planner: `You are a study planner AI. Create a detailed daily study plan based on the user's exam date, available hours, and subjects. Include:
- Day-by-day breakdown
- Time allocation per subject
- Mix of learning and revision
- Break suggestions
- Weekly review sessions
- Tips for effective studying
Format as a clean markdown table and schedule.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { messages, mode = "simple", subject, topic, difficulty, questionType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    let systemPrompt = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.simple;
    if (subject) systemPrompt += `\n\nSubject context: ${subject}`;
    if (topic) systemPrompt += `\nCurrent topic: ${topic}`;
    if (difficulty) systemPrompt += `\nDifficulty level: ${difficulty}`;

    if (mode === "quiz" && questionType) {
      const typeMap: Record<string, string> = {
        mcq: "multiple choice (MCQ) with 4 options",
        short: "short answer (1-2 sentences)",
        long: "long answer (detailed explanation required)",
      };
      systemPrompt += `\nQuestion type: ${typeMap[questionType] || "multiple choice"}`;
      if (questionType !== "mcq") {
        systemPrompt = systemPrompt.replace(
          '"type":"mcq","options":["opt1","opt2","opt3","opt4"],"correct_answer":"A"',
          `"type":"${questionType}","correct_answer":"the answer text"`
        );
      }
    }

    // For quiz and notes and planner, use non-streaming
    if (mode === "quiz" || mode === "notes" || mode === "planner") {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          stream: false,
        }),
      });

      if (!response.ok) {
        const status = response.status;
        if (status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const t = await response.text();
        console.error("AI error:", status, t);
        return new Response(JSON.stringify({ error: "AI error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";
      console.log("AI response mode:", mode, "length:", content.length);

      if (mode === "quiz") {
        try {
          // Try to parse JSON from the response, handling potential markdown fences
          let jsonStr = content.trim();
          if (jsonStr.startsWith("```")) {
            jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
          }
          const parsed = JSON.parse(jsonStr);
          return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        } catch (e) {
          console.error("Failed to parse quiz JSON:", e, "Content:", content.substring(0, 500));
          return new Response(JSON.stringify({ error: "Failed to generate questions", raw: content }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
      }

      if (mode === "notes") {
        return new Response(JSON.stringify({ notes: content }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      if (mode === "planner") {
        return new Response(JSON.stringify({ plan: content }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // Streaming mode for explanations
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("AI stream error:", status, t);
      return new Response(JSON.stringify({ error: "AI error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("study-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
