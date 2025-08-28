# AntiquaBid: Real‑Time Auction Platform

Author: <Your Name>
Supervisor: <Supervisor Name>
Department/Institution: <Department, University>
Date: <Month Year>

Abstract
- AntiquaBid is a web-based auction platform enabling real-time bidding for antiques.
- This report documents the system’s design, implementation, and evaluation, focusing on the admin analytics dashboard and the payment gateway refactor (eSewa integration).
- Key outcomes include modernized admin UI, dynamic data sourcing, improved payment UX, and stable backend endpoints.

Keywords: auctions, real-time bidding, analytics dashboard, eSewa, payments, React, Node.js

Acknowledgements
- <Optional acknowledgements>

1. Introduction
1.1 Background
- Online auctions require trustworthy payment processing and actionable admin analytics.

1.2 Problem Statement
- The prior admin dashboard used hardcoded data and lacked modern analytics, while payment selection was inconsistent and error-prone.

1.3 Objectives
- Refactor admin dashboard to a modern analytics layout using real, dynamic data.
- Replace “Quick Actions & System Status” with a practical “Reports & Moderation” panel.
- Fix payment provider selection UI to a dropdown, enforce eSewa-only, and ensure functional checkout.
- Make Recent Activity scrollable; ensure time range selector (7d/30d/90d) updates data and chart.

1.4 Scope and Limitations
- Scope: Admin dashboard UI/UX, data integration, payment gateway selection, eSewa flow.
- Limitations: Only eSewa is enabled; other providers (Khalti, Stripe) are disabled placeholders.

2. Literature Review
- Overview of real-time auction systems and payment integrations.
- UI/UX principles for admin analytics dashboards.
- Secure payment processing patterns (redirect flows, fee calculation, client/server responsibilities).

3. System Analysis and Design
3.1 Functional Requirements
- Admin views live KPIs, activity feed, reports/moderation queue, and performance charts.
- User completes payment via eSewa.

3.2 Non-Functional Requirements
- Usability: clean, card-based design; responsive UI.
- Reliability: stable API calls; fee computation fallback.
- Performance: efficient queries; range-based data retrieval.

3.3 Architecture Overview
- Frontend: React + Vite + TypeScript, Tailwind UI components.
- Backend: Node.js/Express, SQLite database, REST endpoints.
- Data Flow: Client calls admin and payments endpoints; charts built client-side.

3.4 Data Model (high level)
- Auctions, Bids, Users, Payments, Reports. See server database schema files in `server/database/*.sql`.

3.5 Diagrams (placeholders)
- Use Case Diagram – <Insert figure>
- Architecture Diagram – <Insert figure>
- ER Diagram – <Insert figure>

4. Implementation
4.1 Technology Stack
- Frontend: React, TypeScript, Tailwind, shadcn/ui.
- Backend: Express, SQLite. Payment services for eSewa.

4.2 Frontend Modules
- Admin Dashboard (`client/src/pages/AdminDashboard.tsx`)
  - Card-based analytics layout.
  - Real API data for stats, recent activity, top performers, and performance charts.
  - “Reports & Moderation” panel: fetches and updates reports.
  - Recent Activity: scrollable with `max-h-96 overflow-auto`.
  - Time range selector (7d/30d/90d) updating the chart and data.
- Payment Gateway (`client/src/components/payment/PaymentGateway.tsx`)
  - Dropdown for provider selection; only eSewa selectable; others disabled.
  - Summary panel shows fees and processing time.
  - eSewa redirect flow with dynamic form submission if needed.
  - Fees calculated via `/payments-v2/calculate-fees` with safe fallback.
- Notification Demo (`client/src/components/demo/NotificationDemo.tsx`)
  - Test notifications, sounds, and UI to support user feedback and demo scenarios.

4.3 Backend Modules
- Admin APIs (`server/routes/admin.js`)
  - Activity query supports integer LIMIT for larger ranges.
  - Endpoints for stats, activity, top performers, and reports.
- Payments Enhanced (`server/routes/payments-enhanced.js`)
  - Provider listing, fee calculation, and order payment initiation.
  - eSewa redirect/POST flow support via `PaymentGatewayService`.
- Services (`server/services/PaymentGatewayService.js`)
  - eSewa integration and placeholders for other providers.

4.4 Key Code References
- `client/src/services/api.ts` – API client for fetching dashboard/payment data.
- `server/config/esewa.js` – eSewa configuration (if present in project).
- Database SQL in `server/database/*.sql` – schema and migrations.

5. Testing and Evaluation
5.1 Test Strategy
- Unit/Smoke tests on API endpoints.
- Manual UAT on admin dashboard and payment gateway.

5.2 UAT Checklist (excerpt)
- Dashboard stats load via API without errors.
- Recent Activity scrolls; items paginate/load correctly for 7d/30d/90d.
- Performance chart updates instantly on range change; data refetch occurs.
- Reports & Moderation panel loads, updates status, and reflects changes.
- Payment provider dropdown shows eSewa active; others disabled.
- Clicking Pay triggers eSewa flow; redirect or form POST works; success callback handled.

5.3 Results
- Admin dashboard provides actionable insights with real data.
- Payment gateway offers clear, constrained choice with working eSewa flow.

6. Discussion
- Trade-offs: eSewa-only approach simplifies compliance and UX; future providers can be toggled progressively.
- Fallbacks ensure resilience when enhanced endpoints are unavailable.

7. Conclusion
- Objectives met: modern analytics UI, dynamic data, robust eSewa payment, and improved UX.

8. Future Work
- Enable additional providers (Khalti, Stripe) with full SDKs.
- Add automated tests and CI coverage for payments.
- Advanced analytics (cohorts, revenue breakdowns).

9. How to Run
- See `HOW_TO_RUN.md` for environment setup.
- Frontend dev: `client` – `npm install && npm run dev`.
- Backend dev: `server` – `npm install && npm start`.

10. References
- eSewa developer docs.
- React, Vite, Express documentation.

Appendices
A. API Endpoints (sample)
- GET `/admin/stats`
- GET `/admin/activity?range=7d|30d|90d`
- GET `/payments-v2/providers?amount&currency`
- POST `/payments-v2/calculate-fees`
- POST `/payments-v2/orders/:orderId/pay`

B. Change Log (high level)
- Refactor `AdminDashboard.tsx` to card-based analytics.
- Replace Quick Actions with Reports & Moderation.
- Real API data across dashboard sections; range selector wired.
- Refactor `PaymentGateway.tsx` to dropdown, eSewa-only, fee summary.
- Backend activity query limit fix; payments enhanced endpoints verified.

C. Screenshots (placeholders)
- Admin Dashboard (overview, range selector open)
- Payment Gateway (provider dropdown, summary, eSewa pay)
