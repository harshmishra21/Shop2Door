const { hashPassword } = require('./auth');

const accounts = {
  admin: { email: 'admin@shop2door.in', password: 'S2D-Admin-2026!' },
  user: { email: 'armaan.mulani@shop2door.in', password: 'S2D-Armaan-2026!' },
  partners: [
    { email: 'partner1@shop2door.in', password: 'S2D-Partner1-2026!', name: 'Aarav Mehta', businessName: 'Aarav Home Repairs', category: 'Electrician', categoryKey: 'electrician' },
    { email: 'partner2@shop2door.in', password: 'S2D-Partner2-2026!', name: 'Diya Shah', businessName: 'Diya Clean Living', category: 'Cleaning', categoryKey: 'cleaning' },
    { email: 'partner3@shop2door.in', password: 'S2D-Partner3-2026!', name: 'Kabir Rao', businessName: 'Rao Cooling Works', category: 'AC Repair', categoryKey: 'ac' },
    { email: 'partner4@shop2door.in', password: 'S2D-Partner4-2026!', name: 'Meera Iyer', businessName: 'Meera Learning Studio', category: 'Tutors', categoryKey: 'tutoring' },
  ],
};

const password = (value) => {
  const salt = `s2d-${value.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 18)}`;
  return { passwordHash: hashPassword(value, salt), salt };
};
const users = [
  { id: 'admin-1', name: 'Shop2Door Admin', email: accounts.admin.email, mobile: '+91 90000 00000', role: 'admin', ...password(accounts.admin.password), memberSince: 'September 2026', walletBalance: 0, walletPromo: 0, walletRefund: 0, walletSaved: 0, loyaltyTier: 'Bronze', loyaltyPoints: 0, providerId: null },
  { id: 'user-1', name: 'Armaan Mulani', email: accounts.user.email, mobile: '+91 98765 43210', role: 'user', ...password(accounts.user.password), memberSince: 'September 2026', walletBalance: 0, walletPromo: 0, walletRefund: 0, walletSaved: 0, loyaltyTier: 'Bronze', loyaltyPoints: 0, providerId: null },
  ...accounts.partners.map((account, index) => ({ id: `partner-${index + 1}`, name: account.name, email: account.email, mobile: '', role: 'partner', ...password(account.password), memberSince: 'September 2026', walletBalance: 0, walletPromo: 0, walletRefund: 0, walletSaved: 0, loyaltyTier: 'Bronze', loyaltyPoints: 0, providerId: `provider-${index + 1}` })),
];

const categories = [
  { key: 'electrician', label: 'Electrician', icon: 'E', tone: 'electrician', sort: 1 },
  { key: 'cleaning', label: 'Cleaning', icon: 'C', tone: 'cleaning', sort: 2 },
  { key: 'ac', label: 'AC repair', icon: 'A', tone: 'ac', sort: 3 },
  { key: 'tutoring', label: 'Tutors', icon: 'T', tone: 'tutoring', sort: 4 },
];

const providers = accounts.partners.map((account, index) => ({
  id: `provider-${index + 1}`, name: account.businessName, category: account.category, categoryKey: account.categoryKey,
  exp: 'New on Shop2Door', expYears: 0, rating: 0, reviewsCount: 0, responseMin: 30, distanceKm: 1 + index,
  priceFrom: 299, priceUnit: '', tags: [], initials: account.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(),
  verified: false, available: true, area: 'Mumbai', about: `${account.businessName} is available for local bookings.`, trust: [],
  slots: ['Tomorrow, 10:00 AM'], verification: 'Pending', status: 'Active', availability: 'Available', jobsCompleted: 0,
}));
const serviceNames = {
  electrician: ['Electrical inspection', 'Fan installation', 'Switchboard repair', 'Light installation', 'Home wiring check'],
  cleaning: ['Home deep cleaning', 'Kitchen cleaning', 'Bathroom cleaning', 'Move-in cleaning', 'Sofa cleaning'],
  ac: ['AC inspection', 'AC deep cleaning', 'AC service', 'AC installation', 'AC gas check'],
  tutoring: ['Maths tutoring', 'Science tutoring', 'English tutoring', 'Exam preparation', 'Homework support'],
};
const services = providers.flatMap((provider) => serviceNames[provider.categoryKey].map((name, index) => ({
  id: `${provider.id}-service-${index + 1}`, providerId: provider.id, name, detail: 'Professional service visit', price: 299 + index * 100, durationMin: 60, active: true,
})));
const availability = Object.fromEntries(providers.map((provider) => [provider.id, {
  open: true, note: 'Available for new customer bookings.',
  schedule: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, index) => ({ day, open: index < 6, from: '9:00 AM', to: '7:00 PM' })),
}]));

const complaints = [
  { id: 'CMP-001', customer: 'Armaan Mulani', title: 'Refund not processed for cancelled booking', channel: 'app', priority: 'HIGH', status: 'New', age: '2h', createdAt: '2026-09-25' },
  { id: 'CMP-002', customer: 'Priya Sharma', title: 'Service provider arrived 2 hours late', channel: 'app', priority: 'MEDIUM', status: 'Investigating', age: '1d', createdAt: '2026-09-24' },
  { id: 'CMP-003', customer: 'Rahul Verma', title: 'Quality of cleaning service was poor', channel: 'app', priority: 'MEDIUM', status: 'Resolution proposed', age: '3d', createdAt: '2026-09-22' },
  { id: 'CMP-004', customer: 'Social User @twitter', title: 'Booking system showing wrong prices', channel: 'social', priority: 'HIGH', status: 'New', age: '5h', createdAt: '2026-09-25' },
  { id: 'CMP-005', customer: 'Anita Desai', title: 'Provider cancelled last minute without notice', channel: 'app', priority: 'HIGH', status: 'Resolved', age: '1w', createdAt: '2026-09-18' },
];

module.exports = {
  accounts, users, categories, providers, services, availability,
  reviews: [], bookings: [], walletTxns: [], loyaltyActivity: [], recommendations: [], tickets: [], complaints, jobs: [], earnings: {},
  overview: { metrics: [], series: [], seriesLabels: [], aiInsight: {}, topCategory: {} }, loyaltyAdmin: { totals: [], tiers: [], campaign: {} },
  insights: [], exportsLog: [], auditLog: [],
};
