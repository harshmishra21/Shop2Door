# Shop2Door Local Service Platform
## Software Requirements Specification (SRS)

**Document status:** Product and engineering baseline  
**Version:** 1.0  
**Date:** 12 September 2026  
**Product:** Shop2Door  
**Primary locale in current prototype:** Andheri West, Mumbai, India  
**Currency:** Indian Rupee (INR)

---

## 1. Purpose

This document specifies the functional, nonfunctional, data, interface, security, operational, and quality requirements for Shop2Door, a two-sided local-services marketplace. The platform enables customers to discover and book trusted local professionals, enables partners to manage service operations and earnings, and enables administrators to operate and govern the marketplace.

This SRS is grounded in the current Shop2Door repository and the supplied BRD/SOW context. It is written to serve four audiences:

- Product and business stakeholders defining the behavior that must be delivered.
- Engineering teams implementing the web client, API, database, integrations, and operations.
- QA teams creating traceable functional, security, usability, and performance tests.
- Delivery and support teams defining release readiness, monitoring, and operational ownership.

Where the current repository contains a working prototype, this document records that behavior as the current baseline. Where production behavior requires a capability that is only represented by a UI placeholder, seed data, or an incomplete integration, the requirement is marked as a production requirement and the implementation gap is stated explicitly.

## 2. Product Vision and Objectives

Shop2Door shall make local service help discoverable, trustworthy, bookable, and supportable in one experience. The product shall reduce the effort required to find an appropriate provider while giving providers practical tools to convert demand into completed work.

### 2.1 Business objectives

1. Provide a searchable marketplace for local services.
2. Increase customer confidence through provider verification, ratings, reviews, transparent pricing, availability, and service history.
3. Reduce booking friction through a guided booking flow with date, time, address, payment method, and price breakdown.
4. Give providers a focused workspace for requests, services, availability, jobs, profile, verification, and earnings.
5. Give administrators operational visibility over customers, providers, bookings, support, complaints, wallet, loyalty, insights, exports, and audit activity.
6. Establish a platform foundation that can move from seed/demo mode to Azure SQL-backed production mode without changing the public API contract.
7. Protect personal, payment-related, support, and administrative data through least privilege, auditability, and data minimization.

### 2.2 Success measures

The production implementation should measure at least:

- Customer registration-to-first-booking conversion.
- Search-to-provider-profile conversion.
- Provider response and acceptance rate.
- Booking completion and cancellation rate.
- Average time to provider response.
- Support first-response and resolution time.
- Repeat booking and loyalty participation.
- Marketplace gross booking value and provider payout accuracy.
- API availability, error rate, and p95 latency.
- Security incidents, unauthorized access attempts, and audit coverage.

Target values shall be agreed during product launch planning. The prototype does not currently establish production KPI thresholds.

## 3. Scope

### 3.1 In scope

- Customer account registration, login, logout, session restoration, and role-aware access.
- Partner account registration and provider profile creation.
- Admin login and admin-only operations views.
- Service category discovery.
- Provider search with query, distance, price, rating, and availability filters.
- Provider profiles with verification, experience, ratings, reviews, services, slots, trust attributes, and service area.
- Customer booking creation, price calculation, booking confirmation, tracking, cancellation, and booking history.
- Customer wallet display, top-up workflow, refund credit representation, and transaction history.
- Loyalty tier, points, rewards, redemption, and activity views.
- Customer reviews and ratings for completed bookings.
- Customer support tickets and ticket submission.
- Partner dashboards, booking request management, job actions, service management, availability, earnings, profile, and verification status.
- Admin marketplace overview, operational lists, complaints, social complaints, ticket replies, loyalty management view, insights, reports/exports, and audit view.
- REST-style JSON API served from the same Express origin as the web client.
- Azure SQL persistence with in-memory seed fallback for development/demo use.
- Responsive browser experience for desktop and mobile layouts.

### 3.2 Out of scope unless separately approved

- Native iOS or Android applications.
- Real payment processing, payment gateway settlement, refunds to external instruments, or PCI certification.
- Real-time chat, push notifications, SMS, WhatsApp, email delivery, or voice calls.
- Live GPS tracking and routing.
- Automated identity/KYC vendor integration.
- Provider background-check vendor integration.
- AI model training or autonomous decision-making.
- Multi-country tax, currency, language, or legal configuration.
- Full CMS, marketing site, or public provider self-service moderation workflow.
- Advanced scheduling conflict optimization.
- Marketplace escrow or legally binding payout orchestration.

Out-of-scope items may be represented by prototype labels or buttons, but they must not be treated as production-complete without an approved change request and acceptance criteria.

## 4. Stakeholders and Actors

| Actor | Description | Primary objectives |
|---|---|---|
| Visitor | Unauthenticated browser user | Understand the service and sign in or register |
| Customer | User role that requests local services | Search, compare, book, pay, track, review, and obtain support |
| Partner | Provider role that fulfills services | Maintain profile/services, manage availability, accept work, and view earnings |
| Administrator | Privileged operations role | Govern marketplace activity, support, complaints, data, insights, and exports |
| Support agent | Operational user acting through admin support tools | Review and reply to customer tickets |
| Finance/operations staff | Business stakeholder using admin data | Reconcile wallet, booking, export, and marketplace activity |
| Database operator | Technical operator | Provision and maintain Azure SQL and backup/restore processes |
| Platform operator | Technical operator | Run the API, configure environment, monitor health, and manage releases |

The current application models `user`, `partner`, and `admin`. A future production authorization model may split administrator and support-agent permissions into separate roles.

## 5. Assumptions, Constraints, and Dependencies

### 5.1 Assumptions

