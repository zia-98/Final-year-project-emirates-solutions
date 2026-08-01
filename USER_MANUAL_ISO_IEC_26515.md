## Appendix

### A1: User Manual (ISO/IEC 26515-Compliant)

### A.1.1 Introduction

This application is a full-stack platform that combines internship services, IT product and service workflows, and AI-enabled utilities for recommendation, roadmap generation, and resume screening.

The platform supports three primary user groups:
1. Students and general users, who can register, apply for internships, track application status, generate personalized roadmaps, place and track orders, and manage profiles.
2. Business users and customers, who can browse services/products, submit service bookings, and complete checkout workflows.
3. Administrators, who manage users, internships, product inventory, orders, service bookings, newsletter subscriptions, analytics, and AI resume screening.

The system is modular and consists of:
1. Frontend Web Application (React + Vite + TypeScript): user interface, routing, authentication flows, dashboards, and operational screens.
2. Backend AI Service (FastAPI + Python): recommendation engine, roadmap generation API, resume screening API, and screening result export.
3. Data and Identity Layer (Supabase): authentication, profile storage, application/order/service data, notifications, and realtime updates.
4. Admin Operations Module: role-based business operations, status updates, and operational monitoring.

### A.1.2 System Installation Guide

#### System Requirements

##### For User Application
1. Operating System: Windows 10/11, macOS 12+, or Linux (modern distribution).
2. RAM: Minimum 4 GB (recommended 8 GB for smooth browser and AI feature usage).
3. Storage: Minimum 2 GB free disk space for dependencies, logs, and runtime data.
4. Browser: Latest Google Chrome, Microsoft Edge, or Firefox.
5. Network: Internet required for Supabase services, external APIs, and payment/chat integrations.

##### For Development Environment
1. Node.js: v18 or later (with npm).
2. Python: v3.10 or later (recommended v3.11) for recommendation_service.
3. Frontend stack: Vite, React, TypeScript, Tailwind CSS, shadcn-ui.
4. Backend stack: FastAPI, Uvicorn, SQLAlchemy, Pandas, scikit-learn, Google Generative AI libraries.
5. Database/Backend-as-a-Service: Supabase project (URL and anon/public key required).
6. Optional third-party services for full feature coverage:
   - Google API key (Gemini / Maps features)
   - Razorpay (payment workflow)
   - Supabase Edge Functions for email and notification automations

### A.1.2 Setup Guide

#### Step 1: Clone Repository

Use the repository remote configured in this project:

```bash
git clone https://github.com/zia-98/Final-year-project-emirates-solutions.git
cd Final-year-project-emirates-solutions
```

If your local folder name differs, use that folder in subsequent commands.

#### Step 2: Backend Setup

1. Navigate to backend service:

```bash
cd recommendation_service
```

2. Create and activate a virtual environment:

```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# Linux/macOS
source .venv/bin/activate
```

3. Install backend dependencies:

```bash
pip install -r requirements.txt
```

4. Create environment file at recommendation_service/.env:

```env
# Required for AI/LLM features
GOOGLE_API_KEY=your_google_api_key
# Optional alternative key reference used in some modules
GEMINI_API_KEY=your_gemini_api_key

# Used when backend reads recommendation history from Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_or_anon_key

# Optional operational fields (not mandatory in current app.py runtime)
PORT=5001
DB_URL=sqlite:///./screening.db
JWT_SECRET=your_jwt_secret_if_used_in_custom_extensions
```

Note: The default backend port in code is currently 5001 (app.py starts uvicorn on port 5001).

5. Run backend server:

```bash
python app.py
```

The backend health endpoint is:

```text
http://127.0.0.1:5001/health
```

#### Step 3: Frontend Setup

1. Open a second terminal and navigate to project root:

```bash
cd ..
```

2. Install frontend dependencies:

```bash
npm install
```

3. Create environment file at project root .env (or .env.local):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI chatbot (Gemini) and optional generic key fallback
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_GOOGLE_API_KEY=your_google_api_key

# Google Maps Places Autocomplete support in checkout
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

4. Run frontend:

```bash
npm run dev
```

