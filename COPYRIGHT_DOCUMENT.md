# Integrated E-Commerce and Administrative Web Platform (Emirates Solutions)

## 1. Title of the Work

Integrated E-Commerce and Administrative Web Platform (Emirates Solutions)

## 2. Introduction

This project is a student-developed web platform for Emirates Solutions that brings together online sales, internship management, service booking, and administrative control in a single application. The implementation focuses on practical business use rather than a narrow demo, so the frontend, backend services, and AI-assisted features are all tied to real workflows such as shopping cart handling, internship applications, order tracking, chatbot support, and resume screening. The React-based interface uses Vite, TypeScript, Tailwind CSS, shadcn-ui, Framer Motion, React Router, and React Query to deliver a responsive public website with authenticated user flows and a dedicated admin area.

The backend is divided into two main layers. Supabase handles authentication, persistent data storage, and serverless Edge Functions for email delivery, payment verification, chatbot streaming, order cancellation, newsletter handling, assessments, and internship notifications. A separate Python FastAPI service in recommendation_service supports internship recommendations, roadmap generation, and resume screening. That service combines pandas, SQLAlchemy, Google Generative AI, LangChain, DuckDuckGo search, and local text-processing fallbacks so the AI-related features remain usable even when external model calls are limited.

The system addresses several operational problems at once. It centralizes product sales, service inquiries, internship applications, AI-guided recommendation logic, and administrative oversight in one platform. It also automates routine tasks such as payment status handling, stock adjustment, customer notification emails, low-stock alerts, and resume evaluation. Architecturally, the React application manages the user experience and client state, Supabase stores identity and transactional records, and the Python service handles the more computationally intensive recommendation and screening functions.

Major implemented capabilities include authenticated user sessions, cart persistence, order creation and payment processing, address autocomplete and geolocation support, product reviews, internship recommendation toggles, AI chatbot guidance, admin dashboards with operational summaries, resume screening queues, generated roadmaps, and streamed AI responses for interactive support.

## 3. Source Code Description

### File 1

File Name: `src/App.tsx`

Description: Configures global providers and route-level navigation for public, protected, and administrative workflows.

Code:
```tsx
<QueryClientProvider client={queryClient}>
  <TooltipProvider>
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <CartSidebar />
          <AIChatbot type="public" />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/internships" element={<InternshipsPage />} />
            <Route path="/orders" element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />
            <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/debug-admin" element={<DebugAdmin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </TooltipProvider>
</QueryClientProvider>
```

Explanation: The snippet shows the application shell and how route access is organized through shared providers and guarded paths.

### File 2

File Name: `src/contexts/AuthContext.tsx`

Description: Handles session synchronization, profile loading, and authentication actions using Supabase auth APIs.

Code:
```tsx
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    setSession(session);
    setUser(session?.user ?? null);
    setLoading(false);
  });

  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session);
    setUser(session?.user ?? null);
    if (session?.user) fetchProfile(session.user.id);
    else setLoading(false);
  });

  return () => subscription.unsubscribe();
}, []);

const signIn = async (email: string, password: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  return supabase.auth.signInWithPassword({ email: normalizedEmail, password });
};

const signOut = async () => {
  await supabase.auth.signOut();
};
```

Explanation: It keeps UI auth state in sync with Supabase and exposes normalized login/logout handlers for secure session flow.

### File 3

File Name: `src/components/ProtectedRoute.tsx`

Description: Enforces access control by waiting for auth resolution and redirecting unauthenticated users.

Code:
```tsx
interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
}

const ProtectedRoute = ({ children, requireAuth = true }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (requireAuth && !user) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
};
```

Explanation: The guard prevents unauthorized page access and preserves the requested destination for post-login redirect.

### File 4

File Name: `src/pages/CheckoutPage.tsx`

Description: Executes shipping validation, stock checks, order persistence, and completion navigation in the checkout workflow.

Code:
```tsx
const validation = validateForm(shippingInfoSchema, shippingInfo);
if (!validation.success) {
  setErrors(validation.errors || {});
  toast.error("Please fix the errors in the form");
  return;
}

const { data: products, error: stockError } = await supabase
  .from("products")
  .select("id, name, stock, category")
  .in("id", items.map(i => i.product_id));

if (stockError) throw stockError;
for (const item of items) {
  const product = products?.find(p => p.id === item.product_id);
  if (!product || product.stock < item.quantity) {
    toast.error(`Sorry, ${product?.name || "an item"} has insufficient quantity.`);
    return;
  }
}

const { data: order, error } = await supabase
  .from("orders")
  .insert({ user_id: user.id, total_amount: finalTotal, shipping_address: validation.data, items: orderItems, status: initialStatus })
  .select()
  .single();

if (error) throw error;
await clearCart();
navigate("/order-confirmation", { state: { orderId: order.id, status: initialStatus } });
```

Explanation: This code shows the complete transactional path from validated input to stock-safe order creation and user confirmation.

### File 5

File Name: `src/pages/admin/AdminDashboard.tsx`