- The initial launch geography is Mumbai, beginning with Andheri West and an expandable service radius.
- All monetary values are stored as integer INR amounts representing whole rupees unless a future payment design explicitly introduces minor units.
- A customer booking is associated with one provider and one service.
- A partner account is associated with one provider profile in the current model.
- The API and browser client are served from one origin in the standard deployment.
- Seed mode is acceptable for local demos and development only.
- The platform may use third-party services for images, fonts, payment, identity, messaging, and analytics after security and legal review.

### 5.2 Constraints in the current implementation

- The web client is a static HTML/CSS/JavaScript application.
- The server is Node.js CommonJS with Express and `mssql`.
- Authentication tokens are opaque bearer tokens stored in an in-memory server map; tokens are lost on process restart and are not suitable as the final production session mechanism.
- Passwords currently use SHA-256 with a per-user salt. Production must use a password KDF such as Argon2id, scrypt, or bcrypt with an approved work factor.
- Azure SQL connection is optional. If required environment variables are absent or the connection fails, the store serves in-memory seed data.
- The client stores its session object in browser `sessionStorage`.
- The current server has no explicit CORS middleware. This is correct for the same-origin deployment and does not make a `file://` launch valid.
- The current server automatically attempts subsequent ports when the configured port is in use. Production deployment should use a fixed managed port or reverse proxy contract.

### 5.3 Dependencies

- Node.js runtime compatible with the server package.
- Express runtime and `mssql` driver.
- Azure SQL Database for durable persistence.
- Browser with Fetch API, session storage, modern JavaScript, CSS, and ES module-free script support.
- Approved image/font/CDN providers if external assets remain enabled.
- Future payment, communication, KYC, maps, analytics, and observability providers as approved integrations.

## 6. User Experience and Navigation Requirements

### 6.1 Common requirements

**UX-001** The application shall present a sign-in experience to unauthenticated users.

**UX-002** The application shall show a clear error state when an API request fails, including a retry action where retry is meaningful.

**UX-003** The application shall show a loading state while a screen is retrieving data.

**UX-004** The application shall prevent authenticated users from accessing a role workspace for which they have no permission.

**UX-005** The application shall preserve the active role and screen in the URL hash or an equivalent deep-linkable route.

**UX-006** The application shall restore a valid session and route on reload. An invalid or expired session shall clear local session state and return the user to authentication.

**UX-007** User-visible errors shall be understandable, actionable, and shall not reveal stack traces, SQL statements, credentials, tokens, or internal infrastructure details.

**UX-008** All interactive controls shall have keyboard-accessible focus and meaningful labels. Icon-only controls shall have accessible names or tooltips.

**UX-009** The interface shall support desktop and mobile layouts without horizontal page overflow, clipped primary actions, or overlapping content.

**UX-010** The client shall escape user-controlled values before inserting them into HTML. A production implementation shall additionally adopt a restrictive Content Security Policy and avoid unsafe HTML construction where practical.

### 6.2 Customer navigation

The customer workspace shall provide access to:

- Discover/home.
- Search services.
- Provider results and provider profile.
- My bookings.
- Wallet.
- Rewards/loyalty.
- Support.
- Profile.
- Recommendations where enabled.

### 6.3 Partner navigation

The partner workspace shall provide access to:

- Dashboard.
- Booking requests.
- My services.
- Availability.
- Earnings.
- Business profile.
- Verification/KYC status.
- Job details and actions.

### 6.4 Admin navigation

The admin workspace shall provide access to:

- Marketplace overview.
- Customers.
- Providers.
- Bookings.
- Queries/support inbox.
- App complaints.
- Social complaints.
- Loyalty management.
- Wallet ledger.
- AI insights.
- Reports and exports.
- Audit logs.

## 7. Functional Requirements

### 7.1 Authentication and account management

**AUTH-001 Registration:** The system shall allow a visitor to create a customer account with name, email, mobile number, password, role, and acceptance of applicable terms.

**AUTH-002 Partner registration:** The system shall allow a visitor to create a partner account with business name, full name, email, mobile number, password, and terms acceptance.

**AUTH-003 Email validation:** Registration shall reject an invalid email format.

**AUTH-004 Mobile validation:** Registration shall require at least ten numeric mobile digits after nonnumeric characters are removed.

**AUTH-005 Password validation:** Registration shall require a password of at least six characters in the current baseline. Production policy should define stronger length, breached-password, and rate-limit requirements.

**AUTH-006 Role validation:** Registration shall permit customer/user and partner roles only. Admin accounts shall be provisioned through a protected administrative process, not public registration.

**AUTH-007 Duplicate account prevention:** Registration shall reject an email already associated with an account.

**AUTH-008 Password storage:** The system shall never store or return a plaintext password. Password verification shall use a modern password hashing/KDF strategy in production.

**AUTH-009 Login:** The system shall authenticate a user by normalized email and password and return a session credential plus a public user profile.

**AUTH-010 Login failure:** Invalid credentials shall return a generic authentication failure to avoid confirming whether an email exists. The UI may provide demo-account guidance only in non-production mode.

**AUTH-011 Session authorization:** Protected requests shall require a valid bearer credential or approved production session mechanism.

**AUTH-012 Role authorization:** Customer, partner, and admin endpoints shall enforce server-side role checks. Client-side hiding is not an authorization control.

**AUTH-013 Session expiry:** Expired or invalid credentials shall produce HTTP 401 and the client shall require sign-in again.

**AUTH-014 Logout:** Logout shall invalidate the active credential where the session architecture supports revocation and shall clear client session state.

**AUTH-015 Session restoration:** The client may call an authenticated identity endpoint on reload to confirm the stored session before rendering protected data.

**AUTH-016 Account privacy:** Public user responses shall exclude password hashes, salts, bearer tokens, and other secrets.

### 7.2 Customer discovery and search

**CUS-001 Categories:** The customer shall see service categories with a stable key, label, icon, tone, and display order.

