import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  applicationId: string;
  userId: string;
  applicantEmail: string;
  applicantName: string;
  newStatus: string;
  programName: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { applicationId, userId, applicantEmail, applicantName, newStatus, programName }: NotificationRequest = await req.json();

    console.log(`Sending notification for application ${applicationId} to user ${userId}`);

    // Create status-specific messages
    let title = "";
    let message = "";
    let notificationType = "info";

    switch (newStatus) {
      case "reviewing":
        title = "Application Under Review";
        message = `Great news, ${applicantName}! Your application for ${programName} is now being reviewed by our team. We'll notify you once a decision is made.`;
        notificationType = "info";
        break;
      case "accepted":
        title = "Congratulations! Application Accepted 🎉";
        message = `Congratulations, ${applicantName}! We're thrilled to inform you that your application for ${programName} has been accepted. Our team will contact you shortly with next steps.`;
        notificationType = "success";
        break;
      case "rejected":
        title = "Application Update";
        message = `Dear ${applicantName}, Thank you for your interest in ${programName}. After careful consideration, we regret to inform you that we cannot proceed with your application at this time. We encourage you to apply again in the future.`;
        notificationType = "warning";
        break;
      default:
        title = "Application Status Updated";
        message = `Your application for ${programName} status has been updated to: ${newStatus}`;
        notificationType = "info";
    }

    // Insert notification into database
    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        title,
        message,
        type: notificationType,
        reference_id: applicationId,
        reference_type: "internship_application",
      });

    if (notificationError) {
      console.error("Error inserting notification:", notificationError);
      throw notificationError;
    }

    console.log("In-app notification created successfully");

    // Check if RESEND_API_KEY is configured for email notifications
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (resendApiKey) {
      console.log("Sending email notification via Resend...");
      
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
            .status-reviewing { background: #e3f2fd; color: #1565c0; }
            .status-accepted { background: #e8f5e9; color: #2e7d32; }
            .status-rejected { background: #fff3e0; color: #e65100; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Emirates Solutions</h1>
              <p>Internship Application Update</p>
            </div>
            <div class="content">
              <h2>${title}</h2>
              <p>${message}</p>
              <p><strong>Program:</strong> ${programName}</p>
              <span class="status-badge status-${newStatus}">${newStatus.toUpperCase()}</span>
              <p style="margin-top: 20px;">If you have any questions, please don't hesitate to contact us.</p>
              <p>Best regards,<br>Emirates Solutions Team</p>
            </div>
            <div class="footer">
              <p>Emirates Solutions Pvt Ltd | Ratnagiri, Maharashtra, India</p>
              <p>📞 +91 98765 43210 | ✉️ info@esrtn.in</p>
            </div>
          </div>
        </body>
        </html>
      `;

      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Emirates Solutions <notifications@esrtn.in>",
            to: [applicantEmail],
            subject: title,
            html: emailHtml,
          }),
        });

        const emailResult = await emailResponse.json();
        
        if (!emailResponse.ok) {
          console.error("Email sending failed:", emailResult);
        } else {
          console.log("Email sent successfully:", emailResult);
        }
      } catch (emailError) {
        console.error("Error sending email:", emailError);
        // Don't throw - we still want to return success for the in-app notification
      }
    } else {
      console.log("RESEND_API_KEY not configured - skipping email notification");
    }

    return new Response(
      JSON.stringify({ success: true, message: "Notification sent" }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error: unknown) {
    console.error("Error in send-application-notification:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