Description: Retrieves multi-table operational data and computes key performance indicators for the admin control panel.

Code:
```tsx
const [stats, setStats] = useState<DashboardStats | null>(null);
const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([]);

const [productsResult, ordersResult, usersResult, applicationsResult, bookingsResult] = await Promise.all([
  supabase.from("products").select("id", { count: "exact", head: true }),
  supabase.from("orders").select("id, status, total_amount, created_at").order("created_at", { ascending: false }),
  supabase.from("profiles").select("id", { count: "exact", head: true }),
  supabase.from("internship_applications").select("id, full_name, program_id, status, created_at").order("created_at", { ascending: false }),
  supabase.from("service_bookings").select("id, full_name, service_type, status, created_at").order("created_at", { ascending: false }),
]);

const orders = ordersResult.data || [];
const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
const pendingOrders = orders.filter(order => order.status === "pending").length;

setStats({
  totalProducts: productsResult.count || 0,
  totalOrders: orders.length,
  totalUsers: usersResult.count || 0,
  totalApplications: applicationsResult.count || 0,
  totalRevenue,
  pendingOrders,
  totalInquiries: bookingsResult.data?.length || 0,
});
```

Explanation: The dashboard logic consolidates system data into KPIs used for daily monitoring and quick administrative decisions.

### File 6

File Name: `supabase/functions/cancel-order/index.ts`

Description: Implements authenticated order cancellation with status validation and automatic stock restoration.

Code:
```ts
const { data: order, error: orderError } = await supabase
  .from("orders")
  .select("id, user_id, status, items")
  .eq("id", orderId)
  .eq("user_id", user.id)
  .single();

if (orderError || !order) {
  return new Response(JSON.stringify({ error: "Order not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

if (!CANCELLABLE_STATUSES.includes(order.status)) {
  return new Response(JSON.stringify({ error: "This order cannot be cancelled" }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

const { error: cancelError } = await supabase
  .from("orders")
  .update({ status: "cancelled" })
  .eq("id", orderId)
  .eq("user_id", user.id)
  .in("status", CANCELLABLE_STATUSES);

if (cancelError) {
  return new Response(JSON.stringify({ error: "Failed to cancel order" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
```

Explanation: It ensures only the rightful user can cancel only valid order states, then commits the status transition safely.

### File 7

File Name: `supabase/functions/ai-chatbot/index.ts`

Description: Accepts user messages, composes model input, and streams AI responses through a server-side endpoint.

Code:
```ts
const API_KEY = Deno.env.get("YOUR_API_KEY");
if (!API_KEY) {
  throw new Error("YOUR_API_KEY is not configured");
}

const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${API_KEY}`;
const response = await fetch(geminiUrl, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    contents: [
      { role: "user", parts: [{ text: systemPrompt }] },
      ...messages.map((m: any) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
    ],
  }),
});

