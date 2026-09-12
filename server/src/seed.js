// Built-in dummy dataset. Served by the API whenever Azure SQL is not
// connected, and used to bootstrap Azure tables on first connect.
const { hashPassword } = require('./auth');

const SALT = 's2d-demo-salt';
const demoPass = hashPassword('demo1234', SALT);

const users = [
  { id: 'u1', name: 'Armaan Mulani', email: 'demouser@mail.com', mobile: '+91 98765 43210', role: 'user', passwordHash: demoPass, salt: SALT, memberSince: 'March 2024', walletBalance: 1240, walletPromo: 340, walletRefund: 600, walletSaved: 300, loyaltyTier: 'Silver', loyaltyPoints: 1840, providerId: null },
  { id: 'u2', name: 'Rahul Sharma', email: 'demopart@mail.com', mobile: '+91 98200 11223', role: 'partner', passwordHash: demoPass, salt: SALT, memberSince: 'January 2023', walletBalance: 0, walletPromo: 0, walletRefund: 0, walletSaved: 0, loyaltyTier: 'Bronze', loyaltyPoints: 0, providerId: 'p1' },
  { id: 'u3', name: 'Armaan Mulani', email: 'demoadmin@mail.com', mobile: '+91 90000 00001', role: 'admin', passwordHash: demoPass, salt: SALT, memberSince: 'June 2022', walletBalance: 0, walletPromo: 0, walletRefund: 0, walletSaved: 0, loyaltyTier: 'Platinum', loyaltyPoints: 0, providerId: null },
  { id: 'u4', name: 'Priyanka Kapoor', email: 'priyanka@example.com', mobile: '+91 98111 22334', role: 'user', passwordHash: null, salt: null, memberSince: 'August 2023', walletBalance: 420, walletPromo: 120, walletRefund: 0, walletSaved: 300, loyaltyTier: 'Gold', loyaltyPoints: 3120, providerId: null },
  { id: 'u5', name: 'Farhan Khan', email: 'farhan@example.com', mobile: '+91 97777 88990', role: 'user', passwordHash: null, salt: null, memberSince: 'May 2024', walletBalance: 150, walletPromo: 0, walletRefund: 150, walletSaved: 0, loyaltyTier: 'Bronze', loyaltyPoints: 210, providerId: null },
];

const categories = [
  { key: 'electrician', label: 'Electrician', icon: 'ϟ', tone: 'electrician' },
  { key: 'plumbing', label: 'Plumbing', icon: '⌇', tone: 'plumbing' },
  { key: 'cleaning', label: 'Cleaning', icon: '✧', tone: 'cleaning' },
  { key: 'ac', label: 'AC repair', icon: '◉', tone: 'ac' },
  { key: 'tutoring', label: 'Tutors', icon: 'a+', tone: 'tutoring' },
  { key: 'beauty', label: 'Beauty', icon: '♡', tone: 'beauty' },
  { key: 'appliance', label: 'Appliances', icon: '▤', tone: 'appliance' },
];

