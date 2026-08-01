import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import nodemailer from "npm:nodemailer";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Edge Function started (using nodemailer)");
    const smtpUser = Deno.env.get("SMTP_USER") || Deno.env.get("VITE_SMTP_USER");
    const smtpPass = Deno.env.get("SMTP_PASS") || Deno.env.get("VITE_SMTP_PASS");

    if (!smtpUser || !smtpPass) {
      console.error("Missing SMTP credentials");
      return new Response(
        JSON.stringify({ error: "SMTP credentials (SMTP_USER/SMTP_PASS) are not set in Edge Function secrets" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: EmailRequest = await req.json();
    const { to, subject, html, from } = body;
    console.log(`Sending email to: ${to}, subject: ${subject}`);

    // Create nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // Use SSL/TLS
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    // Send email
    const info = await transporter.sendMail({
      from: from || smtpUser,
      to: Array.isArray(to) ? to.join(", ") : to,
      subject: subject,
      html: html,
    });
    
    console.log("Email sent successfully:", info.messageId);

    return new Response(
      JSON.stringify({ message: "Email sent successfully via Gmail SMTP (nodemailer)", messageId: info.messageId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Edge Function error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});



