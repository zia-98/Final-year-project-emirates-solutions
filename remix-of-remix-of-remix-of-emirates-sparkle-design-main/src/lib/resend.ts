import { supabase } from "@/integrations/supabase/client";

const SENDER_EMAIL = "ziabhombal2536@gmail.com";

export interface EmailData {
  to: string | string[];
  subject: string;
  html: string;
}

export interface EmailResponse {
  success: boolean;
  data?: any;
  error?: any;
}

export const sendEmail = async ({ to, subject, html }: EmailData): Promise<EmailResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke("send-email", {
      body: {
        to: Array.isArray(to) ? to : [to],
        subject: subject,
        html: html,
        from: `Emirates Solutions <${SENDER_EMAIL}>`,
      },
    });

    if (error) {
      console.error("Error calling send-email function:", error);
      return { success: false, error };
    }

    console.log("Email sent successfully via Edge Function:", data);
    return { success: true, data };
  } catch (error: any) {
    console.error("Error sending email via Supabase function:", error);
    return { success: false, error: error.message };
  }
};

export const sendOTP = async (email: string, otp: string) => {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h2 style="color: #2563eb;">Verification Code</h2>
      <p>Hello,</p>
      <p>Your verification code for Emirates Solutions is:</p>
      <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1f2937; border-radius: 4px; margin: 20px 0;">
        ${otp}
      </div>
      <p>This code will expire in 10 minutes. If you didn't request this code, please ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="font-size: 12px; color: #6b7280; text-align: center;">Emirates Solutions Pvt Ltd | Ratnagiri, Maharashtra, India</p>
    </div>
  `;
  return sendEmail({ to: email, subject: "Your Verification Code", html });
};

export const sendOrderEmail = async (email: string, name: string, orderId: string, status: string, items: any[], total: number, currency: string = "INR") => {
  const statusMessages: Record<string, string> = {
    pending: "Your order has been placed successfully and is pending confirmation.",
    pending_payment: "Your order has been created and is awaiting payment confirmation.",
    cod_pending: "Your order has been placed successfully (Cash on Delivery) and is pending confirmation.",
    paid: "Your payment has been received and your order is being processed.",
    payment_failed: "Your payment attempt failed. Please try again or use a different payment method.",
    confirmed: "Your order has been confirmed and is being prepared.",
    processing: "Your order is currently being processed.",
    shipped: "Great news! Your order has been shipped.",
    delivered: "Your order has been delivered. We hope you enjoy your purchase!",
    cancelled: "Your order has been cancelled."
  };

  const currencySymbol = currency === "AED" ? "AED" : "₹";
  const EXCHANGE_RATE = 22.5;

  const itemsHtml = items.map(item => {
    const price = currency === "AED" ? (item.price / EXCHANGE_RATE).toFixed(2) : item.price;
    const itemTotal = currency === "AED" ? ((item.price * item.quantity) / EXCHANGE_RATE).toFixed(2) : (item.price * item.quantity);
    
    return `
      <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee;">
        <span>${item.product_name || 'Product'} (x${item.quantity})</span>
        <span style="font-weight: bold;">${currencySymbol}${itemTotal}</span>
      </div>
    `;
  }).join('');

  const displayTotal = currency === "AED" ? (total / EXCHANGE_RATE).toFixed(2) : total;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h2 style="color: #2563eb;">Order Update</h2>
      <p>Hi ${name || 'Customer'},</p>
      <p>${statusMessages[status] || `Your order status has been updated to: ${status}`}</p>
      
      <div style="margin: 20px 0; padding: 15px; background: #f9fafb; border-radius: 8px;">
        <p><strong>Order ID:</strong> ${orderId}</p>
        <p><strong>Status:</strong> <span style="text-transform: capitalize;">${status}</span></p>
      </div>

      <div style="margin: 20px 0;">
        <h3 style="font-size: 16px; border-bottom: 2px solid #2563eb; padding-bottom: 5px;">Order Summary</h3>
        ${itemsHtml}
        <div style="text-align: right; padding-top: 10px; font-size: 18px; font-weight: bold;">
          Total: ${currencySymbol}${displayTotal}
        </div>
      </div>

      <p>If you have any questions, please reply to this email.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="font-size: 12px; color: #6b7280; text-align: center;">Emirates Solutions Pvt Ltd | Ratnagiri, Maharashtra, India</p>
    </div>
  `;
  return sendEmail({ to: email, subject: `Order ${status.charAt(0).toUpperCase() + status.slice(1)}: #${orderId.slice(0, 8)}`, html });
};