const providers = [
  { id: 'p1', name: 'Rahul Electrical Services', category: 'Electrician', categoryKey: 'electrician', exp: '8 years experience', expYears: 8, rating: 4.8, reviewsCount: 1248, responseMin: 9, distanceKm: 1.2, priceFrom: 299, priceUnit: '', tags: ['Wiring', 'Fan repair', 'Switches'], initials: 'RS', verified: true, available: true, area: 'Andheri, Versova, Lokhandwala, Juhu', about: 'Licensed electrician with eight years of experience in residential repairs, installations and safety checks. Clear pricing before work begins.', trust: ['Identity verified', 'Background checked', 'GST registered'], slots: ['Today, 10:30 AM', 'Today, 12:00 PM', 'Today, 2:30 PM', 'Today, 4:00 PM'], verification: 'Verified', status: 'Active', availability: 'Available', jobsCompleted: 482 },
  { id: 'p2', name: 'CoolCare Experts', category: 'AC Repair', categoryKey: 'ac', exp: '12 years experience', expYears: 12, rating: 4.7, reviewsCount: 2314, responseMin: 12, distanceKm: 2.4, priceFrom: 399, priceUnit: '', tags: ['AC service', 'Installation', 'Gas refill'], initials: 'CC', verified: true, available: true, area: 'Andheri West, Bandra, Juhu', about: 'AC specialists for service, deep cleaning, installation and gas refills. Upfront quotes and service warranty on every visit.', trust: ['Identity verified', 'Background checked', 'GST registered'], slots: ['Today, 1:00 PM', 'Today, 3:30 PM', 'Tomorrow, 10:00 AM'], verification: 'Verified', status: 'Active', availability: 'Available', jobsCompleted: 356 },
  { id: 'p3', name: "Neha's Home Tutors", category: 'Math Tutor', categoryKey: 'tutoring', exp: '6 years experience', expYears: 6, rating: 4.9, reviewsCount: 864, responseMin: 22, distanceKm: 0.8, priceFrom: 500, priceUnit: '/hr', tags: ['Class 8–12', 'CBSE', 'Online'], initials: 'NT', verified: true, available: true, area: 'Andheri West, Online', about: 'Experienced maths tutor for Classes 8–12 (CBSE/ICSE). Concept-first teaching with regular parent updates.', trust: ['Identity verified', 'Background checked'], slots: ['Today, 5:00 PM', 'Tomorrow, 11:00 AM'], verification: 'Verified', status: 'Active', availability: 'Available', jobsCompleted: 410 },
  { id: 'p4', name: 'Spark & Switch Co.', category: 'Electrician', categoryKey: 'electrician', exp: '5 years experience', expYears: 5, rating: 4.7, reviewsCount: 402, responseMin: 14, distanceKm: 2.1, priceFrom: 349, priceUnit: '', tags: ['Wiring', 'Fan repair', 'Switches'], initials: 'SS', verified: true, available: true, area: 'Andheri, Versova', about: 'Fast-response electrical team for homes and small offices across Andheri.', trust: ['Identity verified', 'Background checked'], slots: ['Today, 12:00 PM', 'Today, 3:00 PM'], verification: 'Verified', status: 'Active', availability: 'Available', jobsCompleted: 188 },
  { id: 'p5', name: 'Aman Electrical Works', category: 'Electrician', categoryKey: 'electrician', exp: '9 years experience', expYears: 9, rating: 4.9, reviewsCount: 156, responseMin: 18, distanceKm: 3.4, priceFrom: 399, priceUnit: '', tags: ['Wiring', 'Safety audit', 'Panels'], initials: 'AE', verified: false, available: false, area: 'Andheri, Goregaon', about: 'Detail-oriented electrician specialising in safety audits and panel work.', trust: ['Identity verified'], slots: ['Tomorrow, 9:00 AM'], verification: 'Pending', status: 'Review', availability: 'Unavailable', jobsCompleted: 91 },
  { id: 'p6', name: 'Sukh Clean Home Services', category: 'Cleaning', categoryKey: 'cleaning', exp: '4 years experience', expYears: 4, rating: 4.6, reviewsCount: 733, responseMin: 25, distanceKm: 1.9, priceFrom: 899, priceUnit: '', tags: ['Deep cleaning', 'Kitchen', 'Bathroom'], initials: 'SC', verified: true, available: true, area: 'Andheri West, Versova', about: 'Trained cleaning crews with eco-friendly supplies for homes of every size.', trust: ['Identity verified', 'Background checked'], slots: ['Today, 12:00 PM', 'Tomorrow, 10:30 AM'], verification: 'Verified', status: 'Active', availability: 'Available', jobsCompleted: 264 },
];