**CUS-002 Provider search:** The customer shall search providers by free-text query across provider name, category, and provider tags.

**CUS-003 Distance filtering:** The customer shall filter providers by maximum distance in kilometers.

**CUS-004 Price filtering:** The customer shall filter providers by maximum starting price.

**CUS-005 Rating filtering:** The customer shall filter providers by minimum rating.

**CUS-006 Availability filtering:** The customer shall filter to providers with a current availability flag and at least one slot labeled as available today.

**CUS-007 Result ordering:** Results shall be ordered by distance ascending unless a future ranking specification replaces this rule.

**CUS-008 Result data:** A provider result shall expose enough information to compare providers, including name, category, rating, completed jobs, verification, distance, starting price, tags, initials, and an available slot where applicable.

**CUS-009 Empty results:** No-match results shall explain that filters can be widened and shall not appear as a broken screen.

**CUS-010 Provider detail:** A provider profile shall show identity, service category, experience, rating, review count, response time, verification, service area, trust attributes, active services, prices, reviews, and next available slots.

**CUS-011 Active service rule:** Customers shall be offered only services marked active and bookable.

**CUS-012 Recommendations:** Recommendations shall show the recommended service/provider, explanation text, call to action, relevance/confidence representation, and basis where available. Production recommendations shall be explainable, permission-aware, and governed by a documented data-use policy.

### 7.3 Customer booking

**BOOK-001 Provider selection:** A customer shall start a booking from a provider result, recommendation, or provider profile.

**BOOK-002 Service selection:** The booking flow shall require an active service belonging to the selected provider.

**BOOK-003 Date selection:** The customer shall select a service date from available dates. The server shall validate that the requested date is acceptable and not stale.

**BOOK-004 Time selection:** The customer shall select an available slot. The server shall validate availability at booking creation time.

**BOOK-005 Address:** The customer shall provide or select a service address. The address shall be validated for required content and service-area eligibility in production.

**BOOK-006 Payment method:** The customer shall select an allowed payment method. The current baseline displays UPI, Card, and Wallet; production availability depends on configured payment integrations and wallet balance rules.

**BOOK-007 Price breakdown:** The booking summary shall show base service price, platform fee, GST/tax, and total. The server, not the browser, shall be authoritative for calculated amounts.

**BOOK-008 Booking creation:** A valid booking request shall create one booking associated with the authenticated customer, selected provider, selected service, date, time, address, payment method, and calculated amounts.

**BOOK-009 Booking identifier:** The system shall return a unique internal booking ID and customer-facing booking code.

**BOOK-010 Initial status:** A newly created booking shall enter `pending` unless the approved payment and provider-confirmation design specifies another status.

**BOOK-011 Idempotency:** Production booking creation shall support an idempotency key to prevent duplicate bookings when a customer retries after a timeout.

**BOOK-012 Concurrency:** The server shall prevent two customers from successfully reserving the same provider/service slot when the schedule does not permit concurrent work.

**BOOK-013 Confirmation:** The confirmation view shall display booking status, code, service, provider, date/time, location, amount, and next action.

**BOOK-014 Tracking:** The customer shall be able to view the current booking status and history timeline for a booking they own.

**BOOK-015 Cancellation:** A customer shall be able to cancel an eligible booking. The server shall enforce cancellation policy, state eligibility, refund behavior, and audit logging.

**BOOK-016 Booking isolation:** A customer shall not retrieve, cancel, or otherwise mutate another customer's booking by changing an ID.

**BOOK-017 Booking history:** The customer shall view bookings by upcoming, active, completed, and cancelled tabs.

**BOOK-018 Counts:** The customer navigation may display a count of relevant booking items. Counts are informational and shall not be used as authorization.

### 7.4 Booking state model

The canonical production state machine shall be agreed before payment and notification integration. The current baseline uses the following states:

| State | Meaning | Customer actions | Partner actions |
|---|---|---|---|
| `pending` | Booking submitted and awaiting provider confirmation | View, cancel if policy allows | Review and accept/decline |
| `confirmed` | Provider accepted or booking was confirmed | View, track, cancel if policy allows | Prepare and perform service |
| `in_progress` | Service is being performed | Track | Update progress |
| `completed` | Service finished | Review, view history | View completion and earnings |
| `cancelled` | Booking cancelled | View refund/result | View outcome |
| `declined` | Provider declined request | View outcome; rebook | Terminal response to request |

Allowed transitions shall be enforced server-side. A user shall not set an arbitrary status. Every transition shall record actor, timestamp, previous status, new status, and reason where applicable.

### 7.5 Customer wallet and payments

**PAY-001 Wallet display:** The customer shall see available balance, promotional credit, refund credit, saved/payment-related value, and recent transactions.

**PAY-002 Wallet top-up:** The customer shall be able to request a top-up amount subject to minimum, maximum, fraud, payment, and currency rules.

**PAY-003 Ledger:** Every wallet balance mutation shall create an immutable ledger transaction with ID, user, amount, kind, reason, date, and status.

**PAY-004 Atomicity:** Wallet ledger insertion and balance update shall be atomic. A failed transaction shall not partially change the balance.

**PAY-005 Refunds:** A cancellation refund shall follow the approved policy and shall identify whether it is credited to wallet, returned to the original instrument, or held for review.

**PAY-006 No client authority:** The browser shall never be trusted to set wallet balances, transaction status, refund amounts, or booking totals.

**PAY-007 Payment security:** Production card data shall be handled by a PCI-compliant payment provider. Shop2Door shall not store full card numbers, CVV, or payment authentication secrets.

**PAY-008 Reconciliation:** Finance operations shall be able to reconcile payment intent, booking, wallet ledger, refund, and payout records.

### 7.6 Loyalty and rewards

**LOY-001 Tier display:** A customer shall see current loyalty tier, points available, progress toward next tier, benefits, and next reward.

