
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { domain } = await req.json().catch(() => ({ domain: null }));

        // Fetch questions
        // Note: We select specific fields to exclude 'correct_option_id' for security
        let query = supabase
            .from("questions")
            .select("id, question_text, options, domain, difficulty, skill_tag");

        if (domain) {
            query = query.eq("domain", domain);
        }

        const { data: questions, error } = await query;

        if (error) {
            throw error;
        }

        if (!questions || questions.length === 0) {
            return new Response(
                JSON.stringify({ error: "No questions found" }),
                { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Shuffle and pick 15
        const shuffled = questions.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 15);

        return new Response(
            JSON.stringify({ questions: selected }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error) {
        console.error("Error fetching questions:", error);
        return new Response(
            JSON.stringify({ error: "Internal Server Error" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