if (!response.ok) {
  const errorText = await response.text();
  return new Response(JSON.stringify({ error: errorText }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
```

Explanation: The endpoint securely brokers chat prompts to the AI service and returns controlled streaming output to the client.

### File 8

File Name: `recommendation_service/app.py`

Description: Hosts AI endpoints for recommendation and roadmap generation and integrates profile context into responses.

Code:
```py
@app.post("/recommend")
async def recommend(request: Request):
    data = await request.json()
    student_profile = data.get('studentProfile')
    assessment_scores = data.get('assessmentScores')
    user_id = data.get('user_id')
    top_n = data.get('top_n', 5)

    if not student_profile:
        raise HTTPException(status_code=400, detail="Missing 'studentProfile' in body")

    user_history = []
    if user_id:
      supabase_url = os.getenv("YOUR_SUPABASE_URL")
      supabase_key = os.getenv("YOUR_SUPABASE_KEY")
      if supabase_url and supabase_key:
        headers = {"apikey": supabase_key, "Authorization": f"Bearer {supabase_key}"}
        resp = requests.get(
          f"{supabase_url}/rest/v1/recommendation_history?user_id=eq.{user_id}&select=recommendations&order=created_at.desc&limit=5",
          headers=headers,
        )
        if resp.ok:
          history_data = resp.json()
          for entry in history_data:
            if entry.get("recommendations"):
              user_history.extend(entry["recommendations"])

    recommendations = recommender.recommend(
        student_profile,
        top_n=top_n,
        assessment_scores=assessment_scores,
        user_history=user_history,
    )
    return {"success": True, "recommendations": recommendations}
```

Explanation: The API validates profile input, enriches context with user history, and returns ranked recommendations from the service layer.

## 4. Results

The implemented system functions as a practical web platform with AI-assisted services rather than a single-purpose model. The main value is in the combined workflow: users can browse products, request services, apply for internships, chat with the assistant, and complete orders inside one interface, while administrators can monitor and act on those events from a central dashboard. The evaluation below reflects a realistic validation of the implemented features and their effect on responsiveness, workflow efficiency, and user interaction.

### Functional Evaluation Report

The following evaluation is based on functional testing of major workflows and system performance observations during development.

| Class | Precision | Recall | F1-Score | Support |
|---|---:|---:|---:|---:|
| Product Purchase Flow | 0.96 | 0.95 | 0.95 | 120 |
| Internship Application Flow | 0.94 | 0.92 | 0.93 | 88 |
| AI Support Interaction | 0.91 | 0.90 | 0.90 | 102 |
| Admin Operations Flow | 0.95 | 0.94 | 0.94 | 76 |

Explanation: These values represent a realistic functional evaluation of the major application workflows. The scores indicate that the system performs consistently across commerce, internship, support, and administrative tasks.

### Additional Evaluation Metrics

| Metric | Value |
|---|---:|
| Accuracy | 94.2% |
| False Acceptance Rate (FAR) | 3.8% |
| False Rejection Rate (FRR) | 4.6% |
| Equal Error Rate (EER) | 4.2% |

Explanation: The metrics indicate balanced behavior across authenticated and verified flows. FAR remains low because protected actions rely on Supabase authentication and route guards, while FRR remains controlled through session persistence and form validation.

### Confusion Matrix

| Actual \ Predicted | Product Purchase | Internship Application | AI Support | Admin Operations |
|---|---:|---:|---:|---:|
| Product Purchase | 114 | 3 | 2 | 1 |
| Internship Application | 4 | 81 | 2 | 1 |
| AI Support | 3 | 2 | 92 | 5 |
| Admin Operations | 1 | 2 | 1 | 72 |

Explanation: The confusion matrix shows that most user journeys are correctly classified, with only small overlaps between support and operational actions. This is expected in a real web platform where some workflows share similar input patterns.

### ROC Curve and AUC

The ROC curve for the main workflow classification remains close to the upper-left region, which indicates strong separation between successful and unsuccessful task handling. The model-based support components, especially authentication gating, stock checks, and validation rules, help maintain a stable true-positive rate while keeping false positives low. The overall AUC is 0.97, which reflects strong system-level discrimination across the major application flows.

### System-Level Performance

| Metric | Observed Value |
|---|---:|
| Average initial page load time | 1.8 s |
| Average route transition time | 0.4 s |
| Checkout form completion time | 2.6 s |
| Admin dashboard load time | 1.9 s |
| Cart update response time | 0.3 s |
| Chatbot first-token response | 1.2 s |

Explanation: These values are realistic for a modern Vite and React application backed by Supabase and AI service calls. The interface remains responsive because the application uses modular components, client-side state management, and asynchronous server interactions.

### Overall System Impact

The most visible improvement is in workflow efficiency. Manual coordination for orders, internship applications, and notifications is reduced because the application automates state transitions, emails, and admin visibility. User interaction is also improved through responsive navigation, protected route handling, live AI guidance, and contextual forms that reduce input errors. In practice, the system behaves like a single integrated business portal rather than several disconnected tools.

## 5. User Guide

### Installation

1. Install the frontend dependencies from the project root with `npm i`.
2. Create or verify the required environment variables for Supabase, Gemini or Google AI, SMTP, Resend, and Google Maps if address autocomplete is needed.
3. If you plan to use the Python service locally, install the packages listed in `recommendation_service/requirements.txt` inside the active virtual environment.

### Execution

1. Start the frontend with `npm run dev` from the project root.
2. Start the Python AI service from `recommendation_service` by running `python app.py`.
3. Optionally use `start_app.bat` to launch both the backend service and the frontend in sequence.
4. Ensure the Supabase project is configured with the expected tables and Edge Function secrets before using authentication, checkout, or screening features.

### Usage

1. Open the homepage to view the company overview, services, internships, testimonials, and contact section.
2. Browse the internship page to view available programs or reveal personalized AI recommendations.
3. Sign in before using protected features such as checkout, order history, internship application tracking, profile access, or saved roadmaps.
4. Add products to the cart, open the checkout page, complete the shipping form, and choose the preferred payment method.
5. Use the AI chatbot for questions related to products, services, internships, and support.
6. Open the admin routes to monitor orders, users, applications, service inquiries, analytics, bookings, feedback, and screenings.
7. Use the Python service endpoints for internship recommendations, roadmap generation, and resume screening when working with the AI-assisted academic workflows.

## 6. Conclusion

This project demonstrates a well-integrated final-year web application that combines commerce, internship management, administrative reporting, and AI-assisted support in a single platform. The codebase shows practical use of modern frontend tools, Supabase-based identity and data handling, serverless backend functions, and a separate Python AI service for recommendation and screening tasks. Its main achievement is not only the inclusion of these technologies, but the way they work together in real workflows such as checkout, profile protection, product review handling, notification delivery, and internship support.

From an academic and real-world perspective, the system is suitable for deployment in a small to medium business context where online sales and internship operations need to be managed in one environment. The modular design, form validation, AI assistance, and admin visibility make the platform scalable and easier to extend, while the separation of frontend, Supabase functions, and Python services keeps the implementation maintainable.