const services = [
  { id: 's1', providerId: 'p1', name: 'Electrical inspection', detail: 'Complete safety check · 45 min', price: 299, durationMin: 45, active: true },
  { id: 's2', providerId: 'p1', name: 'Fan installation or repair', detail: 'Diagnosis included · 30 min', price: 349, durationMin: 30, active: true },
  { id: 's3', providerId: 'p1', name: 'Switchboard repair', detail: 'Parts billed separately · 30 min', price: 249, durationMin: 30, active: true },
  { id: 's4', providerId: 'p1', name: 'Complete home wiring', detail: 'Full-home wiring · 2–3 hrs', price: 1299, durationMin: 150, active: false },
  { id: 's5', providerId: 'p2', name: 'AC deep cleaning', detail: 'Foam-jet indoor + outdoor · 60 min', price: 1599, durationMin: 60, active: true },
  { id: 's6', providerId: 'p2', name: 'AC service & gas check', detail: 'Service plus coolant check · 45 min', price: 399, durationMin: 45, active: true },
  { id: 's7', providerId: 'p2', name: 'AC installation', detail: 'Split / window · 90 min', price: 1499, durationMin: 90, active: true },
  { id: 's8', providerId: 'p3', name: 'Maths tuition (Class 10)', detail: 'One-on-one · 60 min', price: 500, durationMin: 60, active: true },
  { id: 's9', providerId: 'p3', name: 'Maths tuition (Class 12)', detail: 'One-on-one · 60 min', price: 600, durationMin: 60, active: true },
  { id: 's10', providerId: 'p4', name: 'Electrical inspection', detail: 'Complete safety check · 45 min', price: 349, durationMin: 45, active: true },
  { id: 's11', providerId: 'p5', name: 'Home safety audit', detail: 'Wiring + panels · 60 min', price: 399, durationMin: 60, active: true },
  { id: 's12', providerId: 'p6', name: 'Full home deep cleaning', detail: '2 BHK · 3–4 hrs', price: 899, durationMin: 210, active: true },
];

const reviews = [
  { id: 'r1', providerId: 'p1', author: 'Priya Mehta', rating: 5, text: 'Neat work, explained everything before starting.', at: '08 Sept' },
  { id: 'r2', providerId: 'p1', author: 'Arjun Shah', rating: 5, text: 'On time and very professional.', at: '05 Sept' },
  { id: 'r3', providerId: 'p2', author: 'Armaan Mulani', rating: 5, text: 'AC cooling like new after the deep clean.', at: '02 Sept' },
];

const bookings = [
  { id: 'b1', code: 'BK-2026-0912-884', userId: 'u1', providerId: 'p1', serviceId: 's1', serviceName: 'Electrical inspection', monthLabel: 'SEP', dayNum: '12', dateLabel: 'Friday, 12 Sept', timeLabel: '2:30 PM', address: 'Home · 14B, Shantivan, Andheri West', price: 299, fee: 29, gst: 15, amount: 343, status: 'confirmed', payment: 'UPI', createdAt: '10 Sept, 9:18 AM', history: [{ label: 'Booking requested', at: 'Wed, 9:18 AM' }, { label: 'Rahul confirmed your booking', at: 'Wed, 9:42 AM' }] },
  { id: 'b2', code: 'BK-2026-0915-207', userId: 'u1', providerId: 'p2', serviceId: 's5', serviceName: 'AC deep cleaning', monthLabel: 'SEP', dayNum: '15', dateLabel: 'Monday, 15 Sept', timeLabel: '5:30 PM', address: 'Home · 14B, Shantivan, Andheri West', price: 1599, fee: 155, gst: 81, amount: 1835, status: 'pending', payment: 'UPI', createdAt: '09 Sept, 6:02 PM', history: [{ label: 'Booking requested', at: 'Tue, 6:02 PM' }] },
  { id: 'b3', code: 'BK-2026-0902-721', userId: 'u1', providerId: 'p2', serviceId: 's5', serviceName: 'AC deep cleaning', monthLabel: 'SEP', dayNum: '02', dateLabel: 'Tuesday, 02 Sept', timeLabel: '11:00 AM', address: 'Home · 14B, Shantivan, Andheri West', price: 1599, fee: 155, gst: 81, amount: 1835, status: 'completed', payment: 'UPI', createdAt: '30 Aug, 10:14 AM', history: [{ label: 'Booking requested', at: '30 Aug, 10:14 AM' }, { label: 'CoolCare confirmed your booking', at: '30 Aug, 11:03 AM' }, { label: 'Service completed', at: '02 Sept, 12:05 PM' }] },
  { id: 'b4', code: 'BK-2026-0904-552', userId: 'u1', providerId: 'p1', serviceId: 's2', serviceName: 'Fan installation or repair', monthLabel: 'SEP', dayNum: '04', dateLabel: 'Thursday, 04 Sept', timeLabel: '4:00 PM', address: 'Home · 14B, Shantivan, Andheri West', price: 349, fee: 34, gst: 18, amount: 401, status: 'completed', payment: 'UPI', createdAt: '03 Sept, 2:40 PM', history: [{ label: 'Booking requested', at: '03 Sept, 2:40 PM' }, { label: 'Rahul confirmed your booking', at: '03 Sept, 3:15 PM' }, { label: 'Service completed', at: '04 Sept, 4:35 PM' }] },
];