**LOY-002 Points activity:** Points changes shall be recorded as user-scoped activity with a positive or negative value and descriptive metadata.

**LOY-003 Reward redemption:** A customer may redeem an eligible reward once required conditions are satisfied.

**LOY-004 Redemption safety:** A reward redemption shall be atomic and idempotent; points shall not be deducted twice for one request.

**LOY-005 Eligibility:** Tier, points, reward, expiry, and campaign rules shall be evaluated server-side.

**LOY-006 Admin control:** Authorized administrators shall view loyalty totals, tiers, and active campaigns. Editing campaigns shall require a permission and audit record.

### 7.7 Ratings and reviews

**REV-001 Eligibility:** Only a customer associated with a completed booking may review that booking.

**REV-002 One review:** A booking shall not receive more than one accepted review unless a documented edit policy exists.

**REV-003 Rating range:** Rating shall be an integer from 1 through 5.

**REV-004 Optional text:** Review text may be optional but must obey length, content, and abuse rules.

**REV-005 Tags:** Review tags may be recorded from a controlled vocabulary.

**REV-006 Provider impact:** Accepted reviews may update provider rating and review count according to a documented aggregation rule.

**REV-007 Moderation:** Production reviews shall support reporting, moderation, and removal/visibility audit where legally and operationally required.

### 7.8 Customer support

**SUP-001 Ticket creation:** A customer shall create a support ticket with optional booking reference, category, requested resolution, and description.

**SUP-002 Ticket ownership:** A customer shall list only their own tickets and messages.

**SUP-003 Ticket status:** Tickets shall have a controlled status such as New, In progress, Waiting for customer, Resolved, or Closed.

**SUP-004 Ticket priority:** Priority shall be assigned according to documented rules and may be adjusted by authorized operations staff.

**SUP-005 Conversation:** A ticket shall contain an ordered message history with sender, text, timestamp, and source.

**SUP-006 Admin reply:** An authorized support/admin user shall select a ticket, send a reply, and cause the ticket update timestamp and audit event to be recorded.

**SUP-007 Privacy:** Ticket content shall be visible only to the customer, authorized support personnel, and explicitly authorized systems.

### 7.9 Partner workspace

**PART-001 Dashboard:** A partner shall see upcoming jobs, today's earnings, pending earnings, rating, response time, availability summary, and quick actions.

**PART-002 Request list:** A partner shall list requests by new, upcoming, active, and completed tabs, with counts for each category.

**PART-003 Request detail:** A partner shall view service, date, time, customer summary, location, price, payment state, customer note, and current status for a request linked to that partner.

**PART-004 Accept:** A partner shall accept an eligible request. Acceptance shall be authorized against the partner's provider profile and shall update the booking/job consistently.

**PART-005 Decline:** A partner shall decline an eligible request. A decline reason should be captured in production when required for analytics or customer communication.

**PART-006 Job status:** A partner shall update only allowed job statuses and only for jobs linked to their provider profile.

**PART-007 Service list:** A partner shall list services belonging to their provider profile.

**PART-008 Add service:** A partner shall create a service with name, price, duration, detail, and active state subject to validation and moderation rules.

**PART-009 Update service:** A partner shall activate or pause only their own service. Pausing shall not corrupt existing bookings.

**PART-010 Availability:** A partner shall view and update overall availability and regular weekly schedule.

**PART-011 Availability safety:** New bookings shall not be accepted when the provider is paused, outside service hours, or otherwise unavailable.

**PART-012 Earnings:** A partner shall view weekly earnings, pending payout, completed job count, average value, series data, and recent payments.

**PART-013 Payouts:** Production payouts shall have explicit payout status, destination, eligibility, failure handling, reconciliation, and audit records.

**PART-014 Profile:** A partner shall view and update permitted business name and service area fields. Immutable verification fields shall not be self-edited.

**PART-015 Verification:** A partner shall see verification step status and required next action. Production KYC must be integrated with an approved provider or controlled operations process.

**PART-016 Partner isolation:** A partner shall not view or mutate another partner's services, availability, earnings, profile, or jobs.

### 7.10 Administration and marketplace operations

**ADM-001 Overview:** An admin shall see marketplace metrics, booking series, labels, top category, AI insight content, and recent complaints.

**ADM-002 Customer list:** An admin shall view customer records with location, bookings, spend, tier, last activity, and account status subject to data access policy.

**ADM-003 Provider list:** An admin shall view provider records with category, verification, rating, jobs, availability, and status.

**ADM-004 Booking list:** An admin shall view booking ID, customer, service, provider, time, amount, and status.

**ADM-005 Wallet ledger:** An admin shall view wallet transaction ID, customer, type, amount, date, reason, and status. Sensitive payment fields shall be masked.

**ADM-006 Query inbox:** An admin/support user shall list customer support tickets, select a ticket, inspect its messages, and reply where authorized.

**ADM-007 Complaint management:** An admin shall list app complaints and move complaints through controlled statuses such as New, Investigating, Resolution proposed, and Resolved.

**ADM-008 Social complaints:** Social-channel complaints shall be distinguishable from in-app complaints and shall retain channel metadata.

**ADM-009 Complaint audit:** Complaint status, assignment, priority, and resolution changes shall be audited.

**ADM-010 Loyalty administration:** An admin shall view aggregate loyalty totals, tier information, and active campaigns.

**ADM-011 Insights:** An admin shall view advisory marketplace insights with context and confidence representation. Insights shall not autonomously make irreversible decisions.

**ADM-012 Exports:** An admin shall request and view permission-safe exports with dataset, format, requester, record count, status, and export ID.

**ADM-013 Export protection:** Exports shall be authorization checked, masked by default, time-limited where possible, encrypted at rest and in transit, and logged.

