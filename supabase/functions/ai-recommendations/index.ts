/// <reference path="../edge-runtime.d.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";

export const config = {
  verify_jwt: false,
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const textPreview = (value: unknown, maxLength = 180) => {
  if (typeof value !== "string") return "";
  const compact = value.replace(/\s+/g, " ").trim();
  return compact.length > maxLength ? `${compact.slice(0, maxLength)}...` : compact;
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const safeParseJson = async (req: Request) => {
  const rawBody = await req.text();

  if (!rawBody.trim()) {
    return { ok: false as const, status: 400, error: "Request body is empty" };
  }

  try {
    const parsed = JSON.parse(rawBody);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ok: false as const, status: 400, error: "Request body must be a JSON object" };
    }

    return { ok: true as const, body: parsed as Record<string, unknown>, rawBody };
  } catch (error) {
    console.error("Failed to parse request JSON:", error);
    return { ok: false as const, status: 400, error: "Invalid JSON request body" };
  }
};

const GEMINI_MODEL_CANDIDATES = [
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash-lite",
  "gemma-3-4b",
] as const;

const isRateLimited = (status: number, body: string) => {
  const lower = body.toLowerCase();
  return status === 429 || lower.includes("resource_exhausted") || lower.includes("rate limit") || lower.includes("quota");
};