const walletTxns = [
  { id: 'WT-920184', userId: 'u1', name: 'Reward credit', meta: 'Weekend cleaning offer', amount: 150, kind: 'credit', date: '10 Sept', reason: 'Weekend campaign', status: 'Completed' },
  { id: 'WT-920183', userId: 'u1', name: 'Service payment', meta: 'AC deep cleaning · 02 Sept', amount: -1599, kind: 'debit', date: '02 Sept', reason: 'Booking payment', status: 'Completed' },
  { id: 'WT-920172', userId: 'u1', name: 'Refund received', meta: 'Cancelled plumbing booking', amount: 600, kind: 'credit', date: '28 Aug', reason: 'Support resolution', status: 'Completed' },
];

const loyaltyActivity = [
  { id: 'l1', userId: 'u1', name: 'Booking completed', meta: 'Electrical repair · 04 Sept', points: 108 },
  { id: 'l2', userId: 'u1', name: 'Reward redeemed', meta: 'Home cleaning offer', points: -600 },
];

const recommendations = [
  { id: 'rec1', title: 'Your AC service may be due', text: 'It has been 11 months since your last service.', cta: 'Book AC service', providerId: 'p2', relevance: 86, basis: 'Based on your past booking' },
  { id: 'rec2', title: 'Weekend cleaning works for you', text: 'You usually book Saturday mornings.', cta: 'Explore cleaning', providerId: 'p6', relevance: 74, basis: 'Based on your booking pattern' },
  { id: 'rec3', title: 'Demand is rising near you', text: 'AC repair slots are filling 24% faster this week.', cta: 'Explore technicians', providerId: 'p2', relevance: 69, basis: 'Based on marketplace demand' },
];

const tickets = [
  { id: 'TK-8214', userId: 'u1', customerName: 'Armaan Mulani', subject: 'Refund for cancelled service', category: 'Payment or refund', status: 'In progress', priority: 'Medium', updated: 'today', messages: [{ from: 'customer', text: 'Hi, I cancelled my plumbing booking but cannot see the refund in my wallet yet.', at: '10:14 AM' }, { from: 'agent', text: 'Hi Armaan, the refund was initiated this morning. It can take up to 2 hours to show in your Shop2Door wallet.', at: '10:20 AM · N. Shah' }] },
  { id: 'TK-8107', userId: 'u1', customerName: 'Armaan Mulani', subject: 'Change booking time', category: 'A booking', status: 'Resolved', priority: 'Low', updated: 'yesterday', messages: [] },
  { id: 'TK-8251', userId: 'u4', customerName: 'Priyanka Kapoor', subject: 'Payment refunded but not received', category: 'Booking & payments', status: 'In progress', priority: 'High', updated: '18 min ago', messages: [{ from: 'customer', text: 'Hi, I cancelled my AC service yesterday but cannot see the refund in my wallet yet.', at: '10:14 AM' }, { from: 'agent', text: 'Hi Priyanka, the refund was initiated this morning. It can take up to 2 hours to show in your Shop2Door wallet.', at: '10:20 AM · N. Shah' }] },
  { id: 'TK-8248', userId: 'u1', customerName: 'Armaan Mulani', subject: 'Need to reschedule my booking', category: 'A booking', status: 'In progress', priority: 'Medium', updated: '1 hr ago', messages: [] },
  { id: 'TK-8245', userId: 'u5', customerName: 'Farhan Khan', subject: 'Provider has not arrived', category: 'Provider issue', status: 'In progress', priority: 'High', updated: '2 hr ago', messages: [] },
];

