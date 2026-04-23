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
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, studentProfile, resumeText: rawResumeText, user_id, recommendations: historyRecommendations } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

    // We can fallback to Lovable key if Gemini key is missing, or just enforce Gemini.
    // Given the user request, we prioritizing Gemini key.
    const API_KEY = GEMINI_API_KEY || Deno.env.get("LOVABLE_API_KEY");
    console.log("Action:", action);
    console.log("Using API Key (partial):", API_KEY ? `${API_KEY.slice(0, 8)}...` : "None");
    console.log("Resume Text Length:", rawResumeText ? rawResumeText.length : 0);

    if (!API_KEY) {
      console.error("No API KEY configured");
      throw new Error("API Key configuration missing");
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error("Supabase credentials not configured");
      throw new Error("Supabase credentials not configured");
    }

    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    console.log("Service Role Key Present:", !!SUPABASE_SERVICE_ROLE_KEY);

    // Use admin client for DB operations to ensure history is saved correctly
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Auth client if needed for specific user context
    const authHeader = req.headers.get('Authorization');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY || "", {
      global: { headers: { Authorization: authHeader || "" } },
    });

    // --- HISTORY ACTION ---
    if (action === "save_history" && user_id) {
      console.log("Saving history (Admin) for user:", user_id);
      const { error: historyError } = await supabaseAdmin.from('recommendation_history').insert({
        user_id,
        student_profile: studentProfile,
        recommendations: historyRecommendations,
      });

      if (historyError) {
        console.error("Error saving history to DB (Admin):", historyError);
        throw historyError;
      }
      console.log("History saved successfully to DB (Admin)!");

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get_history" && user_id) {
      const { data: history, error } = await supabaseAdmin
        .from('recommendation_history')
        .select('*')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("History Fetch Error:", error);
        throw error;
      }

      return new Response(JSON.stringify({ success: true, history }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- RESUME PARSING LOGIC ---
    if (action === "parse_resume" && rawResumeText) {
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

      const response = await callGeminiWithFallback(API_KEY, {
        contents: [{ parts: [{ text: parsePrompt }] }],
        safetySettings,
      });

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      console.log("AI Response (truncated):", text.slice(0, 100));

      // Improved JSON extraction - handle potential text before/after JSON block
      let jsonContent = text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonContent = jsonMatch[0];
      }

      try {
        const json = JSON.parse(jsonContent.trim());
        return new Response(JSON.stringify({ success: true, profile: json }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (parseError) {
        console.error("Failed to parse AI JSON response:", parseError);
        console.log("Raw text received:", text);
        throw new Error("Failed to parse structured resume data");
      }
    }

    // --- RECOMMENDATION LOGIC ---
    if (!studentProfile) {
      return new Response(JSON.stringify({ error: "studentProfile is required for recommendations" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error("Supabase credentials not configured");
      throw new Error("Supabase credentials not configured");
    }

    // Supabase client already initialized above

    // Fetch internships from the database
    const { data: internships, error: dbError } = await supabase
      .from('internships')
      .select('*');

    if (dbError) throw dbError;

    if (!internships || internships.length === 0) {
      return new Response(JSON.stringify({ success: true, recommendations: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
      resumeText
    } = studentProfile;

    // Normalize student skills from text areas + specific levels
    let studentOrResumeSkills = (skills || "").toLowerCase();

    // Add implicit skills based on levels
    if (pythonLevel && pythonLevel !== "Beginner") studentOrResumeSkills += " python";
    if (sqlLevel && sqlLevel !== "Beginner") studentOrResumeSkills += " sql";
    if (javaLevel && javaLevel !== "Beginner") studentOrResumeSkills += " java";

    const isAdvanced = resumeText && resumeText.length > 50;

    // Calculate rule-based scores with CSV-aligned logic
    const recommendations = internships.map((program: any) => {
      let score = 0;
      const matchedSkills: string[] = [];

      const programSkills = (program.required_skills || []).map((s: string) => s.toLowerCase());
      const programTitle = program.title.toLowerCase();

      // 1. Skill Matching (Base Score)
      programSkills.forEach((skill: string) => {
        if (studentOrResumeSkills.includes(skill)) {
          if (!matchedSkills.includes(skill)) {
            score += 10;
            matchedSkills.push(skill);
          }
        }
      });

      // 2. CSV Pattern Matching (Derived from dataset analysis)
      // Pattern: High Python + SQL -> Data/AI
      if (programTitle.includes("data") || programTitle.includes("ai") || programTitle.includes("machine learning")) {
        if (pythonLevel === "Advanced") score += 20;
        if (pythonLevel === "Intermediate") score += 10;
        if (sqlLevel === "Advanced") score += 15;
        if (sqlLevel === "Intermediate") score += 5;
      }

      // Pattern: Java -> Software Testing / Web Dev
      if (programTitle.includes("testing") || programTitle.includes("software")) {
        if (javaLevel === "Advanced") score += 20;
        if (javaLevel === "Intermediate") score += 10;
      }

      // Pattern: Web Dev -> HTML/CSS/JS (General skills check covers this, but add specific bonus)
      if (programTitle.includes("web") && studentOrResumeSkills.includes("react")) score += 15;

      // Pattern: Cyber -> Python + Networking (General skills)
      if (programTitle.includes("cyber") && (pythonLevel === "Advanced" || pythonLevel === "Intermediate")) score += 10;

      // 3. Domain Preference
      if (preferredDomain && preferredDomain !== "no-preference" && program.domain.toLowerCase().includes(preferredDomain.toLowerCase())) {
        score += 25;
      } else if (preferredDomain && program.title.toLowerCase().includes(preferredDomain.toLowerCase())) {
        // Fallback if domain names mismatch but title matches
        score += 25;
      }

      // 4. Interest Alignment
      if (interests) {
        const interestsLower = interests.toLowerCase();
        if (interestsLower.includes(programTitle) || programSkills.some((s: string) => interestsLower.includes(s))) {
          score += 15;
        }
      }

      // 5. Availability Check (Simple: if they have lots of time, they handle intense interns)
      const hours = parseInt(availability || "0");
      if (hours < 10 && (programTitle.includes("ai") || programTitle.includes("development"))) {
        score -= 10; // Penalty for low availability on intense roles
      }

      return {
        ...program,
        matchScore: Math.min(score, 100),
        matchedSkills: matchedSkills,
        reasoning: "",
      };
    }).sort((a: any, b: any) => b.matchScore - a.matchScore);

    // Get Top 3
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

      // Call Gemini API
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
          console.error("Error parsing AI response:", parseError);
        }
      }
    }

    // Default Fallbacks
    topRecommendations.forEach((rec: any) => {
      if (!rec.reasoning) {
        rec.reasoning = `A great fit based on your ${rec.matchedSkills.length > 0 ? rec.matchedSkills[0] : "background"} skills and availability.`;
      }
    });

    // --- SAVE TO HISTORY ---
    if (user_id && topRecommendations.length > 0) {
      // Check if there are assessment scores in the input (passed from client or calculated)
      // For now, ai-recommendations doesn't process assessment scores directly for ranking (that's the python service), 
      // but we might want to save them if passed.
      // However, the prompt implies the python service handles the advanced logic.
      // If this function is just for the "Basic" AI recommendations (Gemini), it might not have assessment data.
      // But let's add the field support just in case future updates pass it.

      const { error: historyError } = await supabase.from('recommendation_history').insert({
        user_id,
        student_profile: studentProfile,
        recommendations: topRecommendations,
        // assessment_result: assessment_result // validation needed if we add this to input
      });
      if (historyError) console.error("Error saving history:", historyError);
    }

    return new Response(JSON.stringify({
      success: true,
      recommendations: topRecommendations,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("Recommendation error:", e?.name, e?.message);
    if (e?.stack) console.error("Stack trace:", e.stack);
    return new Response(JSON.stringify({ 
      error: e instanceof Error ? e.message : "Unknown error",
      details: e?.stack || "No stack trace"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
