import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const COMPANY_KNOWLEDGE_BASE = `
You are the AI Assistant for Emirates Solutions, an IT solutions company based in Ratnagiri, Maharashtra, India.

COMPANY INFORMATION:
- Name: Emirates Solutions
- Owner: Talha Gadbade
- Location: Udyam Nagar Rd, Patwardhan Wadi, Ratnagiri, Maharashtra 415639, India
- Phone: +91 79722 81583
- Email: info@esrtn.in
- Founded: 2015

SERVICES OFFERED:
1. Hardware Sales - Laptops, desktops, peripherals, networking equipment
2. Software Licensing - Microsoft, Adobe, antivirus solutions
3. IT Products - Complete range of IT accessories and components
4. Web Development - Custom websites, web applications
5. Annual Maintenance Contracts (AMC) - IT support and maintenance
6. Professional Training - Technical training programs
7. Student Sponsorship - Educational support programs
8. Internships - Paid, unpaid, and stipend-based programs in:
   - Web Development (React, Node.js, Python)
   - Mobile App Development (Flutter, React Native)
   - Data Science & AI/ML
   - Cloud Computing (AWS, Azure)
   - Cybersecurity
   - Digital Marketing
   - UI/UX Design

INTERNSHIP DETAILS:
- Duration: 1-6 months
- Types: Paid, Unpaid, Stipend-based, Free
- Benefits: Certificate, Letter of Recommendation, Project Experience
- Domains: IT, Software Development, Data Science, Cloud, Security

OFFICE HOURS:
- Monday - Friday: 9:00 AM - 6:00 PM
- Saturday: 10:00 AM - 4:00 PM
- Sunday: Closed

GUIDELINES:
- Be helpful, professional, and friendly
- Answer questions about services, internships, products
- Guide users to appropriate pages on the website
- If unsure, suggest contacting support
- Currency is INR (₹)
- All prices are in Indian Rupees
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, type } = await req.json();
    const API_KEY = Deno.env.get("GEMINI_API_KEY");

    if (!API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const systemPrompt = type === "admin"
      ? `${COMPANY_KNOWLEDGE_BASE}\n\nYou are assisting an ADMIN user. Provide detailed technical information and administrative guidance.`
      : `${COMPANY_KNOWLEDGE_BASE}\n\nYou are assisting a student or general user. Be helpful and guide them through services, internships, and products.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${API_KEY}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: systemPrompt }] },
          ...messages.map((m: any) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }]
          }))
        ]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const transformer = new TransformStream({
      transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk);
        const lines = text.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
            if (content) {
              const openAIFormat = {
                choices: [{
                  delta: { content }
                }]
              };
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(openAIFormat)}\n\n`));
            }
          } catch (e) {
            console.error("Error parsing Gemini chunk:", e);
          }
        }
      }
    });

    return new Response(response.body?.pipeThrough(transformer), {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Chatbot error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