**ADM-014 Audit logs:** An admin shall view timestamp, actor, role, action, resource, and result for security-relevant and business-critical operations.

**ADM-015 Admin authorization:** All admin operations shall be protected server-side. UI visibility alone shall never grant admin rights.

**ADM-016 Segregation of duties:** Production deployments should support separate permissions for support, finance, provider moderation, data export, and platform administration.

## 8. External and Internal API Requirements

The current API is JSON over HTTP and is mounted under `/api`. The production API shall publish an OpenAPI specification, version its breaking changes, and define consistent error envelopes.

### 8.1 Common API rules

- Content type: `application/json` for JSON requests and responses.
- Authentication: bearer token in the current baseline; secure, revocable, expiring sessions are required for production.
- IDs: opaque strings; clients shall not infer database structure from IDs.
- Dates: use ISO 8601 in production API contracts. Current display-oriented labels are not sufficient as canonical values.
- Money: return integer minor units or explicitly documented INR rupees; do not mix conventions.
- Errors: return a stable machine-readable code, human-readable message, correlation ID, and optional field errors.
- Pagination: required for production list endpoints.
- Filtering/sorting: document allowed fields and maximum page sizes.
- Rate limits: required for authentication, registration, ticket, booking, wallet, and export endpoints.

### 8.2 Health and authentication endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/health` | Public or internal-only in production | Health and dependency status |
| POST | `/api/auth/login` | Public | Authenticate user |
| POST | `/api/auth/register` | Public | Create user or partner account |
| GET | `/api/auth/me` | Authenticated | Return current user |
| POST | `/api/auth/logout` | Authenticated/optional | Revoke session |

### 8.3 Customer endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/categories` | Public or customer | List categories |
| GET | `/api/providers` | Public or customer | Search/filter providers |
| GET | `/api/providers/:id` | Public or customer | Provider detail |
| GET | `/api/recommendations` | Customer | Customer recommendations |
| GET | `/api/bookings?tab=` | Customer | Customer booking list |
| POST | `/api/bookings` | Customer | Create booking |
| GET | `/api/bookings/:id` | Customer | Get owned booking |
| POST | `/api/bookings/:id/cancel` | Customer | Cancel owned booking |
| GET | `/api/wallet` | Customer | Wallet and transactions |
| POST | `/api/wallet/topup` | Customer | Start/request wallet top-up |
| GET | `/api/loyalty` | Customer | Loyalty summary |
| POST | `/api/loyalty/redeem` | Customer | Redeem reward |
| POST | `/api/reviews` | Customer | Submit eligible review |
| GET | `/api/tickets` | Customer | List owned tickets |
| POST | `/api/tickets` | Customer | Create support ticket |
| GET | `/api/counts` | Customer | Navigation counts |

### 8.4 Partner endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/partner/dashboard` | Partner | Dashboard summary |
| GET | `/api/partner/requests?tab=` | Partner | Partner request list |
| GET | `/api/partner/jobs/:id` | Partner | Owned job detail |
| POST | `/api/partner/jobs/:id/accept` | Partner | Accept job |
| POST | `/api/partner/jobs/:id/decline` | Partner | Decline job |
| POST | `/api/partner/jobs/:id/status` | Partner | Update owned job status |
| GET | `/api/partner/services` | Partner | List owned services |
| POST | `/api/partner/services` | Partner | Add service |
| PATCH | `/api/partner/services/:id` | Partner | Update owned service |
| GET | `/api/partner/availability` | Partner | Get availability |
| PATCH | `/api/partner/availability` | Partner | Update availability |
| GET | `/api/partner/earnings` | Partner | Earnings summary |
| GET | `/api/partner/profile` | Partner | Provider profile |
| PATCH | `/api/partner/profile` | Partner | Update permitted profile fields |
| GET | `/api/partner/counts` | Partner | Navigation counts |

### 8.5 Admin endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/admin/overview` | Admin | Operational overview |
| GET | `/api/admin/customers` | Admin | Customer list |
| GET | `/api/admin/providers` | Admin | Provider list |
| GET | `/api/admin/bookings` | Admin | Booking list |
| GET | `/api/admin/wallet` | Admin | Wallet ledger |
| GET | `/api/admin/audit` | Admin | Audit records |
| GET | `/api/admin/loyalty` | Admin | Loyalty administration |
| GET | `/api/admin/insights` | Admin | Marketplace insights |
| GET | `/api/admin/exports` | Admin | Export history |
| POST | `/api/admin/exports` | Admin | Create export request |
| GET | `/api/admin/queries` | Admin | Support ticket inbox |
| POST | `/api/admin/queries/:id/reply` | Admin | Reply to ticket |
| GET | `/api/admin/complaints` | Admin | Complaint list |
| PATCH | `/api/admin/complaints/:id` | Admin | Update complaint |
| GET | `/api/admin/counts` | Admin | Admin navigation counts |

## 9. Data Requirements

### 9.1 Core entities

The current Azure SQL schema contains the following logical entities:

- `users`: identity, contact, role, password material, wallet summary, loyalty summary, and provider linkage.
- `categories`: service category catalog and display metadata.
- `providers`: business/provider identity, category, quality metrics, verification, service area, availability summary, and JSON arrays for tags/trust/slots.
- `services`: provider-owned bookable services, price, duration, description, and active state.
- `reviews`: provider reviews and rating metadata.
- `bookings`: customer/provider/service relationship, schedule, address, price breakdown, payment method, status, history, and reviewed flag.
- `wallet_txns`: wallet ledger entries.
- `loyalty_activity`: customer points ledger/activity.
- `recommendations`: provider recommendations and explanation fields.
- `tickets`: customer support cases and serialized messages.
- `complaints`: operational complaint records and channel/priority/status.
- `jobs`: partner-facing operational representation of work.
- `availability`: provider-wide availability and serialized regular schedule.
- `earnings`: partner earnings summary and payment series.
- `overview`: admin dashboard metric and chart content.
- `loyalty_admin`: aggregate loyalty administration configuration/content.
- `insights`: advisory insight content.
- `exports`: export request/result metadata.
- `audit`: administrative/security event records.