const callGeminiWithFallback = async (
  apiKey: string,
  payload: unknown,
  endpoint: "generateContent" | "streamGenerateContent" = "generateContent",
): Promise<Response> => {
  let lastErrorText = "";
  let lastStatus = 500;

  for (const modelName of GEMINI_MODEL_CANDIDATES) {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:${endpoint}?key=${apiKey}`;
    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      return response;
    }

    const errorText = await response.text();
    lastErrorText = errorText;
    lastStatus = response.status;

    if (isRateLimited(response.status, errorText)) {
      console.warn(`Rate limited on model '${modelName}', trying fallback model...`);
      continue;
    }

    throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
  }

  throw new Error(`Gemini API Error: ${lastStatus} - ${lastErrorText}`);
};

serve(async (req) => {
  const requestId = crypto.randomUUID();

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log(`[ai-recommendations:${requestId}] Incoming request`, {
      method: req.method,
      contentType: req.headers.get("content-type"),
      authorizationPresent: !!req.headers.get("Authorization"),
    });

    const parsedRequest = await safeParseJson(req);
    if (!parsedRequest.ok) {
      console.warn(`[ai-recommendations:${requestId}] ${parsedRequest.error}`);
      return jsonResponse({ success: false, error: parsedRequest.error, requestId }, parsedRequest.status);
    }

    const requestBody = parsedRequest.body;
    const action = typeof requestBody.action === "string" ? requestBody.action : "";
    const studentProfile = requestBody.studentProfile;
    const rawResumeText = typeof requestBody.resumeText === "string"
      ? requestBody.resumeText
      : typeof requestBody.rawResumeText === "string"
        ? requestBody.rawResumeText
        : typeof requestBody.resume_text === "string"
          ? requestBody.resume_text
          : "";
    const user_id = typeof requestBody.user_id === "string" ? requestBody.user_id : "";
    const historyRecommendations = requestBody.recommendations;

    console.log(`[ai-recommendations:${requestId}] Incoming request body`, {
      keys: Object.keys(requestBody),
      action,
      user_id,
      hasStudentProfile: !!studentProfile,
      resumeTextLength: rawResumeText.length,
      resumeUrl: textPreview(requestBody.resumeUrl),
      resumePath: textPreview(requestBody.resumePath),
      resumeFileUrl: textPreview(requestBody.resumeFileUrl),
    });

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const API_KEY = GEMINI_API_KEY || Deno.env.get("LOVABLE_API_KEY");

    console.log(`[ai-recommendations:${requestId}] Env status`, {
      GEMINI_API_KEY: !!GEMINI_API_KEY,
      LOVABLE_API_KEY: !!Deno.env.get("LOVABLE_API_KEY"),
      SUPABASE_URL: !!SUPABASE_URL,
      SUPABASE_ANON_KEY: !!SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!SUPABASE_SERVICE_ROLE_KEY,
    });
    console.log(`[ai-recommendations:${requestId}] Using API Key (partial):`, API_KEY ? `${API_KEY.slice(0, 8)}...` : "None");

    if (!API_KEY) {
      return jsonResponse({
        success: false,
        error: "AI API key is not configured. Set GEMINI_API_KEY or LOVABLE_API_KEY in the Edge Function environment.",
        requestId,
      }, 503);
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return jsonResponse({
        success: false,
        error: "Supabase credentials are not configured in the Edge Function environment.",
        requestId,
      }, 503);
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY || "", {
      global: { headers: { Authorization: authHeader || "" } },
    });

    if (action === "save_history") {
      if (!user_id) {
        return jsonResponse({ success: false, error: "user_id is required for save_history", requestId }, 400);
      }

      console.log(`[ai-recommendations:${requestId}] Saving history for user`, user_id);
      const { error: historyError } = await supabaseAdmin.from("recommendation_history").insert({
        user_id,
        student_profile: studentProfile,
        recommendations: historyRecommendations,
      });

      if (historyError) {
        console.error(`[ai-recommendations:${requestId}] Error saving history`, historyError);
        return jsonResponse({
          success: false,
          error: "Failed to save recommendation history",
          details: historyError.message || String(historyError),
          requestId,
        }, 500);
      }

      return jsonResponse({ success: true, requestId });
    }

    if (action === "get_history") {
      if (!user_id) {
        return jsonResponse({ success: false, error: "user_id is required for get_history", requestId }, 400);
      }

      const { data: history, error } = await supabaseAdmin
        .from("recommendation_history")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(`[ai-recommendations:${requestId}] History fetch error`, error);
        return jsonResponse({
          success: false,
          error: "Failed to fetch recommendation history",
          details: error.message || String(error),
          requestId,
        }, 500);
      }

      return jsonResponse({ success: true, history, requestId });
    }

    if (action === "parse_resume") {
      if (!rawResumeText.trim()) {
        console.warn(`[ai-recommendations:${requestId}] parse_resume called without usable resume text`, {
          resumeUrl: textPreview(requestBody.resumeUrl),
          resumePath: textPreview(requestBody.resumePath),
          resumeFileUrl: textPreview(requestBody.resumeFileUrl),
        });

        return jsonResponse({
          success: false,
          error: "resumeText is required for parse_resume and was empty or missing",
          details: "Extract the resume text before calling the Edge Function, or pass the extracted text in resumeText.",
          requestId,
        }, 400);
      }

      console.log(`[ai-recommendations:${requestId}] Resume text preview:`, textPreview(rawResumeText, 300));

      const parsePrompt = `
        You are an expert resume parser. Extract the following structured data from the resume text provided below.
        Return ONLY valid JSON. No markdown.

        Fields to Extract:
        - skills: comma separated string of technical skills
        - interests: comma separated string of inferred professional interests
        - education: one of ["high-school", "diploma", "bachelors", "masters", "phd"] (infer based on highest level mentioned or in progress)
        - preferredDomain: one of ["Software Testing Intern", "Cybersecurity Intern", "Web Development Intern", "Digital Marketing Intern", "Data Analytics Intern", "Cloud Computing Intern", "AI/ML Intern"] (infer based on skills/projects) or null
        - pythonLevel: "Beginner", "Intermediate", or "Advanced" (infer from context/projects)
        - sqlLevel: "Beginner", "Intermediate", or "Advanced"
        - javaLevel: "Beginner", "Intermediate", or "Advanced"
        - projects: 1-2 sentence summary of key projects mentioned
        - locationPreference: one of ["Remote", "In-office", "Hybrid"] (infer if mentioned, else default to "Remote")

        Resume Text:
        ${rawResumeText.slice(0, 3000)}
        `;

      const safetySettings = [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
      ];

      try {
        console.log(`[ai-recommendations:${requestId}] Sending resume parse request to AI provider`);
        const response = await callGeminiWithFallback(API_KEY, {
          contents: [{ parts: [{ text: parsePrompt }] }],
          safetySettings,
        });

        console.log(`[ai-recommendations:${requestId}] AI response status:`, response.status);

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
        console.log(`[ai-recommendations:${requestId}] AI Response (truncated):`, text.slice(0, 200));

        let jsonContent = text;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonContent = jsonMatch[0];
        }

        if (!jsonContent.trim()) {
          return jsonResponse({
            success: false,
            error: "AI provider returned empty resume analysis",
            requestId,
          }, 502);
        }

        try {
          const json = JSON.parse(jsonContent.trim());
          console.log(`[ai-recommendations:${requestId}] Resume parsed successfully`);
          return jsonResponse({ success: true, profile: json, requestId });
        } catch (parseError) {
          console.error(`[ai-recommendations:${requestId}] Failed to parse AI JSON response`, parseError);
          console.log(`[ai-recommendations:${requestId}] Raw text received:`, text.slice(0, 1000));
          return jsonResponse({
            success: false,
            error: "Failed to parse structured resume data from the AI response",
            details: "The AI provider returned text that was not valid JSON.",
            requestId,
          }, 502);
        }
      } catch (error) {
        console.error(`[ai-recommendations:${requestId}] Resume parsing error`, error);
        return jsonResponse({
          success: false,
          error: error instanceof Error ? error.message : "Resume parsing failed",
          requestId,
        }, 502);
      }
    }

    if (!studentProfile) {
      return jsonResponse({
        success: false,
        error: "studentProfile is required for recommendations",
        requestId,
      }, 400);
    }

    const { data: internships, error: dbError } = await supabase
      .from("internships")
      .select("*");

    if (dbError) {
      console.error(`[ai-recommendations:${requestId}] Internship fetch error`, dbError);
      return jsonResponse({
        success: false,
        error: "Failed to load internship data",
        details: dbError.message || String(dbError),
        requestId,
      }, 500);
    }

    if (!internships || internships.length === 0) {
      console.warn(`[ai-recommendations:${requestId}] No internships found in database`);
      return jsonResponse({ success: true, recommendations: [], requestId });
    }

    const {
      skills,
      interests,
      education,
      preferredDomain,
      pythonLevel,
      sqlLevel,
      javaLevel,
      availability,
      resumeText,
    } = studentProfile;

    let studentOrResumeSkills = (skills || "").toLowerCase();

    if (pythonLevel && pythonLevel !== "Beginner") studentOrResumeSkills += " python";
    if (sqlLevel && sqlLevel !== "Beginner") studentOrResumeSkills += " sql";
    if (javaLevel && javaLevel !== "Beginner") studentOrResumeSkills += " java";

    const isAdvanced = resumeText && resumeText.length > 50;

    const recommendations = internships.map((program: any) => {
      let score = 0;
      const matchedSkills: string[] = [];

      const programSkills = (program.required_skills || []).map((s: string) => s.toLowerCase());
      const programTitle = program.title.toLowerCase();

      programSkills.forEach((skill: string) => {
        if (studentOrResumeSkills.includes(skill)) {
          if (!matchedSkills.includes(skill)) {
            score += 10;
            matchedSkills.push(skill);
          }
        }
      });

      if (programTitle.includes("data") || programTitle.includes("ai") || programTitle.includes("machine learning")) {
        if (pythonLevel === "Advanced") score += 20;
        if (pythonLevel === "Intermediate") score += 10;
        if (sqlLevel === "Advanced") score += 15;
        if (sqlLevel === "Intermediate") score += 5;
      }

      if (programTitle.includes("testing") || programTitle.includes("software")) {
        if (javaLevel === "Advanced") score += 20;
        if (javaLevel === "Intermediate") score += 10;
      }

      if (programTitle.includes("web") && studentOrResumeSkills.includes("react")) score += 15;

      if (programTitle.includes("cyber") && (pythonLevel === "Advanced" || pythonLevel === "Intermediate")) score += 10;

      if (preferredDomain && preferredDomain !== "no-preference" && program.domain.toLowerCase().includes(preferredDomain.toLowerCase())) {
        score += 25;
      } else if (preferredDomain && program.title.toLowerCase().includes(preferredDomain.toLowerCase())) {
        score += 25;
      }

      if (interests) {
        const interestsLower = interests.toLowerCase();
        if (interestsLower.includes(programTitle) || programSkills.some((s: string) => interestsLower.includes(s))) {
          score += 15;
        }
      }

      const hours = parseInt(availability || "0");
      if (hours < 10 && (programTitle.includes("ai") || programTitle.includes("development"))) {
        score -= 10;
      }

      return {
        ...program,
        matchScore: Math.min(score, 100),
        matchedSkills,
        reasoning: "",
      };
    }).sort((a: any, b: any) => b.matchScore - a.matchScore);

    const topRecommendations = recommendations.slice(0, 3);

    if (topRecommendations.length > 0) {
      let aiPrompt = `
        You are an expert career advisor. Analyze this student profile and the selected top internship matches.

        Student Profile:
        - Specific Levels: Python (${pythonLevel}), SQL (${sqlLevel}), Java (${javaLevel})
        - Interests: ${interests}
        - Education: ${education}
        - Availability: ${availability} hours/week
      `;

      if (isAdvanced) {
        aiPrompt += `\n- RESUME / CV SUMMARY: ${resumeText.slice(0, 1000)}... (truncated)`;
      }

      aiPrompt += `
        \nTop 3 Internship Matches to Justify:
        ${topRecommendations.map((r: any, i: number) => `${i + 1}. ${r.title} (Match Score: ${r.matchScore}%)`).join("\n")}

        Task: Provide a professional, encouraging 1-2 sentence reasoning for EACH internship.
        If resume text is present, specifically mention how their experience aligns.
        If specific skill levels (e.g. Advanced Python) are key, mention that.

        Return ONLY a valid JSON array: [{"id": "internship-id", "reasoning": "explanation"}]
        Do not use markdown.`;

      try {
        console.log(`[ai-recommendations:${requestId}] Sending recommendation reasoning request to AI provider`);
        const aiResponse = await callGeminiWithFallback(API_KEY, {
          contents: [{ parts: [{ text: aiPrompt }] }],
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          try {
            const textContent = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

            let jsonString = textContent;
            const jsonMatch = textContent.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              jsonString = jsonMatch[0];
            }

            const reasonings = JSON.parse(jsonString.trim());

            if (Array.isArray(reasonings)) {
              reasonings.forEach((r: { id: string; reasoning: string }) => {
                const rec = topRecommendations.find((tr: any) => tr.id === r.id || tr.title === r.id);
                if (rec) {
                  rec.reasoning = r.reasoning;
                }
              });
            }
          } catch (parseError) {
            console.error(`[ai-recommendations:${requestId}] Error parsing AI response`, parseError);
          }
        }
      } catch (error) {
        console.error(`[ai-recommendations:${requestId}] Recommendation reasoning failed`, error);
      }
    }

    topRecommendations.forEach((rec: any) => {
      if (!rec.reasoning) {
        rec.reasoning = `A great fit based on your ${rec.matchedSkills.length > 0 ? rec.matchedSkills[0] : "background"} skills and availability.`;
      }
    });

    if (user_id && topRecommendations.length > 0) {
      const { error: historyError } = await supabase.from("recommendation_history").insert({
        user_id,
        student_profile: studentProfile,
        recommendations: topRecommendations,
      });

      if (historyError) {
        console.error(`[ai-recommendations:${requestId}] Error saving history`, historyError);
      }
    }

    console.log(`[ai-recommendations:${requestId}] Generated recommendations`, topRecommendations.length);

    return jsonResponse({
      success: true,
      recommendations: topRecommendations,
      requestId,
    });
  } catch (error) {
    console.error("Unexpected error in ai-recommendations:", error);
    return jsonResponse({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    }, 500);
  }
});
