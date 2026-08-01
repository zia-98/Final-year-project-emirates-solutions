
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

        const { user_id, answers, cheat_logs } = await req.json();

        if (!user_id || !answers) {
            return new Response(
                JSON.stringify({ error: "Missing required fields" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 1. Fetch correct answers for all questions
        // Optimization: In a real app, fetch only IDs in 'answers', but for now fetch all
        const { data: allQuestions, error: qError } = await supabase
            .from("questions")
            .select("id, correct_option_id, domain, skill_tag");

        if (qError) throw qError;

        // 2. Grade the assessment
        let totalScore = 0;
        let maxScore = 0;
        const breakdown: Record<string, { correct: number; total: number; score: number }> = {};
        const detailedResults: any[] = [];

        // Create a map for quick lookup
        const questionMap = new Map(allQuestions.map(q => [q.id, q]));

        for (const ans of answers) {
            const question = questionMap.get(ans.question_id);
            if (!question) continue;

            const isCorrect = question.correct_option_id === ans.selected_option_id;

            // Update Total
            if (isCorrect) totalScore += 1; // 1 point per question
            maxScore += 1;

            // Update Breakdown (Domain-wise)
            const domain = question.domain;
            if (!breakdown[domain]) {
                breakdown[domain] = { correct: 0, total: 0, score: 0 };
            }
            breakdown[domain].total += 1;
            if (isCorrect) breakdown[domain].correct += 1;

            detailedResults.push({
                question_id: question.id,
                is_correct: isCorrect,
                domain: domain
            });
        }

        // Calculate percentages for breakdown
        for (const domain in breakdown) {
            breakdown[domain].score = (breakdown[domain].correct / breakdown[domain].total) * 100;
        }

        const finalPercentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

        // 3. Save User Assessment
        const { data: assessment, error: insertError } = await supabase
            .from("assessments")
            .insert({
                user_id,
                score_total: finalPercentage,
                score_breakdown: breakdown,
                status: 'completed',
                cheat_logs: cheat_logs || [],
            })
            .select()
            .single();

        if (insertError) throw insertError;

        return new Response(
            JSON.stringify({
                success: true,
                score: finalPercentage,
                breakdown,
                assessment_id: assessment.id
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error) {
        console.error("Error submitting assessment:", error);
        return new Response(
            JSON.stringify({ error: "Internal Server Error" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