### 9.2 Required production data improvements

1. Replace display labels such as `dateLabel` and `timeLabel` with canonical UTC timestamps plus timezone and local display fields.
2. Use foreign keys for users, providers, services, bookings, reviews, jobs, wallet transactions, tickets, and availability where appropriate.
3. Add created-at, updated-at, and actor fields consistently.
4. Add unique constraints preventing duplicate reviews and duplicate external payment references.
5. Normalize JSON arrays into relational tables where querying, integrity, or reporting requires it; retain JSON only for truly document-like fields.
6. Store money with one documented convention and add currency code.
7. Add soft-delete or archival strategy for records subject to retention requirements.
8. Add optimistic concurrency/version columns for mutable operational records.
9. Add indexes for search, status, date, provider, customer, ticket, complaint, and audit query patterns.
10. Encrypt or tokenize sensitive data at rest according to classification.
11. Add migration versioning and rollback/runbook procedures.

### 9.3 Data classification

| Classification | Examples | Required handling |
|---|---|---|
| Public | Category labels, public provider service descriptions | Integrity controls; cache where appropriate |
| Internal | Operational metrics, non-sensitive provider performance | Role-limited access |
| Confidential | Customer contact details, addresses, support messages, earnings | Least privilege, encryption, audit, masking |
| Restricted | Password material, tokens, payment secrets, government ID, bank details | Never expose in normal API responses; strong encryption/tokenization and strict access |

## 10. Security and Privacy Requirements

**SEC-001** All production traffic shall use HTTPS with modern TLS.

**SEC-002** Authentication credentials shall be rate-limited, monitored, and protected from brute-force attacks.

**SEC-003** Production passwords shall use Argon2id, scrypt, or bcrypt; the current SHA-256 prototype method shall not be accepted as the final standard.

**SEC-004** Sessions shall expire, be revocable, rotate where appropriate, and be stored in a mechanism resistant to XSS, preferably secure HttpOnly SameSite cookies or an approved equivalent.

**SEC-005** Authorization shall be enforced on every protected resource using authenticated identity and resource ownership checks.

**SEC-006** Admin endpoints shall use explicit role/permission checks and audit privileged actions.

**SEC-007** API inputs shall be validated for type, length, range, enum, ownership, and business rules.

**SEC-008** SQL queries shall use parameterized inputs. Dynamic identifiers, sort fields, and filters shall use allowlists.

**SEC-009** The application shall use security headers including CSP, HSTS in HTTPS deployments, frame protections, content-type sniffing protection, and an appropriate Referrer-Policy.

**SEC-010** The API shall defend against CSRF if cookie-based authentication is used.

**SEC-011** The API shall enforce request body size, upload limits, timeout limits, and rate limits.

**SEC-012** Error responses and logs shall not contain passwords, tokens, secrets, full payment data, or unnecessary personal information.

**SEC-013** Logs shall use a correlation ID and shall be access-controlled, retained, and protected against tampering.

**SEC-014** Personal data collection shall be limited to the purpose for which it is needed. Consent, notice, retention, deletion, correction, and access workflows shall be defined for the launch jurisdictions.

**SEC-015** Exports shall require explicit authorization, be logged, be masked by default, and expire or be deleted according to policy.

**SEC-016** Dependencies shall be scanned for known vulnerabilities and updated under a patch policy.

**SEC-017** Production secrets shall come from a secrets manager or protected deployment environment, never source control.

**SEC-018** The system shall undergo security testing covering authentication, authorization, injection, XSS, CSRF, session handling, IDOR, rate limiting, and sensitive-data exposure.

## 11. Nonfunctional Requirements

### 11.1 Performance

- **NFR-PERF-001:** For normal production load, p95 read API latency should be at most 500 ms excluding third-party provider latency.
- **NFR-PERF-002:** p95 booking mutation latency should be at most 1,000 ms excluding asynchronous payment provider completion.
- **NFR-PERF-003:** The initial authenticated application view should become usable within 3 seconds on a representative broadband mobile connection after cached static assets are available.
- **NFR-PERF-004:** Search results shall paginate and shall not load an unbounded provider list.
- **NFR-PERF-005:** Exports and analytics computations larger than the interactive threshold shall execute asynchronously.

### 11.2 Availability and resilience

- **NFR-REL-001:** The production API shall define an availability target, recommended initial target 99.5% monthly excluding approved maintenance.
- **NFR-REL-002:** Azure SQL shall have automated backups and tested restore procedures.
- **NFR-REL-003:** A database outage shall produce a controlled degraded state. Seed fallback shall never silently activate in production where it could create data loss or inconsistent behavior.
- **NFR-REL-004:** Booking, wallet, loyalty, and payment mutations shall be transactional and idempotent.
- **NFR-REL-005:** Third-party failures shall use timeouts, retries with backoff where safe, circuit breaking where appropriate, and clear user-facing status.

### 11.3 Scalability

- **NFR-SCALE-001:** The API shall be stateless at the application tier or use a shared session store so multiple instances can run behind a load balancer.
- **NFR-SCALE-002:** Search, provider, booking, ticket, and audit queries shall use indexes and bounded result sets.
- **NFR-SCALE-003:** Background work shall be decoupled through a queue when notifications, exports, reconciliation, or analytics are introduced.

### 11.4 Accessibility

- **NFR-A11Y-001:** The web app shall target WCAG 2.2 AA for keyboard operation, focus visibility, labels, semantics, contrast, and error identification.
- **NFR-A11Y-002:** Color shall not be the only indicator of status, validation, or meaning.
- **NFR-A11Y-003:** Forms shall associate labels, instructions, errors, and controls programmatically.
- **NFR-A11Y-004:** Dynamic loading, success, and error states shall be announced appropriately to assistive technologies.