const complaints = [
  { id: 'CMP-8482', title: 'Provider did not arrive', customer: 'Priyanka Kapoor', channel: 'app', priority: 'HIGH', status: 'New', age: '18 min ago' },
  { id: 'CMP-8479', title: 'Refund still pending', customer: 'Farhan Khan', channel: 'app', priority: 'MEDIUM', status: 'Investigating', age: '42 min ago' },
  { id: 'CMP-8476', title: 'Payment deducted twice', customer: 'Ria Bhatia', channel: 'app', priority: 'HIGH', status: 'New', age: '1 hr ago' },
  { id: 'CMP-8480', title: 'Instagram · Provider never arrived', customer: 'Priyanka Kapoor', channel: 'social', priority: 'HIGH', status: 'New', age: '26 min ago' },
  { id: 'CMP-8474', title: 'Facebook · Refund issue', customer: 'Rohan Kulkarni', channel: 'social', priority: 'MEDIUM', status: 'Investigating', age: '1 hr ago' },
];

const jobs = [
  { id: 'j1', providerId: 'p1', kind: 'job', customer: 'Arjun Shah', customerMeta: '★ 4.9 · 12 bookings', type: 'ELECTRICAL REPAIR', service: 'Ceiling fan installation', dateLabel: 'Today', timeLabel: '10:30 AM', place: 'Lokhandwala, Andheri W', price: 499, status: 'upcoming', note: 'New ceiling fan is ready. Please bring standard mounting hardware if possible.', payment: 'Online payment' },
  { id: 'j2', providerId: 'p1', kind: 'job', customer: 'Priya Mehta', customerMeta: '★ 4.8 · 6 bookings', type: 'ELECTRICAL INSPECTION', service: 'Complete home wiring check', dateLabel: 'Today', timeLabel: '2:00 PM', place: 'Four Bungalows, Andheri W', price: 1299, status: 'upcoming', note: '', payment: 'Online payment' },
  { id: 'j3', providerId: 'p1', kind: 'job', customer: 'Rohit Iyer', customerMeta: '★ 4.7 · 3 bookings', type: 'SWITCHBOARD REPAIR', service: 'Replace damaged switches', dateLabel: 'Today', timeLabel: '5:30 PM', place: 'Versova, Andheri W', price: 349, status: 'upcoming', note: '', payment: 'UPI' },
  { id: 'r1', providerId: 'p1', kind: 'request', customer: 'Arjun Shah', customerMeta: '★ 4.9 · 12 bookings', type: 'ELECTRICAL INSPECTION', service: 'Electrical inspection', dateLabel: 'Today', timeLabel: '10:30 AM', place: 'Lokhandwala, Andheri W', price: 299, status: 'new', note: '', payment: 'Online payment' },
  { id: 'r2', providerId: 'p1', kind: 'request', customer: 'Nisha Desai', customerMeta: '★ 4.9 · 12 bookings', type: 'FAN INSTALLATION', service: 'Fan installation or repair', dateLabel: 'Today', timeLabel: '12:00 PM', place: 'Versova, Andheri W', price: 349, status: 'new', note: '', payment: 'UPI' },
  { id: 'r3', providerId: 'p1', kind: 'request', customer: 'Aditi Rao', customerMeta: '★ 4.9 · 12 bookings', type: 'SWITCHBOARD REPAIR', service: 'Switchboard repair', dateLabel: 'Tomorrow', timeLabel: '11:30 AM', place: 'Juhu, Mumbai', price: 249, status: 'new', note: '', payment: 'Online payment' },
];

const availability = {
  p1: { open: true, note: "You'll be shown to nearby customers for new jobs.", schedule: [
    { day: 'Monday', open: true, from: '9:00 AM', to: '7:00 PM' },
    { day: 'Tuesday', open: true, from: '9:00 AM', to: '7:00 PM' },
    { day: 'Wednesday', open: true, from: '9:00 AM', to: '7:00 PM' },
    { day: 'Thursday', open: true, from: '9:00 AM', to: '7:00 PM' },
    { day: 'Friday', open: true, from: '9:00 AM', to: '7:00 PM' },
    { day: 'Saturday', open: true, from: '10:00 AM', to: '4:00 PM' },
    { day: 'Sunday', open: false, from: 'Unavailable', to: '' },
  ]},
};

const earnings = {
  p1: { week: 12840, weekDelta: '↑ 18% vs last week', pending: 2840, pendingNote: 'Arrives 14 Sept', completed: 23, avg: 558, avgNote: 'Avg. ₹558 / job', series: [42, 60, 49, 75, 58, 92, 80, 67, 95, 71, 84, 64], payments: [
    { name: 'Electrical inspection · Priya Mehta', meta: 'Completed 09 Sept · Platform fee ₹45', amount: '+ ₹854' },
    { name: 'Fan installation · Rohan Kulkarni', meta: 'Completed 08 Sept · Platform fee ₹35', amount: '+ ₹664' },
  ]},
};