export const sendInternshipEmail = async (email: string, name: string, program: string, type: 'submitted' | 'accepted' | 'rejected' | 'reviewing') => {
  const templates = {
    submitted: {
      subject: `Application Received: ${program}`,
      title: "Application Received",
      message: `Thank you for applying to the <strong>${program}</strong> internship program. We have received your application and our team is currently reviewing it.`
    },
    accepted: {
      subject: `Congratulations! You're Shortlisted for ${program}`,
      title: "Congratulations! 🎉",
      message: `We are thrilled to inform you that you have been <strong>shortlisted</strong> for the <strong>${program}</strong> internship program! Our team was impressed with your profile.`
    },
    rejected: {
      subject: `Update regarding your application for ${program}`,
      title: "Application Update",
      message: `Thank you for your interest in the ${program} internship. After careful consideration, we regret to inform you that we cannot proceed with your application at this time.`
    },
    reviewing: {
      subject: `Application Under Review: ${program}`,
      title: "Application Under Review",
      message: `Great news! Your application for the <strong>${program}</strong> internship program is now being reviewed by our team. We will update you as soon as a decision is reached.`
    }
  };

  const template = templates[type];
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h2 style="color: #2563eb;">${template.title}</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>${template.message}</p>
      <p><strong>Program:</strong> ${program}</p>
      <p>You can track your application status in your dashboard.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="font-size: 12px; color: #6b7280; text-align: center;">Emirates Solutions Pvt Ltd | Ratnagiri, Maharashtra, India</p>
    </div>
  `;
  return sendEmail({ to: email, subject: template.subject, html });
};

// Admin Notification Functions
export const sendAdminNotification = async (subject: string, html: string) => {
  return sendEmail({ to: SENDER_EMAIL, subject: `[ADMIN ALERT] ${subject}`, html });
};

export const sendAdminNewOrder = async (order: any) => {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h2 style="color: #10b981;">New Order Received!</h2>
      <p>A new order has been placed on the platform.</p>
      <div style="margin: 20px 0; padding: 15px; background: #f0fdf4; border-radius: 8px; border: 1px solid #bbf7d0;">
        <p><strong>Order Number:</strong> ${order.order_number || order.id}</p>
        <p><strong>Customer:</strong> ${order.shipping_address?.fullName} (${order.shipping_address?.email})</p>
        <p><strong>Total Amount:</strong> ${order.currency === 'AED' ? 'AED' : '₹'}${order.total_amount}</p>
      </div>
      <p><a href="https://emirates-solutions.com/admin/orders" style="color: #10b981; font-weight: bold;">View Order in Admin Dashboard</a></p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="font-size: 12px; color: #6b7280; text-align: center;">Automated System Alert | Emirates Solutions</p>
    </div>
  `;
  return sendAdminNotification(`New Order: #${(order.order_number || order.id).slice(0, 8)}`, html);
};

export const sendAdminNewApplication = async (application: any, programTitle: string) => {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h2 style="color: #6366f1;">New Internship Application!</h2>
      <p>A new candidate has applied for an internship.</p>
      <div style="margin: 20px 0; padding: 15px; background: #eef2ff; border-radius: 8px; border: 1px solid #e0e7ff;">
        <p><strong>Program:</strong> ${programTitle}</p>
        <p><strong>Applicant:</strong> ${application.full_name || 'Candidate'}</p>
        <p><strong>Email:</strong> ${application.email}</p>
      </div>
      <p><a href="https://emirates-solutions.com/admin/internships" style="color: #6366f1; font-weight: bold;">Review Application in Admin Dashboard</a></p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="font-size: 12px; color: #6b7280; text-align: center;">Automated System Alert | Emirates Solutions</p>
    </div>
  `;
  return sendAdminNotification(`New Application: ${programTitle}`, html);
};

export const sendAdminLowStock = async (product: any) => {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h2 style="color: #ef4444;">⚠️ Low Stock Alert!</h2>
      <p>Inventory for a product is running low.</p>
      <div style="margin: 20px 0; padding: 15px; background: #fef2f2; border-radius: 8px; border: 1px solid #fecaca;">
        <p><strong>Product:</strong> ${product.name}</p>
        <p><strong>Current Stock:</strong> <span style="color: #ef4444; font-weight: bold;">${product.stock}</span></p>
        <p><strong>Category:</strong> ${product.category}</p>
      </div>
      <p><a href="https://emirates-solutions.com/admin/products" style="color: #ef4444; font-weight: bold;">Update Stock in Admin Dashboard</a></p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="font-size: 12px; color: #6b7280; text-align: center;">Automated System Alert | Emirates Solutions</p>
    </div>
  `;
  return sendAdminNotification(`Low Stock Alert: ${product.name}`, html);
};