### 11.5 Compatibility

The supported browser matrix shall include the latest two stable releases of Chrome, Safari, Edge, and Firefox on desktop and mobile platforms agreed for launch. Unsupported browsers shall receive a clear compatibility message rather than a partially functioning experience.

### 11.6 Maintainability and observability

- The API shall have structured logging and correlation IDs.
- The system shall expose liveness and readiness health checks separately.
- Metrics shall cover request count, latency, status codes, database health, authentication failures, booking mutations, wallet mutations, queue depth, and export failures.
- Traces shall link browser action, API request, database operation, and external provider call where tracing is enabled.
- Code shall pass linting, syntax/type checks where configured, automated tests, dependency scanning, and build validation in CI.
- API behavior shall be documented through OpenAPI and example requests/responses.

## 12. Error Handling and Recovery

The system shall distinguish:

- Validation errors: HTTP 400 with field-level feedback.
- Authentication failures: HTTP 401 with no sensitive detail.
- Authorization failures: HTTP 403.
- Missing resources: HTTP 404 without leaking existence where sensitive.
- Conflicts: HTTP 409 for duplicate registration, stale booking, occupied slot, duplicate review, or idempotency conflict.
- Rate limiting: HTTP 429 with retry guidance.
- Dependency/service failures: HTTP 502/503 as appropriate.
- Unexpected failures: HTTP 500 with a correlation ID and generic user message.

The client shall show loading, success, empty, and error states for every API-driven view. Retry shall not blindly repeat a non-idempotent mutation without an idempotency key or explicit user confirmation.

## 13. Reporting, Audit, and Analytics

### 13.1 Audit events

At minimum, audit the following:

- Login success/failure and logout.
- Registration and role assignment.
- Booking creation, confirmation, status changes, cancellation, and refund.
- Wallet top-up, debit, credit, and manual adjustment.
- Loyalty award, deduction, redemption, and campaign change.
- Review creation, moderation, and removal.
- Ticket creation, assignment, reply, status, and closure.
- Provider verification, service, availability, profile, and payout changes.
- Complaint assignment, priority, status, and resolution.
- Admin exports and access to restricted datasets.
- Permission and configuration changes.

### 13.2 Analytics requirements

Analytics events shall be consent-aware and shall avoid sending raw addresses, full support content, payment secrets, or unnecessary personal data. Event names, properties, retention, owners, and dashboards shall be documented before production instrumentation.

## 14. Testing and Quality Strategy

### 14.1 Unit tests

Cover:

- Password validation and hashing abstraction.
- Role mapping and authorization decisions.
- Search filters and ordering.
- Price breakdown and tax/fee calculations.
- Booking state transition rules.
- Cancellation and refund eligibility.
- Wallet and loyalty arithmetic.
- Review eligibility and rating validation.
- Input escaping and serialization helpers.

### 14.2 API integration tests

Cover every endpoint for:

- Successful authorized request.
- Missing/invalid credentials.
- Wrong role.
- Wrong resource owner.
- Invalid body and query values.
- Empty and not-found behavior.
- Duplicate and conflict behavior.
- Database failure behavior.
- Transaction rollback behavior.

### 14.3 End-to-end tests

At minimum:

1. Visitor opens the app through HTTP and sees authentication.
2. Customer logs in, sees Discover data, searches, opens a provider, creates a booking, sees confirmation, and views tracking.
3. Customer cancels an eligible booking and sees the correct result.
4. Customer views wallet and loyalty, submits a review for a completed booking, and submits a support ticket.
5. Partner logs in, views requests, accepts/declines a job, manages a service, updates availability, and views earnings.
6. Admin logs in, views overview data, replies to a ticket, updates a complaint, and creates an export.
7. A customer cannot access partner/admin endpoints.
8. A partner cannot access another partner's resources.
9. A customer cannot access another customer's booking, wallet, review, or ticket.
10. Expired sessions return the user to sign-in.
11. Opening `index.html` directly is either redirected to a running HTTP origin or shows a clear launch instruction; API calls must not be attempted from `file://`.

### 14.4 Nonfunctional tests

- Accessibility automated scan plus keyboard and screen-reader checks.
- Responsive tests at defined desktop, tablet, and mobile breakpoints.
- Load tests for search, provider details, dashboard, booking, and admin lists.
- Security tests based on OWASP ASVS and API authorization scenarios.
- Backup restore and disaster-recovery exercise.
- Dependency and secret scanning.
- Browser compatibility matrix.

## 15. Acceptance Criteria

The release shall not be accepted as a production marketplace until all of the following are true:

- All in-scope role workflows have passed functional and authorization tests.
- No protected endpoint relies solely on client-side role hiding.
- Booking and wallet mutations are transactional, idempotent, and audited.
- Payment behavior is integrated with an approved provider or explicitly disabled; demo wallet behavior is not presented as real payment.
- Production authentication uses approved password and session security.
- Azure SQL migrations, indexes, backups, restore, and monitoring are documented and tested.
- Seed mode is explicitly disabled or isolated from production.
- API documentation and error contracts are published.
- Accessibility and responsive acceptance criteria pass.
- Security assessment has no unresolved critical or high findings.
- Observability dashboards and incident runbooks exist.
- Privacy notice, retention, deletion/correction handling, and support escalation are approved.
- Performance targets are demonstrated under agreed representative load.

## 16. Current Implementation Traceability and Gaps

### 16.1 Confirmed implemented baseline

