import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

const callGeminiWithFallback = async (apiKey: string, payload: unknown): Promise<Response> => {
  let lastErrorText = "";
  let lastStatus = 500;

  for (const modelName of GEMINI_MODEL_CANDIDATES) {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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

    throw new Error(`AI service error: ${response.status}`);
  }

  throw new Error(`AI service error: ${lastStatus} - ${lastErrorText}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { applications, programId } = await req.json();
    const API_KEY = Deno.env.get("GEMINI_API_KEY");

    if (!API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    if (!applications || !Array.isArray(applications)) {
      return new Response(JSON.stringify({ error: "Invalid applications data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prepare application data for AI analysis
    const applicationsForAnalysis = applications.map(app => ({
      id: app.id,
      fullName: app.full_name,
      email: app.email,
      education: app.education,
      experience: app.experience || "Not provided",
      motivation: app.motivation,
      skills: app.experience || "",
      preferredType: app.preferred_type,
      availability: app.availability,
      hasResume: !!app.resume_url,
      hasLinkedIn: !!app.linkedin_url,
    }));

    const aiPrompt = `You are an AI screening agent for an IT company's internship program.

Analyze these ${applications.length} applications for the ${programId || "general"} internship program and rank them.

Applications:
${JSON.stringify(applicationsForAnalysis, null, 2)}

For each application, evaluate:
1. Skills Match (0-30 points): Technical skills alignment with the program
2. Motivation Quality (0-25 points): Clarity and enthusiasm in motivation statement
3. Education Relevance (0-20 points): Educational background fit
4. Profile Completeness (0-15 points): Resume, LinkedIn, experience provided
5. Availability (0-10 points): How soon they can start

Return a JSON object with this exact format:
{
  "rankings": [
    {
      "id": "application-id",
      "rank": 1,
      "totalScore": 85,
      "breakdown": {
        "skillsMatch": 25,
        "motivationQuality": 22,
        "educationRelevance": 18,
        "profileCompleteness": 12,
        "availability": 8
      },
      "recommendation": "SHORTLIST" or "REVIEW" or "REJECT",
      "reasoning": "2-3 sentence explanation of why this candidate is ranked here and the recommendation"
    }
  ],
  "summary": "Brief overall summary of the applicant pool quality"
}
IMPORTANT: Return ONLY valid JSON. No markdown.`;

    const aiResponse = await callGeminiWithFallback(API_KEY, {
      contents: [
        { role: "user", parts: [{ text: "You are an expert HR AI assistant specialized in screening internship applications. Provide fair, unbiased evaluations. Always respond with valid JSON." }] },
        { role: "user", parts: [{ text: aiPrompt }] }
      ],
      generationConfig: {
        response_mime_type: "application/json",
      }
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("Gemini error:", aiResponse.status, errorText);
      throw new Error(`AI service error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    let analysisResult: any = { rankings: [], summary: "Analysis completed" };

    try {
      const content = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      analysisResult = JSON.parse(content);
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      // Provide fallback ranking based on basic criteria
      analysisResult = {
        rankings: applications.map((app, idx) => ({
          id: app.id,
          rank: idx + 1,
          totalScore: 50,
          breakdown: {
            skillsMatch: 10,
            motivationQuality: 10,
            educationRelevance: 10,
            profileCompleteness: 10,
            availability: 10,
          },
          recommendation: "REVIEW",
          reasoning: "Requires manual review - AI analysis unavailable",
        })),
        summary: "Basic ranking applied. Manual review recommended.",
      };
    }

    return new Response(JSON.stringify({
      success: true,
      analysis: analysisResult,
      processedAt: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Screening error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