export const sendAdminNewServiceBooking = async (booking: any) => {
  const serviceType = booking.service_type || booking.serviceType || "Software Solution";
  const fullName = booking.full_name || booking.fullName || "Valued Client";
  const phone = booking.phone || "Not provided";
  const email = booking.email || "No email";
  const brief = booking.brief || "No brief provided";

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h2 style="color: #6366f1; margin-top: 0;">New Service Booking Request!</h2>
      <p>A new service inquiry has been submitted from the Software Solutions page.</p>
      <div style="margin: 20px 0; padding: 15px; background: #eef2ff; border-radius: 8px; border: 1px solid #e0e7ff;">
        <p style="margin: 5px 0;"><strong>Service Type:</strong> ${serviceType}</p>
        <p style="margin: 5px 0;"><strong>Client Name:</strong> ${fullName}</p>
        <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
        <p style="margin: 5px 0;"><strong>Phone:</strong> ${phone}</p>
        <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #e0e7ff;">
          <p><strong>Project Brief:</strong></p>
          <p style="white-space: pre-wrap; font-style: italic; color: #4b5563;">${brief}</p>
        </div>
      </div>
      <p><a href="https://emirates-solutions.com/admin/bookings" style="display: inline-block; padding: 10px 20px; background: #6366f1; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Manage Bookings</a></p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="font-size: 11px; color: #9ca3af; text-align: center;">Automated Tracking | Ref: ${Date.now()}</p>
    </div>
  `;
  return sendAdminNotification(`New Service Inquiry: ${serviceType}`, html);
};

export const sendAdminNewFeedback = async (feedback: any) => {
  const rating = feedback.rating || 0;
  const category = feedback.category || "General";
  const comment = feedback.comment || "No comment provided";
  const nps = feedback.nps_score ?? "N/A";
  const userEmail = feedback.user_email || "Guest User";

  const stars = "⭐".repeat(rating) + "☆".repeat(5 - rating);

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h2 style="color: #ec4899; margin-top: 0;">New User Feedback Received!</h2>
      <p>A user has just completed the feedback questionnaire.</p>
      
      <div style="margin: 20px 0; padding: 15px; background: #fdf2f8; border-radius: 8px; border: 1px solid #fbcfe8;">
        <p style="margin: 5px 0;"><strong>Overall Rating:</strong> <span style="font-size: 18px;">${stars}</span> (${rating}/5)</p>
        <p style="margin: 5px 0;"><strong>Category:</strong> ${category}</p>
        <p style="margin: 5px 0;"><strong>Recommendation (NPS):</strong> ${nps}/10</p>
        <p style="margin: 5px 0;"><strong>User:</strong> ${userEmail}</p>
        
        <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #fbcfe8;">
          <p><strong>Detailed Comment:</strong></p>
          <p style="white-space: pre-wrap; font-style: italic; color: #4b5563;">"${comment}"</p>
        </div>
      </div>
      
      <p><a href="https://emirates-solutions.com/admin/feedback" style="display: inline-block; padding: 10px 20px; background: #ec4899; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Analyze Feedback in Dashboard</a></p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="font-size: 11px; color: #9ca3af; text-align: center;">Customer Success Tracking | Emirates Solutions</p>
    </div>
  `;
  return sendAdminNotification(`New Feedback: ${rating} Stars - ${category}`, html);
};

export const sendAdminNewContact = async (contact: any) => {
  const name = contact.name || "Interested User";
  const email = contact.email || "No email provided";
  const phone = contact.phone || "No phone provided";
  const subject = contact.subject || "General Inquiry";
  const message = contact.message || "No message content";

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h2 style="color: #2563eb; margin-top: 0;">New Contact Form Submission!</h2>
      <p>A user has just reached out via the "Get in Touch" form on the website.</p>
      
      <div style="margin: 20px 0; padding: 15px; background: #eff6ff; border-radius: 8px; border: 1px solid #dbeafe;">
        <p style="margin: 5px 0;"><strong>Name:</strong> ${name}</p>
        <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
        <p style="margin: 5px 0;"><strong>Phone:</strong> ${phone}</p>
        <p style="margin: 15px 0 5px 0;"><strong>Subject:</strong></p>
        <p style="margin: 0; font-weight: bold;">${subject}</p>
        
        <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #dbeafe;">
          <p><strong>Message:</strong></p>
          <p style="white-space: pre-wrap; font-style: italic; color: #4b5563;">"${message}"</p>
        </div>
      </div>
      
      <p style="font-size: 11px; color: #9ca3af; text-align: center;">Lead Generation Tracking | Emirates Solutions</p>
    </div>
  `;
  return sendAdminNotification(`New Contact: ${subject}`, html);
};
export const sendAdminInternshipStockAlert = async (program: any) => {
  const isOut = (program.available_slots || 0) <= 0;
  const statusLabel = isOut ? "EXHAUSTED" : "LOW";
  const color = isOut ? "#ef4444" : "#f59e0b";

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h2 style="color: ${color};">⚠️ Internship Slot Alert: ${statusLabel}</h2>
      <p>The available slots for an internship program have reached a critical level.</p>
      <div style="margin: 20px 0; padding: 15px; background: ${isOut ? '#fef2f2' : '#fffbeb'}; border-radius: 8px; border: 1px solid ${isOut ? '#fecaca' : '#fef3c7'};">
        <p><strong>Program:</strong> ${program.title}</p>
        <p><strong>Remaining Slots:</strong> <span style="color: ${color}; font-weight: bold;">${program.available_slots}</span> / ${program.total_slots || 10}</p>
      </div>
      <p><a href="https://emirates-solutions.com/admin/internships" style="color: ${color}; font-weight: bold;">Manage Slots in Admin Dashboard</a></p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="font-size: 11px; color: #9ca3af; text-align: center;">Inventory Management System | Emirates Solutions</p>
    </div>
  `;
  return sendAdminNotification(`Internship Slot ${statusLabel}: ${program.title}`, html);
};