- Single-origin Express server serves the project root and `/api` routes.
- Customer, partner, and admin workspaces are represented in the web client.
- Login, registration, logout, session storage, and role-aware routing are implemented in the client/server baseline.
- Customer discovery, provider search, provider detail, booking, tracking, cancellation, wallet, loyalty, review, support, and profile views are represented.
- Partner dashboard, requests, jobs, services, availability, earnings, profile, and verification views are represented.
- Admin overview, entity lists, support queries, complaints, loyalty, insights, exports, and audit views are represented.
- API routes exist for the main customer, partner, and admin flows listed in this document.
- Azure SQL schema and a seed fallback share the same store-layer API shape.
- The client has loading and error states, including retry behavior for screen rendering.

### 16.2 Required hardening or completion before production

- Replace prototype password hashing with a modern password KDF.
- Replace in-memory bearer sessions with durable, expiring, revocable production sessions.
- Replace `sessionStorage` token handling with an approved secure session architecture.
- Add formal input schemas, consistent API error codes, pagination, and OpenAPI documentation.
- Add database transactions, foreign keys, canonical timestamps, concurrency control, and migrations.
- Implement real payment, refund, payout, reconciliation, and webhook workflows or explicitly restrict the product to demo mode.
- Add notifications and provider/customer communication if those are part of the approved launch scope.
- Define and enforce booking, cancellation, refund, tax, service-area, and availability policies.
- Separate admin permissions into least-privilege roles.
- Add full audit coverage, monitoring, alerting, backup/restore, and incident runbooks.
- Add automated unit, API, end-to-end, security, accessibility, and performance tests.
- Remove or gate demo account hints and seed data for production.
- Ensure the server does not silently fall back to seed data when production persistence is unavailable.
- Replace hard-coded location, dates, sample labels, external demo images, and display-only values with configuration or live data.
- Review external font/image dependencies for privacy, availability, licensing, caching, and CSP compatibility.

## 17. Deployment and Operations Requirements

### 17.1 Local development

1. Install server dependencies from `server/package.json`.
2. Start the API from the `server` directory with `npm start`.
3. Open the HTTP URL printed by the server, not the `index.html` file directly.
4. Use seed mode only for local development/demo work when Azure SQL variables are absent.

### 17.2 Production environment configuration

The production deployment shall define and protect:

- `PORT` or managed listener configuration.
- Azure SQL server, database, user, and password through a secrets manager.
- Session/signing secrets.
- Payment provider credentials.
- Email/SMS/push credentials.
- KYC and maps credentials if enabled.
- CORS allowed origins if the deployment becomes multi-origin.
- Logging, telemetry, environment, and feature flags.

### 17.3 Release process

- Run dependency install from a lockfile.
- Run lint, syntax/type checks, unit tests, integration tests, and security scans.
- Apply reviewed database migrations.
- Deploy immutable versioned application artifacts.
- Run readiness and smoke tests.
- Monitor errors and key business transactions.
- Maintain rollback procedure for application and database changes.

## 18. Open Decisions Requiring Product Approval

1. Final launch geography and service-area rules.
2. Canonical booking statuses and who may perform each transition.
3. Customer cancellation windows, fees, and refund destinations.
4. Payment methods, payment authorization timing, wallet rules, and gateway.
5. Partner payout schedule, commission, tax deduction, and failed payout process.
6. KYC fields, verification provider, document retention, and manual review process.
7. Notification channels and message templates.
8. Support SLA, escalation matrix, complaint severity model, and social-channel intake.
9. Loyalty earning, expiry, tier thresholds, and reward catalog.
10. Recommendation data sources, consent, explainability, and model governance.
11. Admin permission matrix and segregation of duties.
12. Data retention, deletion, export, and regional privacy obligations.
13. Production availability, performance, RPO, and RTO targets.
14. Provider ranking and search relevance policy.
15. Whether messaging, live tracking, portfolio media, favorites, and saved addresses are launch requirements or later phases.

## 19. Glossary

| Term | Definition |
|---|---|
| Customer | A user who searches for and books local services |
| Partner | A service professional or business that fulfills bookings |
| Provider | The marketplace profile representing a partner's business/service offering |
| Service | A bookable offering with a name, price, duration, and details |
| Booking | A customer request/reservation for one provider service at a date/time/location |
| Job | Partner-facing operational representation of work associated with a booking |
| Wallet | Customer account balance and ledger used for supported credits/payments |
| Loyalty points | Non-cash reward units tracked in a customer activity ledger |
| Ticket | A customer support case containing messages and operational status |
| Complaint | An operational issue record, including app or social-channel complaints |
| Seed mode | Development fallback in which built-in in-memory data is served without Azure SQL |
| Idempotency | Guarantee that safely repeating the same request does not create duplicate effects |
| IDOR | Insecure direct object reference, where changing an object ID bypasses ownership checks |
| PII | Personally identifiable information |
| KYC | Know Your Customer/provider identity verification |
| RPO | Maximum acceptable data loss measured in time |
| RTO | Maximum acceptable service restoration time |

---

## Appendix A: Baseline Demo Accounts

The current non-production client exposes demo-account hints for:

| Role | Email | Password |
|---|---|---|
| Customer | `demouser@mail.com` | `demo1234` |
| Partner | `demopart@mail.com` | `demo1234` |
| Admin | `demoadmin@mail.com` | `demo1234` |

These credentials must be removed, rotated, or gated behind an explicit development-only configuration before production release.

## Appendix B: Requirements Status Convention

- **Implemented baseline:** Represented by current client/server behavior and suitable for prototype testing.
- **Production required:** Necessary for a real marketplace but absent, incomplete, or insufficiently hardened in the current prototype.
- **Open decision:** Requires product, legal, security, finance, or operations approval before implementation can be considered final.

This SRS should be maintained alongside the approved BRD, SOW, API contract, database migration history, test plan, and release checklist. Changes to those artifacts should update requirement IDs and traceability rather than silently changing behavior.