5. Open the URL shown by Vite (typically http://localhost:5173).

Optional (Windows): you can also use start_app.bat to launch backend and frontend together.

### A.1.4 User Application Guide

#### A.1.4.1 Registration & Login

1. Open the Auth page.
2. Select Sign Up.
3. Enter full name (minimum two words), username, Gmail address, and a strong password.
4. Verify password confirmation.
5. Submit sign-up form.
6. Enter verification code sent via email on the verify-email screen.
7. After verification, sign in with email and password.
8. For existing users, use Login directly.
9. For forgotten passwords, use the reset password flow from login.

Important behavior:
1. Signup currently enforces Gmail domain validation.
2. Password policy requires uppercase, lowercase, number, special character, and minimum length.
3. Admin users are redirected to admin area after authentication.

#### A.1.4.2 Dashboard / Main Features

Main functional areas for users include:
1. Internship discovery and application workflows.
2. AI roadmap generation and saved roadmap viewing.
3. Product/service browsing and order checkout.
4. Application tracking and order tracking with status progression.
5. Profile management with resume storage.
6. AI chatbot assistance for common company/service/internship queries.
7. Notification center (for status updates).

#### A.1.4.3 Main Operations

Core user operations are:
1. Internship Application:
   - Browse internships.
   - Open application form.
   - Fill personal, educational, preference, motivation, and availability details.
   - Upload resume (PDF/DOC/DOCX, max 5 MB).
   - Submit and receive confirmation.

2. Application Integrity Rules:
   - Duplicate application to the same program is blocked.
   - If an existing application is pending/reviewing, new application submission is blocked until completion.

3. AI Roadmap Operation:
   - From application tracking, generate roadmap per program.
   - Generated roadmap is saved and can be reopened.
   - If backend AI is unavailable, fallback roadmap content is generated.

4. Checkout and Ordering:
   - Add products to cart.
   - Enter shipping details (manual or assisted location input).
   - Select payment method.
   - Place order and receive order ID/confirmation.

5. Service Booking:
   - Users submit service inquiry/bookings from service pages.
   - Booking enters admin-managed lifecycle.

#### A.1.4.4 Tracking / Status

Users can track multiple status pipelines:
1. Internship application statuses: pending, reviewing, accepted, rejected.
2. Order statuses: pending/cod_pending/pending_payment through confirmed, processing, shipped, delivered, or cancelled.
3. Real-time updates: order and internship records update through Supabase subscriptions.
4. Notifications: users can open notification bell, read latest alerts, and mark one/all as read.

#### A.1.4.5 Profile Management

Users can manage:
1. Full name, username, and phone number.
2. Resume upload/replacement in profile.
3. Resume retrieval through signed URL access.

Validation constraints:
1. Resume type must be PDF, DOC, or DOCX.
2. Resume size must be within 5 MB limit.

### A.1.5 Admin / Business Application Guide

#### A.1.5.1 Registration / Setup

Admin access is role-driven.
1. Sign in via normal authentication workflow.
2. Admin privilege is validated through role check (has_role RPC) and designated admin role records.
3. Existing admin can grant/revoke admin permissions from user management.

Practical setup options:
1. Use the provided SQL scripts under supabase for admin role assignment where needed.
2. Verify access by opening admin routes after login.

#### A.1.5.2 Data Management (products/users/etc.)

Admin data management capabilities include:
1. Products:
   - Create, edit, delete products.
   - Manage category, stock, pricing, and listing attributes.
   - Trigger low-stock administrative alert workflows.
2. Internships:
   - Create/edit/delete internship programs.
   - Manage categories/domains, slots, type (paid/stipend/free), and requirements.
3. Users:
   - View profiles and roles.
   - Create users via signup flow.
   - Update profile metadata.
   - Grant/revoke admin role.
4. Newsletter:
   - View all subscriptions.
   - Filter and export active subscribers.

#### A.1.5.3 Operations Management

Operational control flows:
1. Order operations:
   - View all orders.
   - Update order status.
   - Trigger user notifications and status emails.
2. Internship operations:
   - Review applications.
   - Update candidate status.
   - Trigger applicant email updates and application notifications.
3. Service booking operations:
   - Track inquiries.
   - Move bookings across status lifecycle (pending, confirmed, completed, cancelled).
4. Resume Screening Engine:
   - Define criteria.
   - Upload multiple resumes.
   - Trigger AI screening.
   - Monitor processing status.
   - Download ranked results CSV.

#### A.1.5.4 Analytics / Dashboard

Admin analytics module provides:
1. Total applications, total orders, revenue, and active users.
2. Applications by domain.
3. Orders by status.
4. Revenue trend by month.
5. Popular categories by volume.
6. User growth trend.
7. Recommendation activity trend (recent days).

Dashboard module also summarizes recent operational activity across orders, users, applications, and bookings.

#### A.1.5.5 Notifications

Notification channels include:
1. In-app notification records (database-backed) shown in notification bell UI.
2. Email notifications through Supabase Edge Function integration:
   - OTP verification emails
   - Order updates
   - Internship application updates
   - Admin alerts (new order/application/low stock/service booking/feedback)
3. Realtime change channels for admin tables (orders, applications, internships, users, bookings).

### A.1.6 Troubleshooting Common Errors

| Issue | Solution |
|---|---|
| Frontend fails at startup with missing Supabase env vars | Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are defined in frontend .env. Restart npm run dev after changes. |
| AI roadmap generation does not return dynamic results | Confirm backend is running on http://127.0.0.1:5001 and GOOGLE_API_KEY/GEMINI_API_KEY is set in recommendation_service/.env. |
| Resume screening API not responding | Start recommendation_service (python app.py), verify /health endpoint, and check dependency installation from requirements.txt. |
| Error: Failed to upload resume | Check file type (PDF/DOC/DOCX) and file size (<5 MB). Verify Supabase storage bucket permissions for resumes. |
| User cannot submit second internship application | System intentionally blocks duplicate program applications and new submissions while a previous application is pending/reviewing. Wait for status completion. |
| Google address autocomplete not working in checkout | Verify VITE_GOOGLE_MAPS_API_KEY and enable Places API + billing in Google Cloud. Manual address entry remains available. |
| Chatbot replies with connection error | Configure VITE_GEMINI_API_KEY or VITE_GOOGLE_API_KEY and ensure outbound internet access to Gemini endpoint. |
| Order status update notifications are missing | Confirm Supabase Edge Function send-email is deployed and accessible; verify user email fields in shipping data. |
| Admin page accessible but data empty | Confirm authenticated user has admin role and tables contain records. Also validate Supabase project keys and RLS policies. |
| Backend recommendation history fetch fails silently | Ensure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are set in backend .env (used by backend request to Supabase REST). |

### A.1.8 Compliance with ISO/IEC 26515

This user manual is structured to align with ISO/IEC 26515 principles by providing task-oriented guidance, clear role-based segmentation, consistent headings, and operationally verifiable procedures. The documentation emphasizes usability through sequential setup instructions, explicit prerequisites, actionable troubleshooting, and functional decomposition of user and admin workflows. It avoids ambiguous implementation claims and presents validated behavior from the current codebase to support clarity, maintainability, and practical software operation in academic and professional contexts.