const overview = {
  metrics: [
    { label: 'TOTAL CUSTOMERS', value: '48,290', sub: '4,208 active this week', trend: '↑ 12.4%', tone: 'up' },
    { label: "TODAY'S BOOKINGS", value: '1,284', sub: 'vs 1,188 yesterday', trend: '↑ 8.1%', tone: 'up' },
    { label: 'REVENUE TODAY', value: '₹8.42L', sub: '₹7.24L target pace', trend: '↑ 16.2%', tone: 'up' },
    { label: 'CUSTOMER SATISFACTION', value: '4.72', suffix: '/5', sub: 'From 6,492 ratings', trend: '↑ 0.3%', tone: 'neutral' },
  ],
  series: [880, 1010, 940, 1150, 1090, 1330, 1284],
  seriesLabels: ['Sep 4', 'Sep 5', 'Sep 6', 'Sep 7', 'Sep 8', 'Sep 9', 'Today'],
  aiInsight: { title: 'Weekend cleaning demand will exceed capacity.', text: 'Expected demand is 24% higher than available provider slots in Mumbai West this weekend.', confidence: 82 },
  topCategory: { name: 'AC Repair', revenue: '₹1.38L', note: 'Revenue in the last 7 days', bookings: '2,482', rating: '4.8', bar: 78 },
};

const loyaltyAdmin = {
  totals: [
    { label: 'TOTAL MEMBERS', value: '31,482', sub: '65% of customers' },
    { label: 'POINTS ISSUED', value: '8.4M', sub: 'this month' },
    { label: 'REDEMPTION RATE', value: '31%', sub: '↑ 4.2% vs last month' },
  ],
  tiers: [
    { tier: 'Bronze', members: '12,840 members', share: '41%' },
    { tier: 'Silver', members: '10,912 members', share: '35%' },
    { tier: 'Gold', members: '5,950 members', share: '19%' },
    { tier: 'Platinum', members: '1,780 members', share: '5%' },
  ],
  campaign: { title: 'September Home Care', text: '2× points on AC and appliance services through 30 September.' },
};

const insights = [
  { tag: 'DEMAND PREDICTION', title: 'AC repair demand is projected to rise 28% this weekend.', context: 'Mumbai West · 86% confidence', action: 'Recruit technicians' },
  { tag: 'CUSTOMER RETENTION', title: '1,240 repeat customers have not booked in 60+ days.', context: 'High-value segment · 78% confidence', action: 'Create reactivation offer' },
  { tag: 'PROVIDER CAPACITY', title: 'Weekend cleaning requests will exceed available slots.', context: 'Andheri + Bandra · 82% confidence', action: 'Open surge availability' },
  { tag: 'COMPLAINT INTELLIGENCE', title: 'Payment complaints increased 14% week over week.', context: '321 tickets analysed · 73% confidence', action: 'Review messaging' },
];

const exportsLog = [
  { id: 'EXP-10482', by: 'CS Agent', records: '2,450', format: 'Masked CSV', status: 'Completed' },
  { id: 'EXP-10474', by: 'Admin 02', records: '4,876', format: 'Excel', status: 'Completed' },
  { id: 'EXP-10468', by: 'Ops Lead', records: '1,284', format: 'Masked CSV', status: 'Expired' },
];

const auditLog = [
  { at: '10 Sept, 10:24', user: 'CS_AGENT_104', role: 'CS agent', action: 'Viewed customer profile', resource: 'CUS-48820', result: 'Success' },
  { at: '10 Sept, 10:16', user: 'ADMIN_02', role: 'Administrator', action: 'Exported records', resource: 'EXP-10482', result: 'Success' },
  { at: '10 Sept, 09:58', user: 'PROVIDER_284', role: 'Provider', action: 'Updated availability', resource: 'PRO-284', result: 'Success' },
];

module.exports = { users, categories, providers, services, reviews, bookings, walletTxns, loyaltyActivity, recommendations, tickets, complaints, jobs, availability, earnings, overview, loyaltyAdmin, insights, exportsLog, auditLog };
