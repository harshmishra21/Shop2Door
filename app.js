const $ = (s, p = document) => p.querySelector(s);
const $$ = (s, p = document) => [...p.querySelectorAll(s)];
const toast = $('#toast');
const views = { customer: $('#customer-view'), partner: $('#partner-view'), admin: $('#admin-view') };
const nav = $('#main-nav');
let role = 'customer', screen = 'home';

function applyTheme(themeName = localStorage.getItem('shop2door-theme') || 'light') {
  const isDark = themeName === 'dark';
  document.body.classList.toggle('dark-mode', isDark);
  document.body.setAttribute('data-theme', themeName);
  const toggle = $('.theme-toggle');
  if (toggle) {
    toggle.textContent = isDark ? '☀' : '☾';
    toggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  }
}

/* ---------------- API client + session ---------------- */
let session = null;
const SESSION_KEY = 's2d-session';
try { session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch (e) {}
function saveSession() { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); }
function clearSession() { localStorage.removeItem(SESSION_KEY); }
const viewOf = (r) => (r === 'user' ? 'customer' : r);
const isLoopbackHost = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
const isCapacitor = !!(window.Capacitor || window.capacitor);
const capacitorServerUrl = (window.Capacitor?.config?.server?.url) || '';

// Priority: 1) Build-time inject, 2) Capacitor server.url, 3) User-configured (localStorage), 4) Auto-detect
function resolveApiOrigin() {
  if (window.__SHOP2DOOR_API_ORIGIN__) return window.__SHOP2DOOR_API_ORIGIN__;
  if (capacitorServerUrl) return capacitorServerUrl;
  const stored = localStorage.getItem('s2d-api-origin');
  if (stored) return stored;
  if (window.location.protocol === 'file:' || isCapacitor) {
    return 'http://10.0.2.2:3001'; // Android emulator -> host machine
  }
  if (isLoopbackHost && Number(window.location.port) >= 5000) {
    return 'http://localhost:3001'; // Vite/Live Server dev
  }
  return window.location.origin; // Production / same-origin
}
const apiOrigin = resolveApiOrigin();

// Helper to override API origin at runtime (useful for testing)
window.__shop2doorSetApiOrigin = (url) => {
  localStorage.setItem('s2d-api-origin', url);
  location.reload();
};

async function api(path, { method = 'GET', body = null } = {}) {
  let res;
  if (window.location.protocol === 'file:') {
    throw new Error('Open Shop2Door at the HTTP URL printed by `npm start`, not by opening index.html directly.');
  }
  try {
    res = await fetch(apiOrigin + '/api' + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(session && session.token ? { Authorization: 'Bearer ' + session.token } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new Error('Backend unreachable — start it with `npm start` inside /server, then reload.');
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) { signOut(true); throw new Error('Session expired — please sign in again.'); }
  if (!res.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}

/* ---------------- shared template helpers (design unchanged) ---------------- */
const navs = {
  customer: [['home', '◈', 'Discover'], ['search', '⌕', 'Search services'], ['bookings', '▣', 'My bookings'], ['wallet', '◇', 'Wallet'], ['loyalty', '✦', 'Rewards'], ['support', '◌', 'Support'], ['profile', '♧', 'Profile']],
  partner: [['dashboard', '◈', 'Dashboard'], ['requests', '▣', 'Booking requests'], ['services', '⊞', 'My services'], ['availability', '◷', 'Availability'], ['earnings', '₹', 'Earnings'], ['profile', '♙', 'Profile'], ['kyc', '✓', 'Verification']],
  admin: [['dashboard', '◈', 'Overview'], ['customers', '♙', 'Customers'], ['providers', '♜', 'Providers'], ['bookings', '▣', 'Bookings'], ['queries', '◌', 'Queries'], ['complaints', '⚑', 'Complaints'], ['social', '◎', 'Social complaints'], ['loyalty', '✦', 'Loyalty'], ['wallet', '◇', 'Wallet'], ['insights', '✦', 'AI insights'], ['reports', '↧', 'Reports & exports'], ['audit', '◷', 'Audit logs']]
};
const names = {
  customer: { search: ['Find a service', 'Search by service, task, or natural language.'], results: ['Electricians near Andheri West', '14 verified professionals available today.'], provider: ['Provider profile', 'Verified professional serving Andheri West.'], booking: ['Book your service', 'Choose the details for your visit.'], confirmation: ['Booking confirmed', 'Your appointment is safely booked.'], tracking: ['Track booking', 'Live status of your appointment.'], bookings: ['My bookings', 'Keep track of every appointment.'], wallet: ['Shop2Door wallet', 'Credits, refunds and payments in one place.'], loyalty: ['Your rewards', 'More bookings, better benefits.'], reviews: ['Rate your experience', 'Your feedback helps the community choose with confidence.'], support: ['Help & support', 'Find an answer or start a support request.'], complaint: ['Tell us what happened', 'We will route your request to the right specialist.'], profile: ['Your profile', 'Manage your account, addresses and preferences.'], recommendations: ['For you', 'Personalized suggestions based on your permitted activity.'] },
  partner: { services: ['Your services', 'Manage what customers can book.'], availability: ['Availability', 'Choose when you accept new work.'], requests: ['Booking requests', 'Respond quickly to keep your ranking strong.'], job: ['Job details', 'Review the request before responding.'], earnings: ['Earnings', 'Your completed work and payouts.'], profile: ['Business profile', 'The information customers see before booking.'], kyc: ['Verification', 'Complete verification to receive more bookings.'] },
  admin: { customers: ['Customers', 'Customer records'], providers: ['Providers', 'Providers across cities'], bookings: ['Bookings', 'Marketplace activity'], queries: ['Support inbox', 'Tickets needing attention'], complaints: ['Complaint management', 'Review, assign and resolve customer issues'], social: ['Social complaints', 'Official-channel mentions requiring attention'], loyalty: ['Loyalty management', 'Tiers, rewards and points activity'], wallet: ['Wallet ledger', 'Customer balance and transaction controls'], insights: ['AI insights', 'Intelligence from marketplace activity'], reports: ['Reports & exports', 'Generate permission-safe data exports'], audit: ['Audit logs', 'Recent platform and administrative activity'] }
};

const btn = (text, route, kind = 'primary-button') => `<button class="${kind}" data-route="${route}">${text}${kind === 'primary-button' ? ' <span>→</span>' : ''}</button>`;
const badge = (text, type = 'neutral') => `<span class="badge ${type}">${text}</span>`;
const field = (label, value, area = false) => `<label class="form-field"><span>${label}</span>${area ? `<textarea placeholder="${value}"></textarea>` : `<input value="${value}"/>`}</label>`;
const table = (heads, rows) => `<div class="data-table"><div class="table-scroll"><table><thead><tr>${heads.map((x) => `<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((x) => `<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`;
const header = (r, s, body, actions = '') => { const [title, sub] = names[r][s] || ['Shop2Door', '']; return `<section class="generated-page"><div class="page-head"><div><p class="eyebrow">${r === 'admin' ? 'OPERATIONS' : r === 'partner' ? 'PARTNER SPACE' : 'SHOP2DOOR'}</p><h1>${title}</h1><p class="subhead">${sub}</p></div>${actions}</div>${body}</section>`; };
const card = (title, body) => `<article class="surface-card"><h3>${title}</h3>${body}</article>`;
const tx = (name, meta, amount, kind = 'green') => `<div class="transaction"><span class="transaction-icon ${kind}">${kind === 'green' ? '↓' : '↑'}</span><div><b>${name}</b><small>${meta}</small></div><strong class="${kind}">${amount}</strong></div>`;
const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const loadingHTML = `<div class="state-card"><div class="state-icon">◌</div><h3>Loading…</h3><p>Fetching the latest from Shop2Door.</p></div>`;
const errorHTML = (err) => `<div class="state-card"><div class="state-icon">⚠</div><h3>Could not load this screen</h3><p>${esc(err.message || err)}</p><button class="primary-button" data-action="retry">Try again <span>→</span></button></div>`;
const empty = (title, text) => `<div class="state-card"><div class="state-icon">⌕</div><h3>${title}</h3><p>${text}</p>${btn('Browse services', 'search')}</div>`;

/* ---------------- small utilities ---------------- */
function todayLabel() { return new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase(); }
function greeting() { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; }
function firstName() { return (session.user.name || 'there').trim().split(/\s+/)[0]; }
function nextDays(n = 5) {
  const out = [], now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now); d.setDate(now.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    out.push({ iso, dow: d.toLocaleDateString('en-GB', { weekday: 'short' }), num: String(d.getDate()).padStart(2, '0'), mon: d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase(), full: d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }) });
  }
  return out;
}
function breakup(price) { const fee = Math.round(price * 0.097), gst = Math.round((price + fee) * 0.046); return { price, fee, gst, amount: price + fee + gst }; }
function bookingCalendarParts(booking) {
  const match = String(booking.dateLabel || '').match(/^[^,]+,\s*(\d{1,2})\s+([A-Za-z]+)/);
  return { day: match ? match[1] : String(booking.dayNum || '').replace(/\D/g, ''), month: match ? match[2].slice(0, 3).toUpperCase() : String(booking.monthLabel || '').slice(0, 3).toUpperCase() };
}
function svgChart(vals, labels) {
  const W = 620, H = 210, pad = 8, max = 20;
  const pts = vals.map((v, i) => [pad + (i * (W - pad * 2)) / (vals.length - 1), H - pad - (v / max) * (H - pad * 2)]);
  const line = pts.map((p, i) => {
    if (i === 0) return `M${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
    const [x0, y0] = pts[i - 1], dx = (p[0] - x0) / 2;
    return `C${(x0 + dx).toFixed(1)} ${y0.toFixed(1)},${(p[0] - dx).toFixed(1)} ${p[1].toFixed(1)},${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
  }).join(' ');
  const yLabels = [20, 18, 16, 14, 12, 10, 8, 6, 4, 2, 0];
  return `<div class="fake-chart"><div class="chart-y">${yLabels.map(v => `<span>${v}</span>`).join('')}</div><svg viewBox="0 0 620 210" preserveAspectRatio="none" aria-label="Booking trend chart"><defs><linearGradient id="fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#375dfb" stop-opacity=".22"/><stop offset="100%" stop-color="#375dfb" stop-opacity="0"/></linearGradient></defs><path class="chart-fill" d="${line} V210 H0Z"/><path class="chart-line" d="${line}"/></svg><div class="chart-x">${labels.map((l) => `<span>${l}</span>`).join('')}</div></div>`;
}
const photoFor = (p, i) => {
  const map = { 'provider-1': 'photo-rahul', 'provider-2': 'photo-cool', 'provider-3': 'photo-neha', 'provider-4': 'photo-arya', 'provider-5': 'photo-kabir', 'provider-6': 'photo-meera' };
  const photos = ['photo-rahul', 'photo-cool', 'photo-neha', 'photo-arya', 'photo-kabir', 'photo-meera'];
  return map[p.id] || photos[i % photos.length];
};
const STATUS_LABEL = { pending: 'Pending', confirmed: 'Confirmed', in_progress: 'In progress', completed: 'Completed', cancelled: 'Cancelled', due: 'Due' };
const statusBadge = (s) => badge(STATUS_LABEL[s] || s, s === 'confirmed' || s === 'completed' ? 'verified' : s === 'cancelled' || s === 'due' ? 'neutral' : 'medium');

/* ---------------- screen state ---------------- */
let lastQuery = '', filters = { availableToday: true, verified: false, topRated: false, under500: false, maxDistance: 0 };
let providerId = null, trackId = null, lastBooking = null, jobId = null, queryId = null;
let reqTab = 'new', bookTab = 'upcoming', topupOpen = false;
let draft = null, reviewDraft = { rating: 5, tags: [] };

/* ================= CUSTOMER ================= */
function providerCard(p, i) {
  return `<article class="provider-card"><div class="provider-photo ${photoFor(p, i)}">${p.verified ? '<span class="verified">✓ Verified</span>' : ''}<button class="heart">♡</button><span class="distance">${p.distanceKm} km away</span></div><div class="provider-details"><div class="provider-title"><div><h3>${esc(p.name)}</h3><p>${esc(p.category)} · ${esc(p.exp)}</p></div><span class="rating">★ ${p.rating}</span></div><div class="provider-tags">${(p.tags || []).map((t) => `<span>${esc(t)}</span>`).join('')}</div><div class="provider-bottom"><div><small>STARTING FROM</small><strong>${inr(p.priceFrom)}${p.priceUnit || ''}</strong></div><button class="book-button" data-action="open-provider" data-id="${p.id}">Book now</button></div></div></article>`;
}

async function customerHome() {
  const [cats, recs, provs, upcoming] = await Promise.all([
    api('/categories'), api('/recommendations'), api('/providers'), api('/bookings?tab=upcoming'),
  ]);
  const pick = recs[0];
  const next = upcoming[0];
  const nextCalendar = next ? bookingCalendarParts(next) : null;
  return `
  <div class="welcome-row"><div><p class="eyebrow">${todayLabel()}</p><h1>${greeting()}, ${esc(firstName())} <span>✦</span></h1><p class="subhead">What can we make easier today?</p></div><button class="voice-search">⌁ <span>Try voice search</span></button></div>
  <div class="search-wrap"><span>⌕</span><input id="service-search" placeholder="What service do you need?" value="${esc(lastQuery)}"/><kbd>⌘ K</kbd></div>
  <div class="quick-searches"><span>TRY:</span><button data-action="quick" data-q="AC repair near me">AC repair near me</button><button data-action="quick" data-q="Math tutor">Math tutor</button><button data-action="quick" data-q="Home cleaning">Home cleaning</button></div>
  <section class="section categories-section"><div class="section-heading"><div><p class="eyebrow">EXPLORE SERVICES</p><h2>What do you need help with?</h2></div><button class="text-button" data-route="search">View all <span>→</span></button></div>
    <div class="categories">${cats.map((c, i) => `<button class="category${i === 0 ? ' selected' : ''}" data-action="open-category" data-q="${esc(c.label)}"><span class="category-icon ${c.tone}">${esc(c.icon)}</span><strong>${esc(c.label)}</strong></button>`).join('')}<button class="category more" data-route="search"><span class="category-icon">•••</span><strong>More</strong></button></div>
  </section>
  ${pick ? `<section class="smart-pick"><div class="smart-art"><div class="orb orb-one"></div><div class="orb orb-two"></div><div class="sparkle s1">✦</div><div class="sparkle s2">✦</div><div class="calendar-art"><span>SEPT</span><strong>12</strong><i>✓</i></div></div><div class="smart-content"><div class="ai-label"><span>✦</span> SMART PICK</div><h2>${esc(pick.title)}</h2><p>${esc(pick.text)}</p><div><button class="primary-button" data-action="open-provider" data-id="${pick.providerId}">${esc(pick.cta)} <span>→</span></button><button class="why-button" data-route="recommendations">Why this pick?</button></div></div><div class="smart-meta"><span class="confidence"><i></i> ${pick.relevance}% relevant</span><span>${esc(pick.basis)}</span></div></section>` : ''}
  <section class="section providers-section"><div class="section-heading"><div><p class="eyebrow">TRUSTED NEAR YOU</p><h2>Popular professionals nearby</h2></div><button class="text-button" data-route="results">See all providers <span>→</span></button></div>
    <div class="provider-grid">${provs.slice(0, 3).map(providerCard).join('')}</div>
  </section>
  ${next ? `<section class="booking-banner"><div class="booking-calendar"><small>${esc(nextCalendar.month)}</small><strong>${esc(nextCalendar.day)}</strong></div><div class="booking-banner-copy"><span class="status-dot"></span><small>UPCOMING BOOKING · ${esc((STATUS_LABEL[next.status] || '').toUpperCase())}</small><h3>${esc(next.serviceName)} with ${esc(next.providerName || next.partnerName || 'your partner')}</h3><p>${esc(next.dateLabel)} · ${esc(next.timeLabel)} · ${esc(next.address || 'Service address')}</p>${next.comments ? `<p class="booking-comments">Note: ${esc(next.comments)}</p>` : ''}</div><button class="outline-button" data-action="open-booking" data-id="${next.id}">View booking <span>→</span></button></section>` : ''}`;
}

function resultsQuery() {
  const q = {};
  if (lastQuery) q.q = lastQuery;
  if (filters.availableToday) q.availableToday = '1';
  if (filters.verified) q.minRating = '4.5';
  if (filters.topRated) q.minRating = '4.8';
  if (filters.under500) q.maxPrice = '500';
  if (filters.maxDistance) q.maxDistance = String(filters.maxDistance);
  return '/providers?' + new URLSearchParams(q).toString();
}

async function customer(s) {
  if (s === 'home') return customerHome();
  if (s === 'search') return header('customer', s, `<div class="search-screen"><div class="search-wrap"><span>⌕</span><input id="service-search" value="${esc(lastQuery || 'Electrical help')}" placeholder="Search services"/><button data-action="do-search">Search</button></div><div class="search-block"><p class="eyebrow">SUGGESTIONS</p><div class="suggestion-list">${['⚡ Electrician near me', '◉ AC repair and service', '⌇ Emergency plumber', 'a+ Maths tutor, Class 10'].map((x) => `<button data-action="quick" data-q="${esc(x.replace(/^[⚡◉⌇a+\s]+/, ''))}">${esc(x)}<span>→</span></button>`).join('')}</div></div><div class="two-column">${card('Recent searches', `<button class="history-item" data-action="quick" data-q="Home cleaning">Home cleaning <span>↗</span></button><button class="history-item" data-action="quick" data-q="Fan repair">Fan repair <span>↗</span></button>`)}${card('Search smarter', '<p>Try “fan making noise” or “AC leaking water” and we will match the right service.</p>')}</div></div>`, btn('Search providers', 'results'));
  if (s === 'results') {
    const list = await api(resultsQuery());
    const fchip = (k, label) => `<button class="filter${filters[k] ? ' active' : ''}" data-action="filter" data-k="${k}">${label}</button>`;
    return header('customer', s, `<div class="filter-row">${fchip('availableToday', 'Available today')}${fchip('verified', 'Verified')}${fchip('topRated', 'Top rated')}${fchip('under500', 'Under ₹500')}</div><div class="results-layout"><aside class="filter-panel"><p class="eyebrow">FILTER RESULTS</p><b>Distance</b><label><input type="radio" name="d" data-f="maxDistance" value="3" ${filters.maxDistance === 3 ? 'checked' : ''}/> Within 3 km</label><label><input type="radio" name="d" data-f="maxDistance" value="5" ${filters.maxDistance === 5 ? 'checked' : ''}/> Within 5 km</label><b>Price</b><label><input type="checkbox" data-f="under500" ${filters.under500 ? 'checked' : ''}/> Under ₹500</label><b>Rating</b><label><input type="checkbox" data-f="verified" ${filters.verified ? 'checked' : ''}/> 4.5 & above</label></aside><div class="result-list">${list.length ? list.map((p) => `<article class="result-provider"><span class="result-avatar">${esc(p.initials)}</span><div class="result-info"><h3>${esc(p.name)} ${p.verified ? badge('✓ Verified', 'verified') : ''}</h3><p>${esc(p.category)} · ${p.rating} ★ · ${p.jobsCompleted}+ jobs completed</p><div class="provider-tags">${(p.tags || []).map((t) => `<span>${esc(t)}</span>`).join('')}</div></div><div class="result-meta"><span>${p.distanceKm} km away</span><b>From ${inr(p.priceFrom)}${p.priceUnit || ''}</b><small>${esc((p.slots || [])[0] || '')}</small><button class="book-button" data-action="open-provider" data-id="${p.id}">View profile</button></div></article>`).join('') : empty('No matches found', 'Try widening your filters.')}</div></div>`);
  }
  if (s === 'provider') {
    const p = await api('/providers/' + providerId);
    const active = (p.services || []).filter((x) => x.active);
    return header('customer', s, `<div class="provider-profile"><div class="profile-cover"></div><section class="provider-hero"><div class="provider-avatar">${esc(p.initials)}</div><div class="provider-identity"><h2>${esc(p.name)} ${p.verified ? badge('✓ Verified', 'verified') : ''}</h2><p>${esc(p.category)} · ${esc(p.area)} · ${esc(p.exp)}</p><div class="profile-stats"><span><b>${p.rating} ★</b> ${p.reviewsCount} reviews</span><span><b>${p.responseMin} min</b> response time</span></div></div><button class="outline-button" data-action="save-toggle">♡ Save</button></section><div class="profile-tabs"><button class="active">Overview</button><button>Services</button><button>Reviews</button><button>Portfolio</button></div><div class="profile-main"><div>${card('About ' + esc(p.name.split(' ')[0]), `<p>${esc(p.about)}</p><div class="trust-list">${(p.trust || []).map((t) => `<span>✓ ${esc(t)}</span>`).join('')}</div>`)}${card('Services', active.map((x) => `<div class="service-option"><div><h4>${esc(x.name)}</h4><p>${esc(x.detail)}</p></div><b>${inr(x.price)}</b></div>`).join('') || '<p>No services listed right now.</p>')}${card(`Reviews (${p.reviewsCount})`, (p.reviews || []).map((r) => `<div class="service-option"><div><h4>${esc(r.author)} · ${'★'.repeat(r.rating)}</h4><p>${esc(r.text)}</p></div><b>${esc(r.at)}</b></div>`).join('') || '<p>No reviews yet.</p>')}</div><aside>${card('Next available', `<p><b>${esc((p.slots || [])[0] || 'Contact for slots')}</b></p><p>Service visits start from ${inr(p.priceFrom)}${p.priceUnit || ''}</p><button class="primary-button" data-action="book-provider" data-id="${p.id}">Book ${esc(p.name.split(' ')[0])}</button><small>✓ Free cancellation up to 2 hours before</small>`)}${card('Service area', `<p>${esc(p.area)}</p>`)}</aside></div></div>`, `<button class="primary-button" data-action="book-provider" data-id="${p.id}">Book this provider <span>→</span></button>`);
  }
  if (s === 'booking') {
    if (!draft) return header('customer', s, empty('Choose a professional first', 'Pick a provider to start a booking.'));
    const p = await api('/providers/' + draft.providerId);
    const svc = (p.services || []).find((x) => x.id === draft.serviceId) || (p.services || []).find((x) => x.active) || p.services[0];
    if (!svc) return header('customer', s, empty('No bookable services', 'This provider has paused all services.'));
    draft.serviceId = svc.id;
    const days = nextDays();
    const times = (p.slots || []).slice(0, 6);
    if (!times.includes(draft.time)) draft.time = times[0] || '10:30 AM';
    const t = breakup(svc.price);
    return header('customer', s, `<div class="stepper"><span class="done">1<small>SERVICE</small></span><i></i><span class="active">2<small>TIME</small></span><i></i><span>3<small>LOCATION</small></span><i></i><span>4<small>PAYMENT</small></span><i></i><span>5<small>CONFIRM</small></span></div><div class="booking-layout"><div>${card('Choose a service', (p.services || []).filter((x) => x.active).map((x) => `<button class="service-option${x.id === svc.id ? ' selected' : ''}" data-action="pick-service" data-id="${x.id}"><div><h4>${esc(x.name)}</h4><p>${esc(x.detail)}</p></div><b>${inr(x.price)}</b></button>`).join(''))}${card('Choose a date', `<div class="date-list">${days.map((d, i) => `<button class="${draft.dateIdx === i ? 'active' : ''}" data-action="pick-date" data-i="${i}"><small>${i === 0 ? 'TODAY' : d.mon}</small><b>${d.num}</b><span>${d.dow}</span></button>`).join('')}</div><h3>Available times</h3><div class="time-grid">${times.map((x) => `<button class="${draft.time === x ? 'selected' : ''}" data-action="pick-time" data-v="${esc(x)}">${esc(x)}</button>`).join('')}</div>`)}${card('Service address and instructions', `<div class="form-grid"><label class="form-field"><span>SAVED ADDRESS</span><input id="bk-address" value="${esc(draft.address)}"/></label></div><label class="form-field"><span>COMMENTS FOR THE PARTNER (OPTIONAL)</span><textarea id="bk-comments" maxlength="500" placeholder="For example: do not ring the bell; call when you arrive; please wear a mask.">${esc(draft.comments || '')}</textarea></label><div class="form-grid" style="margin-top:12px">${['UPI', 'Card', 'Wallet'].map((m) => `<button class="filter${draft.payment === m ? ' active' : ''}" data-action="pick-pay" data-v="${m}">${m}</button>`).join('')}</div>`)}</div><aside class="booking-summary"><p class="eyebrow">YOUR BOOKING</p><h3>${esc(svc.name)}</h3><p>with ${esc(p.name)}</p><div><span>Service visit</span><b>${inr(t.price)}</b></div><div><span>Platform fee</span><b>${inr(t.fee)}</b></div><div><span>GST</span><b>${inr(t.gst)}</b></div><hr/><div class="total"><span>Total</span><b>${inr(t.amount)}</b></div><button class="primary-button" data-action="confirm-booking">Continue to payment <span>→</span></button><small>🔒 Secure payment · You will not be charged yet</small></aside></div>`);
  }
  if (s === 'confirmation') {
    const b = lastBooking;
    if (!b) return header('customer', s, empty('Nothing to confirm', 'Start a new booking first.'));
    return header('customer', s, `<div class="success-layout"><div class="success-mark">✓</div><p class="eyebrow">BOOKING ${esc(b.status.toUpperCase())}</p><h2>You are all booked!</h2><p>${esc(b.providerName)} has been notified and will confirm your appointment shortly.</p><article class="confirmation-card"><div><span>BOOKING ID</span><b>${esc(b.code)}</b></div><div><span>SERVICE</span><b>${esc(b.serviceName)}</b></div><div><span>DATE & TIME</span><b>${esc(b.dateLabel)} · ${esc(b.timeLabel)}</b></div><div><span>LOCATION</span><b>${esc(b.address)}</b></div><div><span>AMOUNT</span><b>${inr(b.amount)}</b></div></article><button class="primary-button" data-action="open-booking" data-id="${b.id}">Track booking <span>→</span></button>${btn('View all bookings', 'bookings', 'why-button')}</div>`);
  }
  if (s === 'tracking') {
    if (!trackId) return header('customer', s, empty('No booking selected', 'Open a booking to track it here.'));
    const b = await api('/bookings/' + trackId);
    const steps = ['Booking requested', `${b.providerName} confirmed`, 'Provider on the way', 'Service in progress', 'Completed'];
    const done = b.status === 'completed' ? 5 : b.status === 'in_progress' ? 3 : b.status === 'confirmed' ? 2 : 1;
    return header('customer', s, b.status === 'cancelled'
      ? `<div class="success-layout"><div class="success-mark" style="background:#f2f4f6;color:#98a0b2">✕</div><p class="eyebrow">BOOKING CANCELLED</p><h2>This booking was cancelled</h2><p>A refund of ${inr(b.amount)} has been credited to your wallet.</p>${btn('View all bookings', 'bookings')}</div>`
      : `<div class="tracking-layout"><div>${card(b.serviceName, `<div class="tracking-top"><p>${esc(b.dateLabel)} · ${esc(b.timeLabel)}</p>${statusBadge(b.status)}</div><div class="timeline">${steps.map((x, i) => `<div class="${i < done ? 'complete' : i === done ? 'current' : ''}"><i>${i < done ? '✓' : i + 1}</i><span><b>${x}</b><small>${(b.history[i] || {}).at || (i === done ? 'We will notify you of updates.' : '')}</small></span></div>`).join('')}</div>`)}${card('Your address', `<p>${esc(b.address)}, Mumbai 400053</p>`)}</div><aside class="provider-contact"><div class="contact-avatar">${esc(b.providerInitials)}</div><h3>${esc(b.providerName)}</h3><p>★ ${b.providerRating || ''}</p><button class="outline-button" data-route="support">◌ Message support</button><hr/><button class="text-button danger" data-action="cancel-booking" data-id="${b.id}">Cancel booking</button></aside></div>`);
  }
  if (s === 'bookings') {
    const tabs = [['upcoming', 'Upcoming'], ['active', 'Active'], ['completed', 'Completed'], ['cancelled', 'Cancelled'], ['due', 'Due']];
    const list = await api('/bookings?tab=' + bookTab);
    return header('customer', s, `<div class="tabs">${tabs.map(([k, l]) => `<button class="${bookTab === k ? 'active' : ''}" data-action="book-tab" data-v="${k}">${l}${k === 'upcoming' ? ` (${list.filter(b => ['pending','confirmed'].includes(b.status)).length})` : k === 'active' ? ` (${list.filter(b => b.status === 'in_progress').length})` : k === 'completed' ? ` (${list.filter(b => b.status === 'completed').length})` : k === 'cancelled' ? ` (${list.filter(b => b.status === 'cancelled').length})` : k === 'due' ? ` (${list.filter(b => b.status === 'due').length})` : ''}</button>`).join('')}</div><div class="booking-list">${list.map((b) => { const calendar = bookingCalendarParts(b); return `<article class="booking-item"><div class="booking-calendar"><small>${esc(calendar.month)}</small><strong>${esc(calendar.day)}</strong></div><div><div>${statusBadge(b.status)} <small>${esc(b.code)}</small></div><h3>${esc(b.serviceName)}</h3><p>${esc(b.providerName)} · ${esc(b.dateLabel)} · ${esc(b.timeLabel)}</p></div><button class="outline-button" data-action="open-booking" data-id="${b.id}">View details</button></article>`; }).join('') || `<div class="state-inline"><span>◷</span><div><b>No ${bookTab} bookings</b><p>New bookings will appear here.</p></div></div>`}</div>`);
  }
  if (s === 'wallet') {
    const w = await api('/wallet');
    return header('customer', s, `<div class="wallet-hero"><div><p>AVAILABLE TO USE</p><strong>${inr(w.balance)}<span>.00</span></strong><small>Includes ${inr(w.promo)} promotional credit</small></div><div style="display:grid;gap:8px">${topupOpen ? `<div style="display:flex;gap:8px"><input id="topup-amount" type="number" min="10" placeholder="Amount" style="border:1px solid var(--line);border-radius:8px;padding:9px 11px;font:inherit;width:130px"/><button class="primary-button" data-action="topup-confirm">Add</button></div>` : `<button class="outline-button" data-action="topup-form">Add money</button>`}</div></div><div class="wallet-stats"><article><span>REWARDS</span><b>${inr(w.promo)}</b><small>expires 30 Sept</small></article><article><span>REFUND CREDIT</span><b>${inr(w.refund)}</b><small>valid 12 months</small></article><article><span>PAYMENTS</span><b>${inr(w.saved)}</b><small>saved in wallet</small></article></div>${card('Recent activity', (w.transactions || []).map((t) => tx(t.name, `${t.meta} · ${t.date}`, `${t.amount >= 0 ? '+' : '−'} ${inr(Math.abs(t.amount))}`, t.amount >= 0 ? 'green' : 'red')).join('') || '<p>No transactions yet.</p>')}`);
  }
  if (s === 'loyalty') {
    const l = await api('/loyalty');
    const nextTier = l.tier === 'Bronze' ? 'Silver' : l.tier === 'Silver' ? 'Gold' : 'Platinum';
    return header('customer', s, `<div class="loyalty-hero"><p class="eyebrow">YOUR CURRENT TIER</p><h2>${esc(l.tier)} member <span>✦</span></h2><p>You have unlocked priority support and bonus points on every booking.</p><div class="points"><b>${l.points.toLocaleString('en-IN')}</b> points available</div><div class="progress"><i style="width:${l.progress}%"></i></div><small>${l.toNext ? l.toNext.toLocaleString('en-IN') + ' points to ' + nextTier : 'Top tier unlocked'}</small></div><div class="two-column">${card('Next reward', `<p><b>${esc(l.nextReward.title)}</b></p><p>${esc(l.nextReward.valid)}</p><button class="primary-button" data-action="redeem">Redeem reward</button>`)}${card(l.tier + ' benefits', `<ul class="check-list">${l.benefits.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`)}</div>${card('Points activity', (l.activity || []).map((a) => tx(a.name, a.meta, `${a.points >= 0 ? '+' : '−'} ${Math.abs(a.points)} points`, a.points >= 0 ? 'green' : 'red')).join('') || '<p>No points activity yet.</p>')}`);
  }
  if (s === 'reviews') {
    const done = await api('/bookings?tab=completed');
    const target = done.find((b) => !b.reviewed) || done[0];
    if (!target) return header('customer', s, empty('No completed services', 'Complete a service to leave a review.'));
    reviewDraft.bookingId = target.id;
    return header('customer', s, `<div class="review-layout">${card(`${target.serviceName} with ${target.providerName}`, `<p>Completed ${esc(target.dateLabel)}</p><div class="stars" id="stars">${[1, 2, 3, 4, 5].map((i) => `<button data-action="rate" data-v="${i}" style="color:${i <= reviewDraft.rating ? '#f5a623' : '#d5dae3'}">★</button>`).join('')}</div><p class="eyebrow">HOW WAS YOUR EXPERIENCE?</p><div class="tag-select">${['Professional', 'On time', 'Good quality', 'Value for money'].map((t) => `<button class="${reviewDraft.tags.includes(t) ? 'selected' : ''}" data-action="tag" data-v="${t}">${t}</button>`).join('')}</div><label class="form-field"><span>WRITE A REVIEW (OPTIONAL)</span><textarea id="review-text" placeholder="Tell other customers what went well…">${esc(reviewDraft.text || '')}</textarea></label><button class="primary-button" data-action="review-submit">Submit review</button>`)}${card('Your reviews', `<p>You have reviewed ${done.filter((b) => b.reviewed).length} of your ${done.length} completed services.</p><button class="text-button" data-route="bookings">View booking history →</button>`)}</div>`);
  }
  if (s === 'support') {
    const tickets = await api('/tickets');
    return header('customer', s, `<div class="support-grid">${card('What do you need help with?', `<div class="support-options">${[['▣', 'A booking', 'Change, cancel or track'], ['₹', 'Payment or refund', 'Wallet and transaction help'], ['♙', 'Provider issue', 'Report a concern'], ['⚙', 'Account & privacy', 'Profile and security']].map((x) => `<button data-route="complaint">${x[0]}<span><b>${x[1]}</b><small>${x[2]}</small></span>›</button>`).join('')}</div>`)}${card('My requests', tickets.map((t) => `<div class="ticket"><span>◌</span><div><b>${esc(t.subject)}</b><small>${esc(t.id)} · ${esc(t.updated)}</small></div>${badge(t.status, t.status === 'Resolved' ? 'verified' : 'medium')}</div>`).join('') + btn('New support request', 'complaint'))}</div>`);
  }
  if (s === 'complaint') return header('customer', s, `<article class="form-card"><div class="form-grid"><label class="form-field"><span>RELATED BOOKING</span><input id="cp-booking" placeholder="e.g. BK-2026-0912-884"/></label><label class="form-field"><span>ISSUE CATEGORY</span><input id="cp-category" value="Payment or refund"/></label><label class="form-field"><span>PREFERRED RESOLUTION</span><input id="cp-resolution" value="Refund to Shop2Door wallet"/></label></div><label class="form-field"><span>DESCRIBE THE ISSUE</span><textarea id="cp-desc" placeholder="Include the important details so we can help quickly."></textarea></label><button class="primary-button" data-action="ticket-submit">Submit request <span>→</span></button></article>`);
  if (s === 'profile') {
    const u = session.user, parts = u.name.split(' ');
    return header('customer', s, `<div class="profile-settings"><aside class="settings-nav"><button class="active">Personal information</button><button>Addresses</button><button>Payment methods</button><button data-route="wallet">Wallet</button><button data-route="loyalty">Loyalty</button><button>Notifications</button><button>Privacy & security</button></aside><div>${card('', `<div class="profile-person"><span class="avatar big">${esc(initials(u.name))}</span><div><h3>${esc(u.name)}</h3><p>Member since ${esc(u.memberSince || '')}</p></div><button class="outline-button" data-action="noop">Change photo</button></div><div class="form-grid">${field('FIRST NAME', parts[0] || '')}${field('LAST NAME', parts.slice(1).join(' ') || '')}${field('EMAIL', u.email)}${field('PHONE', u.mobile || '')}</div><button class="primary-button" data-action="profile-save">Save changes</button>`) + card('Saved addresses', '<h3>Home</h3><p>14B, Shantivan Apartments, Lokhandwala Complex, Andheri West, Mumbai 400053</p><button class="text-button">Manage addresses →</button>')}</div></div>`, btn('Sign out', 'login', 'outline-button'));
  }
  if (s === 'recommendations') {
    const recs = await api('/recommendations');
    return header('customer', s, `<div class="recommendation-grid">${recs.map((r) => `<article class="recommendation-card"><div class="ai-label"><span>✦</span> SMART PICK</div><h3>${esc(r.title)}</h3><p>${esc(r.text)}</p><button class="text-button" data-action="open-provider" data-id="${r.providerId}">${esc(r.cta)} →</button><button class="why-button">Why am I seeing this?</button></article>`).join('')}</div>${card('You stay in control', '<p>Suggestions use permitted platform activity only. Change recommendation preferences at any time.</p>')}`);
  }
  return header('customer', s, empty('Nothing to show yet', 'This section is ready for your next booking.'));
}
const initials = (n) => (String(n || '').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('') || 'S2').toUpperCase();

/* ================= PARTNER ================= */
async function partner(s) {
  if (s === 'dashboard') {
    const d = await api('/partner/dashboard');
    const k = d.kpis;
    return `<div class="welcome-row"><div><p class="eyebrow">${todayLabel()}</p><h1>${greeting()}, ${esc(firstName())}</h1><p class="subhead">You have a busy day ahead.</p></div><button class="primary-button" data-route="availability">+ Add availability</button></div>
    <div class="partner-kpis"><article><span class="kpi-icon blue">▣</span><small>UPCOMING JOBS</small><strong>${String(k.upcomingJobs).padStart(2, '0')}</strong><em>${esc(k.upcomingDelta)}</em></article><article><span class="kpi-icon green">₹</span><small>TODAY'S EARNINGS</small><strong>${inr(k.todayEarnings)}</strong><em>${inr(k.pendingEarnings)} pending</em></article><article><span class="kpi-icon amber">★</span><small>CURRENT RATING</small><strong>${k.rating}</strong><em>from ${k.ratingCount} reviews</em></article><article><span class="kpi-icon lilac">◷</span><small>RESPONSE TIME</small><strong>${k.responseMin} min</strong><em>${esc(k.responseNote)}</em></article></div>
    <section class="partner-layout"><div class="jobs-panel"><div class="section-heading"><div><p class="eyebrow">TODAY'S SCHEDULE</p><h2>Upcoming jobs</h2></div><button class="text-button" data-route="requests">View calendar →</button></div>${d.jobs.map((j) => { const [t, ap] = j.timeLabel.split(' '); return `<div class="job-row"><span class="job-time">${t}<small>${ap || ''}</small></span><span class="job-line"></span><div class="job-main"><span class="job-type">${esc(j.type)}</span><h3>${esc(j.service)}</h3><p>${esc(j.customer)} · ${esc(j.place)}</p></div><span class="job-price">${inr(j.price)}</span><button class="outline-button small" data-action="open-job" data-id="${j.id}">Details</button></div>`; }).join('') || '<p>No jobs scheduled yet.</p>'}</div><aside class="availability-panel"><p class="eyebrow">YOUR AVAILABILITY</p><h2>${d.availability.open ? "You're open for jobs" : 'You are currently paused'}</h2><div class="availability-toggle"><span></span><b>${d.availability.open ? 'Available today' : 'Unavailable'}</b></div><p>${esc(d.availability.note)}</p><button class="text-button" data-route="availability">Manage schedule →</button><hr><p class="eyebrow">QUICK ACTIONS</p><div class="quick-actions"><button data-route="services">⊞ <span>Add service</span></button><button data-route="availability">◷ <span>Update hours</span></button><button>◌ <span>Messages</span></button><button data-route="earnings">₹ <span>Earnings</span></button></div></aside></section>`;
  }
  if (s === 'requests') {
    const { list, counts } = await api('/partner/requests?tab=' + reqTab);
    const tabs = [['new', 'New requests'], ['upcoming', 'Upcoming'], ['active', 'Active'], ['completed', 'Completed'], ['due', 'Due']];
    return header('partner', s, `<div class="tabs">${tabs.map(([k, l]) => `<button class="${reqTab === k ? 'active' : ''}" data-action="req-tab" data-v="${k}">${l} (${counts[k] || 0})</button>`).join('')}</div><div class="request-list">${list.map((j) => {
      const isNew = j.status === 'new';
      const isUpcoming = j.status === 'upcoming';
      const isActive = j.status === 'active' || j.status === 'in_progress';
      const isCompleted = j.status === 'completed';
      const isDue = j.status === 'due';
      let actionButtons = '';
      if (isNew) {
        actionButtons = `<button class="primary-button small" data-action="job-accept" data-id="${j.id}">Accept</button><button class="outline-button small" data-action="job-decline" data-id="${j.id}">Decline</button>`;
      } else if (isUpcoming) {
        actionButtons = `<button class="primary-button small" data-action="job-start" data-id="${j.id}">Start Service</button>`;
      } else if (isActive) {
        actionButtons = `<button class="primary-button small" data-action="job-complete" data-id="${j.id}">Complete</button>`;
      } else if (isDue) {
        actionButtons = `<button class="primary-button small" data-action="job-start" data-id="${j.id}">Start Service</button><button class="outline-button small" data-action="job-complete" data-id="${j.id}">Complete</button>`;
      }
      return `<article class="request-card"><div class="request-date"><b>${esc(j.dateLabel)}</b><span>${esc(j.timeLabel)}</span></div><div><h3>${esc(j.service)}</h3><p>${esc(j.customer)} · ${esc(j.customerMeta)}</p><small>⌖ ${esc(j.place)}</small></div><b>${inr(j.price)}</b><div class="request-actions">${actionButtons}<button class="outline-button small" data-action="open-job" data-id="${j.id}">Details</button></div></article>`;
    }).join('') || '<p>No requests here yet.</p>'}</div>`);
  }
  if (s === 'job') {
    if (!jobId) return header('partner', s, empty('No job selected', 'Open a request to review it here.'));
    const j = await api('/partner/jobs/' + jobId);
    const isPending = j.status === 'pending' || j.status === 'confirmed';
    const isInProgress = j.status === 'in_progress';
    const canStart = isPending;
    const canComplete = isInProgress;
    return header('partner', s, `<div class="job-detail-layout"><div>${card(j.service, `<div class="card-title"><p>${esc(j.dateLabel)}, ${esc(j.timeLabel)}</p>${badge(STATUS_LABEL[j.status] || j.status, j.status === 'new' ? 'medium' : 'verified')}</div><hr/><div class="job-detail-grid"><div><span>CUSTOMER</span><b>${esc(j.customer)}</b><small>${esc(j.customerMeta)}</small></div><div><span>PRICE</span><b>${inr(j.price)}</b><small>Includes visit fee</small></div><div><span>LOCATION</span><b>${esc(j.place)}</b><small>Mumbai</small></div><div><span>PAYMENT</span><b>${esc(j.payment)}</b><small>Authorised</small></div></div><hr/><h3>Customer note</h3><p>${esc(j.note || 'No note from the customer.')}</p>`)}${card('Contact customer', `<button class="outline-button" data-action="noop">◌ Message ${esc(j.customer.split(' ')[0])}</button>`)}</div><aside class="action-card"><h3>${isPending ? 'Accept this job?' : isInProgress ? 'Service in progress' : 'Service completed'}</h3><p>${isPending ? 'Respond quickly to keep your ranking strong.' : isInProgress ? 'Mark as complete when the service is done.' : 'Great job! The service has been completed.'}</p>${canStart ? `<button class="primary-button" data-action="job-accept" data-id="${j.id}">Accept booking</button><button class="outline-button" data-action="job-decline" data-id="${j.id}">Decline request</button>` : canComplete ? `<button class="primary-button" data-action="job-complete" data-id="${j.id}">Complete service</button>` : `<button class="outline-button" disabled>Service completed</button>`}<small>${isPending ? 'Accepting confirms the appointment with ' + esc(j.customer.split(' ')[0]) + '.' : isInProgress ? 'Completing will mark the booking as finished.' : ''}</small></aside></div>`);
  }
  if (s === 'services') {
    const list = await api('/partner/services');
    return header('partner', s, `<div class="toolbar"><button class="filter active">All services (${list.length})</button><button class="filter">Active</button><button class="filter">Paused</button></div><div class="service-manage">${list.map((x) => `<article class="manage-service"><div class="service-symbol">ϟ</div><div><h3>${esc(x.name)}</h3><p>${x.durationMin} min · Mumbai</p></div><b>${inr(x.price)}</b>${badge(x.active ? 'Active' : 'Paused', x.active ? 'verified' : 'neutral')}<button class="outline-button" data-action="service-toggle" data-id="${x.id}">${x.active ? 'Pause' : 'Activate'}</button><button class="text-button danger" data-action="service-delete" data-id="${x.id}">Remove</button></article>`).join('')}</div>${card('Add a new service', `<div class="form-grid"><label class="form-field"><span>SERVICE NAME</span><input id="ns-name" placeholder="e.g. Geyser repair"/></label><label class="form-field"><span>PRICE (₹)</span><input id="ns-price" type="number" placeholder="499"/></label><label class="form-field"><span>DURATION (MIN)</span><input id="ns-duration" type="number" placeholder="45"/></label></div><button class="primary-button" data-action="service-add">Add service</button>`)}`);
  }
  if (s === 'availability') {
    const a = await api('/partner/availability');
    return header('partner', s, `${card('Availability status', `<div class="card-title"><div><p>Customers can currently book active services.</p></div><div class="availability-toggle"><span></span><b>${a.open ? 'Available' : 'Paused'}</b></div></div><button class="outline-button" data-action="avail-toggle">${a.open ? 'Pause bookings' : 'Go available'}</button>`)}${card('Regular schedule', (a.schedule || []).map((d) => `<div class="day-row"><b>${esc(d.day)}</b><span class="availability-toggle"><span></span></span><select disabled><option>${esc(d.open ? d.from : 'Unavailable')}</option></select>${d.open ? `<i>to</i><select disabled><option>${esc(d.to)}</option></select><button class="text-button" data-action="day-toggle" data-v="${esc(d.day)}">Close</button>` : `<button class="text-button" data-action="day-toggle" data-v="${esc(d.day)}">Open</button>`}</div>`).join(''))}`);
  }
  if (s === 'earnings') {
    const e = await api('/partner/earnings');
    return header('partner', s, `<div class="earning-summary"><article><span>THIS WEEK</span><b>${inr(e.week)}</b><small>${esc(e.weekDelta)}</small></article><article><span>PENDING PAYOUT</span><b>${inr(e.pending)}</b><small>${esc(e.pendingNote)}</small></article><article><span>COMPLETED JOBS</span><b>${e.completed}</b><small>Avg. ${inr(e.avg)} / job</small></article></div>${card('September earnings', '<div class="mini-bars">' + (e.series || []).map((x) => `<i style="height:${x}%"></i>`).join('') + '</div>')}${card('Recent payments', (e.payments || []).map((p) => tx(p.name, p.meta, p.amount)).join('') || '<p>No payments yet.</p>')}`);
  }
  if (s === 'profile') {
    const p = await api('/partner/profile');
    return header('partner', s, `<div class="profile-settings"><aside class="settings-nav"><button class="active">Business information</button><button data-route="services">Services</button><button data-route="availability">Availability</button><button data-route="earnings">Earnings</button><button data-route="kyc">Verification</button></aside><div>${card('', `<div class="profile-person"><span class="avatar big">${esc(p.initials)}</span><div><h3>${esc(p.name)}</h3><p>${p.verified ? 'Verified partner' : 'Verification pending'} · Mumbai</p></div></div><div class="form-grid"><label class="form-field"><span>BUSINESS NAME</span><input id="pf-biz" value="${esc(p.name)}"/></label><label class="form-field"><span>SERVICE AREA</span><input id="pf-area" value="${esc(p.area)}"/></label><label class="form-field"><span>RATING</span><input value="${p.rating} ★ · ${p.reviewsCount} reviews" disabled/></label></div><button class="primary-button" data-action="partner-profile-save">Save changes</button>`)}</div></div>`, btn('Sign out', 'login', 'outline-button'));
  }
  if (s === 'kyc') {
    const p = await api('/partner/profile');
    const step = (done, n, t, sub) => `<div class="${done ? 'done' : 'active'}"><i>${done ? '✓' : n}</i><span><b>${t}</b><small>${sub}</small></span></div>`;
    return header('partner', s, `<div class="kyc-layout">${card(p.verified ? 'You are verified.' : 'Almost there — one step left.', `<p>${p.verified ? 'Your profile, identity and payout account are complete.' : 'Your profile and identity have been reviewed. Add your payout account to receive earnings.'}</p><div class="kyc-steps">${step(true, 1, 'Identity verified', 'PAN: XXXXXX1234')}${step(true, 2, 'Skills & certificates reviewed', 'Electrical licence approved')}${step(p.verified, 3, 'Add payout account', p.verified ? 'Completed' : 'Required before first payout')}</div>${p.verified ? '' : '<button class="primary-button" data-action="noop">Add payout account</button>'}`)}${card('Your data', '<p>Bank and government ID details are masked by default and used only to verify your professional account.</p>')}</div>`);
  }
  return header('partner', s, empty('No jobs here yet', 'New booking requests will appear in this list.'));
}

/* ================= ADMIN ================= */
async function admin(s) {
  const columns = { customers: ['Customer', 'Location', 'Bookings', 'Total spend', 'Tier', 'Last activity', 'Status'], providers: ['Provider', 'Category', 'Verification', 'Rating', 'Jobs', 'Availability', 'Status'], bookings: ['Booking ID', 'Customer', 'Service', 'Partner', 'Comments', 'Time', 'Amount', 'Status'], wallet: ['Transaction ID', 'Customer', 'Type', 'Amount', 'Date', 'Reason', 'Status'], audit: ['Timestamp', 'User', 'Role', 'Action', 'Resource', 'Result'] };
  if (s === 'dashboard') {
    const [o, complaints] = await Promise.all([api('/admin/overview'), api('/admin/complaints')]);
    return `<div class="admin-header"><div><p class="eyebrow">MARKETPLACE OVERVIEW</p><h1>${greeting()}, ${esc(firstName())}</h1><p class="subhead">Here's how Shop2Door is moving today.</p></div><div class="admin-head-actions"><button class="outline-button" data-route="reports">Export report</button><button class="primary-button" data-route="bookings">View live operations</button></div></div>
    <div class="metrics-grid">${o.metrics.map((m) => `<article><div><small>${esc(m.label)}</small><span class="trend${m.tone === 'neutral' ? ' neutral' : ''}">${esc(m.trend)}</span></div><strong>${esc(m.value)}${m.suffix ? `<span>${esc(m.suffix)}</span>` : ''}</strong><p>${esc(m.sub)}</p></article>`).join('')}</div>
    <section class="analytics-layout"><article class="chart-card"><div class="chart-title"><div><p class="eyebrow">BOOKING VOLUME</p><h2>Marketplace activity</h2></div><select><option>Last 7 days</option></select></div><div class="chart-legend"><span><i></i> Bookings</span><span><i></i> Completed</span></div>${svgChart(o.series, o.seriesLabels)}</article><article class="ai-insight"><div class="ai-label"><span>✦</span> AI INSIGHT</div><h3>${esc(o.aiInsight.title)}</h3><p>${esc(o.aiInsight.text)}</p><div class="confidence"><i></i> ${o.aiInsight.confidence}% confidence</div><button class="primary-button" data-route="insights">Review recommendations <span>→</span></button><button class="why-button" data-route="insights">View data context</button></article></section>
    <section class="bottom-admin"><article class="table-card"><div class="section-heading"><div><p class="eyebrow">NEEDS ATTENTION</p><h2>Recent complaints</h2></div><button class="text-button" data-route="complaints">Open inbox →</button></div>${complaints.filter((c) => c.channel === 'app').slice(0, 3).map((c) => `<div class="complaint"><span class="complaint-icon ${c.priority === 'HIGH' ? 'red' : 'amber'}">!</span><div><h3>${esc(c.title)}</h3><p>#${esc(c.id)} · ${esc(c.customer)} · ${esc(c.age)}</p></div>${badge(c.priority, c.priority === 'HIGH' ? 'high' : 'medium')}<button>›</button></div>`).join('')}</article><article class="service-card-admin"><p class="eyebrow">TOP CATEGORY</p><h2>${esc(o.topCategory.name)} <span>↗</span></h2><strong>${esc(o.topCategory.revenue)}</strong><p>${esc(o.topCategory.note)}</p><div class="bar-track"><i style="width:${o.topCategory.bar}%"></i></div><div class="service-stats"><span><b>${esc(o.topCategory.bookings)}</b> bookings</span><span><b>${esc(o.topCategory.rating)}</b> avg rating</span></div></article></section>`;
  }
  if (columns[s]) {
    const rows = await api('/admin/' + s);
    const cell = (t, r) => t === 'customers' ? [r.name, r.location, r.bookings, r.spend, r.tier, r.lastActivity, badge(r.status, r.status === 'Active' ? 'verified' : 'medium')]
      : t === 'providers' ? [r.name, r.category, badge(r.verification, r.verification === 'Verified' ? 'verified' : 'medium'), r.rating, r.jobs, r.availability, badge(r.status, r.status === 'Active' ? 'verified' : 'medium')]
      : t === 'bookings' ? [r.code, r.customer, r.service, r.provider, esc(r.comments || '—'), r.time, r.amount, statusBadge(r.status)]
      : t === 'wallet' ? [r.id, r.customer, r.type, r.amount, r.date, r.reason, badge(r.status, 'verified')]
      : [r.at, r.user, r.role, r.action, r.resource, badge(r.result, 'verified')];
    return header('admin', s, `<div class="list-toolbar"><div class="inbox-search">⌕ Search ${s}</div><div><button class="filter">Filter ⌄</button><button class="filter">Sort ⌄</button></div></div>${table(columns[s], rows.map((r) => [...cell(s, r), `<button class="text-button" data-action="noop">Open</button>`]))}`);
  }
  if (s === 'queries') {
    const all = await api('/admin/queries');
    const active = all.find((t) => t.id === queryId) || all[0];
    if (queryId == null && active) queryId = active.id;
    return header('admin', s, `<div class="inbox-layout"><aside class="ticket-list"><div class="inbox-search">⌕ Search tickets</div>${all.map((t) => `<button class="inbox-ticket ${active && t.id === active.id ? 'active' : ''}" data-action="query-select" data-id="${t.id}"><div><b>${esc(t.subject)}</b><small>${esc(t.id)} · ${esc(t.customerName)}</small></div>${badge(t.priority === 'High' ? 'High' : 'Medium', t.priority === 'High' ? 'high' : 'medium')}</button>`).join('')}</aside>${active ? `<section class="conversation"><div class="conversation-head"><div><h3>${esc(active.subject)}</h3><p>${esc(active.id)} · ${esc(active.category)}</p></div>${badge(active.priority.toUpperCase(), active.priority === 'High' ? 'high' : 'medium')}</div><div class="messages">${(active.messages || []).map((m) => `<div class="message ${m.from === 'customer' ? 'customer' : 'agent'}">${esc(m.text)}<small>${esc(m.at)}</small></div>`).join('') || '<p>No messages yet.</p>'}</div><div class="reply-box"><input id="reply-input" placeholder="Write a reply…"/><button class="primary-button" data-action="reply-send" data-id="${active.id}">Send</button></div></section><aside class="customer-panel"><p class="eyebrow">CUSTOMER</p><h3>${esc(active.customerName)}</h3><hr/><p class="eyebrow">CONTEXT</p><b>${esc(active.category)}</b><p>${esc(active.updated)}</p><button class="text-button" data-route="customers">Open customer 360 →</button></aside>` : '<p>No tickets.</p>'}</div>`);
  }
  if (s === 'complaints' || s === 'social') {
    const all = (await api('/admin/complaints')).filter((c) => (s === 'social' ? c.channel === 'social' : c.channel === 'app'));
    const cols = ['New', 'Investigating', 'Resolution proposed'];
    const next = { New: 'Investigating', Investigating: 'Resolution proposed', 'Resolution proposed': 'Resolved' };
    return header('admin', s, `<div class="metric-row"><article><span>OPEN</span><b>${all.filter((c) => c.status !== 'Resolved').length}</b></article><article><span>HIGH PRIORITY</span><b>${all.filter((c) => c.priority === 'HIGH' && c.status !== 'Resolved').length}</b></article><article><span>UNRESOLVED</span><b>${all.filter((c) => c.status === 'New').length}</b></article></div><div class="kanban">${cols.map((col) => `<section><div class="kanban-head"><h3>${col}</h3><span>${all.filter((c) => c.status === col).length}</span></div>${all.filter((c) => c.status === col).map((c) => `<article class="kanban-card"><div>${badge(c.priority, c.priority === 'HIGH' ? 'high' : 'medium')} <small>#${esc(c.id)}</small></div><h4>${esc(c.title)}</h4><p>${esc(c.customer)} · ${esc(c.age)}</p><button class="text-button" data-action="complaint-next" data-id="${c.id}">→ ${next[col]}</button></article>`).join('')}</section>`).join('')}</div>`);
  }
  if (s === 'loyalty') {
    const l = await api('/admin/loyalty');
    return header('admin', s, `<div class="metrics-grid compact">${l.totals.map((x) => `<article><small>${esc(x.label)}</small><strong>${esc(x.value)}</strong><p>${esc(x.sub)}</p></article>`).join('')}</div><div class="two-column">${card('Member distribution', l.tiers.map((x) => `<div class="tier-row"><span class="tier-dot ${x.tier.toLowerCase()}"></span><b>${esc(x.tier)}</b><span>${esc(x.members)}</span><strong>${esc(x.share)}</strong></div>`).join(''))}${card('Active campaign', `<h3>${esc(l.campaign.title)}</h3><p>${esc(l.campaign.text)}</p><button class="primary-button" data-action="noop">Edit campaign</button>`)}</div>`);
  }
  if (s === 'insights') {
    const list = await api('/admin/insights');
    return header('admin', s, `<div class="insight-grid">${list.map((x) => `<article class="insight-card"><div class="ai-label"><span>✦</span> ${esc(x.tag)}</div><h3>${esc(x.title)}</h3><p>${esc(x.context)}</p><div class="confidence"><i></i> confidence estimate</div><button class="outline-button" data-action="noop">${esc(x.action)}</button></article>`).join('')}</div>${card('About these insights', '<p>Predictions are advisory, not certain. Each recommendation includes its supporting marketplace signals and confidence estimate.</p>')}`);
  }
  if (s === 'reports') {
    const list = await api('/admin/exports');
    return header('admin', s, `<div class="export-layout">${card('Export customer data', '<p>Sensitive customer fields are masked by default for your role.</p><div class="form-grid"><label class="form-field"><span>DATASET</span><input id="exp-dataset" value="Customers"/></label><label class="form-field"><span>FORMAT</span><input id="exp-format" value="Masked CSV"/></label></div><div class="checkbox-list"><label><input checked type="checkbox"/> Customer ID and name</label><label><input checked type="checkbox"/> Booking history and spend</label><label><input checked type="checkbox"/> Loyalty and wallet balances</label></div><button class="primary-button" data-action="export-create">Create export</button>')}${card('Recent exports', table(['Export ID', 'Requested by', 'Records', 'Format', 'Status'], list.map((e) => [e.id, e.by, e.records, e.format, badge(e.status, e.status === 'Completed' ? 'verified' : 'neutral')])))}</div>`);
  }
  return header('admin', s, empty('No data available', 'This module is ready to connect to marketplace data.'));
}

/* ================= shell: nav, draw, roles, counts ================= */
function navigation() { nav.innerHTML = navs[role].map(([key, icon, label, count]) => `<button class="nav-item ${screen === key ? 'active' : ''}" data-route="${key}"><span>${icon}</span>${label}${count ? `<b>${count}</b>` : ''}</button>`).join(''); }

async function draw(s, hash = true) {
  screen = s; navigation();
  Object.values(views).forEach((v) => v.classList.remove('active'));
  const host = views[role];
  host.classList.add('active');
  host.innerHTML = loadingHTML;
  try {
    host.innerHTML = role === 'customer' ? await customer(s) : role === 'partner' ? await partner(s) : await admin(s);
  } catch (err) {
    host.innerHTML = errorHTML(err);
  }
  if (hash) location.hash = `${role}/${s}`;
  scrollTo({ top: 0, behavior: 'smooth' });
}
function setRole(r) {
  const allowed = session.user.role === 'admin' ? ['customer', 'partner', 'admin'] : [viewOf(session.user.role)];
  if (!allowed.includes(r)) r = allowed[0];
  role = r;
  $$('.role').forEach((x) => x.classList.toggle('active', x.dataset.role === r));
  draw(r === 'customer' ? 'home' : 'dashboard');
}
async function refreshCounts() {
  try {
    if (role === 'customer') {
      const c = await api('/counts');
      navs.customer[2][3] = String(c.bookings || '');
    } else if (role === 'partner') {
      const c = await api('/partner/counts');
      navs.partner[1][3] = String(c.requests || '');
    } else {
      const c = await api('/admin/counts');
      navs.admin[4][3] = String(c.queries || '');
      navs.admin[5][3] = String(c.complaints || '');
    }
    navigation();
  } catch (e) { /* counts are best-effort */ }
}
function restore() {
  if (!session) { showAuth(); return; }
  document.body.classList.remove('auth-mode'); authRoot.classList.remove('active'); applyAccess();
  const [r, s] = location.hash.slice(1).split('/');
  const allowed = session.user.role === 'admin' ? Object.keys(navs) : [viewOf(session.user.role)];
  const rr = navs[r] && allowed.includes(r) ? r : allowed[0];
  role = rr;
  $$('.role').forEach((x) => x.classList.toggle('active', x.dataset.role === rr));
  draw(s || (rr === 'customer' ? 'home' : 'dashboard'), false);
}

/* ================= auth UI (design unchanged) ================= */
const authRoot = $('#auth-root');
let authMode = 'login', authTab = 'user';
const authCopy = {
  login: { eyebrow: 'WELCOME BACK', title: 'Sign in to your space', sub: 'Choose your space and continue where you left off.', sw: 'New to Shop2Door?', swLabel: 'Create account' },
  register: { eyebrow: 'JOIN SHOP2DOOR', title: 'Create your account', sub: 'One platform, two roles. Pick how you want to use Shop2Door.', sw: 'Already have an account?', swLabel: 'Sign in' }
};
const authRoles = { user: 'User', partner: 'Partner', admin: 'Admin' };
const authIcons = { user: '⌂', partner: '↗', admin: '⌘' };

function showAuth() { document.body.classList.add('auth-mode'); authRoot.classList.add('active'); renderAuth('login'); }
function renderAuth(mode) {
  authMode = mode; authTab = 'user';
  const login = mode === 'login', c = authCopy[mode];
  const tabs = login ? ['user', 'partner', 'admin'] : ['user', 'partner'];
  authRoot.innerHTML = `<div class="auth-shell"><div class="auth-main"><div class="auth-box">
    <a class="auth-brand" href="#"><span class="brand-mark"><i></i><i></i><i></i></span>shop2door</a>
    <p class="eyebrow">${c.eyebrow}</p><h1 class="auth-title">${c.title}</h1><p class="subhead">${c.sub}</p>
    <div class="auth-tabs" id="auth-tabs">${tabs.map((k) => `<button type="button" class="auth-tab" data-auth-tab="${k}"><span>${authIcons[k]}</span>${authRoles[k]}</button>`).join('')}</div>
    <div class="auth-error" id="auth-error"><b></b><span></span></div>
    <form class="auth-form" id="auth-form" novalidate>${login ? `
      <label class="auth-field"><span>EMAIL ADDRESS</span><input id="auth-email" type="email" placeholder="you@example.com" autocomplete="username"/></label>
      <label class="auth-field"><span>PASSWORD</span><span class="auth-pass"><input id="auth-pass" type="password" placeholder="Enter your password" autocomplete="current-password"/><button type="button" class="auth-eye" data-auth="eye">SHOW</button></span></label>
      <div class="auth-row"><label class="auth-check"><input type="checkbox" checked/><span>Remember me</span></label><button type="button" class="text-button" data-auth="forgot">Forgot password?</button></div>
      <button class="primary-button auth-submit" type="submit">Sign in <span>→</span></button>` : `
      <label class="auth-field partner-only"><span>BUSINESS NAME</span><input id="auth-business" placeholder="Your business name"/></label>
      <label class="auth-field"><span>FULL NAME</span><input id="auth-name" placeholder="Armaan Mulani"/></label>
      <label class="auth-field"><span>EMAIL ADDRESS</span><input id="auth-email" type="email" placeholder="you@example.com" autocomplete="email"/></label>
      <label class="auth-field"><span>MOBILE NUMBER</span><input id="auth-mobile" type="tel" placeholder="+91 98765 43210" autocomplete="tel"/></label>
      <label class="auth-field"><span>PASSWORD</span><span class="auth-pass"><input id="auth-pass" type="password" placeholder="At least 6 characters" autocomplete="new-password"/><button type="button" class="auth-eye" data-auth="eye">SHOW</button></span></label>
      <label class="auth-check"><input id="auth-terms" type="checkbox"/><span>I agree to the <a href="#" data-auth="terms">Terms of use</a> and <a href="#" data-auth="terms">Privacy policy</a></span></label>
      <button class="primary-button auth-submit" type="submit">Create account <span>→</span></button>`}
    </form>
    ${login ? '' : `<div class="auth-note"><span>✦</span><span id="auth-note-text"></span></div>`}
    <p class="auth-switch">${c.sw} <button type="button" class="text-button" data-auth="${login ? 'register' : 'login'}">${c.swLabel}</button></p>
    <div class="auth-foot"><span>Secure by design</span><span>✓ Verified professionals</span><span>◈ Shop2Door 2026</span></div>
  </div></div><aside class="auth-art"><div class="auth-glow"></div><div class="orb orb-one"></div><div class="orb orb-two"></div><div class="sparkle s1">✦</div><div class="sparkle s2">✦</div>
    <div class="auth-art-inner"><div class="ai-label"><span>✦</span> TRUSTED LOCAL HELP</div><h2>Local help, thoughtfully matched.</h2><p>Verified professionals, transparent pricing and real support — whether you are booking a service or growing your business.</p>
    <div class="auth-points"><div class="auth-point"><i>✓</i>Every professional is identity-verified</div><div class="auth-point"><i>◇</i>Clear prices before you book</div><div class="auth-point"><i>◌</i>Support that actually responds</div></div></div>
    <div class="float-card fc-a"><span class="fc-icon" style="background:#fff3dd;color:#ce8e28">★</span><div><b>4.8 rating</b><small>1,248 reviews</small></div></div>
    <div class="float-card fc-b"><span class="fc-icon" style="background:#e4f8f2;color:#15a883">✓</span><div><b>Verified partner</b><small>Background checked</small></div></div>
  </aside></div>`;
  setAuthTab('user');
}
function setAuthTab(k) {
  authTab = k;
  $$('#auth-tabs .auth-tab').forEach((b) => b.classList.toggle('active', b.dataset.authTab === k));
  if (authMode !== 'login') {
    $$('.partner-only').forEach((x) => x.classList.toggle('auth-hidden', k !== 'partner'));
    $('#auth-note-text').textContent = k === 'partner' ? 'List your services, accept bookings and grow your business.' : 'Book trusted local professionals and manage everything in one place.';
  }
  clearAuthError();
}
function authFail(title, msg) { const e = $('#auth-error'); if (!e) return; e.querySelector('b').textContent = title; e.querySelector('span').textContent = msg; e.classList.add('show'); }
function clearAuthError() { const e = $('#auth-error'); if (e) e.classList.remove('show'); }
function flash(msg) { toast.textContent = msg; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2400); }

async function handleLogin() {
  const email = $('#auth-email').value.trim(), pass = $('#auth-pass').value;
  if (!email && !pass) return authFail('Missing details', 'Enter your email address and password to continue.');
  try {
    const { token, user } = await api('/auth/login', { method: 'POST', body: { email, password: pass } });
    signIn({ token, user }, `Welcome back, ${user.name.split(' ')[0]}`);
  } catch (e) {
    authFail(!email ? 'Email required' : !pass ? 'Password required' : 'Sign in failed', e.message.includes('Backend unreachable') ? e.message : e.message);
  }
}
async function handleRegister() {
  const partner = authTab === 'partner';
  const payload = {
    name: $('#auth-name').value.trim(), email: $('#auth-email').value.trim(),
    mobile: $('#auth-mobile').value.trim(), password: $('#auth-pass').value,
    role: partner ? 'partner' : 'user', businessName: partner && $('#auth-business') ? $('#auth-business').value.trim() : '',
  };
  if (partner && !payload.businessName) return authFail('Business name required', 'Tell customers what your business is called.');
  if (!payload.name) return authFail('Name required', 'Enter your full name.');
  if (!$('#auth-terms').checked) return authFail('Terms not accepted', 'Please accept the Terms of use and Privacy policy.');
  try {
    const { token, user } = await api('/auth/register', { method: 'POST', body: payload });
    signIn({ token, user }, `Account created — welcome, ${user.name.split(' ')[0]}`);
  } catch (e) { authFail('Could not create account', e.message); }
}
function signIn(s, msg) {
  session = s; saveSession();
  document.body.classList.remove('auth-mode'); authRoot.classList.remove('active');
  applyAccess(); setRole(viewOf(s.user.role)); refreshCounts(); flash(msg);
}
function signOut(silent) {
  if (session && session.token) api('/auth/logout', { method: 'POST' }).catch(() => {});
  session = null; clearSession();
  topupOpen = false; draft = null;
  showAuth();
  if (!silent) flash('You have been signed out');
}
function applyAccess() {
  const allowed = session.user.role === 'admin' ? ['customer', 'partner', 'admin'] : [viewOf(session.user.role)];
  $$('.role').forEach((b) => { b.style.display = allowed.includes(b.dataset.role) ? '' : 'none'; });
  const acc = $('.account');
  if (acc) {
    acc.querySelector('.avatar').textContent = initials(session.user.name);
    acc.querySelector('strong').textContent = session.user.name;
    acc.querySelector('small').textContent = { user: 'Member since ' + (session.user.memberSince || '').split(' ').pop(), partner: 'Verified partner', admin: 'Platform administrator' }[session.user.role] || '';
  }
}

/* ================= global events ================= */
$$('.role').forEach((x) => x.addEventListener('click', () => setRole(x.dataset.role)));
authRoot.addEventListener('click', (e) => {
  const tab = e.target.closest('[data-auth-tab]');
  if (tab) { setAuthTab(tab.dataset.authTab); return; }
  const a = e.target.closest('[data-auth]');
  if (!a) return;
  e.preventDefault();
  const k = a.dataset.auth;
  if (k === 'login' || k === 'register') renderAuth(k);
  else if (k === 'eye') { const i = $('#auth-pass'); i.type = i.type === 'password' ? 'text' : 'password'; a.textContent = i.type === 'password' ? 'SHOW' : 'HIDE'; }
  else if (k === 'forgot') flash('Password reset is not configured yet. Contact an administrator.');
  else if (k === 'terms') flash('Please review the terms with your administrator.');
});
authRoot.addEventListener('submit', (e) => { e.preventDefault(); authMode === 'login' ? handleLogin() : handleRegister(); });

document.addEventListener('click', async (e) => {
  const mobileMenu = e.target.closest('.mobile-menu');
  if (mobileMenu) {
    e.preventDefault();
    document.body.classList.toggle('sidebar-open');
    return;
  }
  // Close sidebar on mobile when clicking outside
  if (document.body.classList.contains('sidebar-open') && !e.target.closest('.sidebar')) {
    document.body.classList.remove('sidebar-open');
  }
  const themeToggle = e.target.closest('[data-theme-toggle]');
  if (themeToggle) {
    e.preventDefault();
    const nextTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
    localStorage.setItem('shop2door-theme', nextTheme);
    applyTheme(nextTheme);
    flash(nextTheme === 'dark' ? 'Dark mode enabled' : 'Light mode enabled');
    return;
  }
  const so = e.target.closest('[data-signout]');
  if (so) { e.preventDefault(); signOut(); return; }
  const t = e.target.closest('[data-route]');
  if (t) { e.preventDefault(); if (t.dataset.route === 'login') { signOut(); return; } if (t.dataset.route !== '#') draw(t.dataset.route); document.body.classList.remove('sidebar-open'); return; }
  const h = e.target.closest('.heart');
  if (h && !h.dataset.id) { h.textContent = h.textContent === '♡' ? '♥' : '♡'; h.style.color = h.textContent === '♥' ? '#e45f77' : ''; }
  const c = e.target.closest('.category');
  if (c && !c.dataset.action) $$('.category').forEach((x) => x.classList.toggle('selected', x === c));
  const a = e.target.closest('[data-action]');
  if (!a) return;
  const k = a.dataset.action, id = a.dataset.id, v = a.dataset.v;
  try {
    if (k === 'retry') return draw(screen, false);
    if (k === 'noop') return flash('Available in the full product.');
    if (k === 'quick') { lastQuery = a.dataset.q || ''; filters = { availableToday: true, verified: false, topRated: false, under500: false, maxDistance: 0 }; return draw('results'); }
    if (k === 'do-search') { const inp = $('#service-search'); lastQuery = inp ? inp.value.trim() : ''; return draw('results'); }
    if (k === 'open-category') { lastQuery = a.dataset.q || ''; $$('.category').forEach((x) => x.classList.toggle('selected', x === a)); filters = { availableToday: false, verified: false, topRated: false, under500: false, maxDistance: 0 }; return draw('results'); }
    if (k === 'open-provider') { providerId = id; return draw('provider'); }
    if (k === 'book-provider') { const p = await api('/providers/' + id); const days = nextDays(); draft = { providerId: id, serviceId: (p.services.find((x) => x.active) || p.services[0] || {}).id, dateIdx: 1, dateValue: days[1].iso, dateLabel: days[1].full, dayNum: days[1].num, time: (p.slots || [])[0] || '10:30 AM', address: 'Home · 14B, Shantivan, Andheri West', payment: 'UPI' }; return draw('booking'); }
    if (k === 'pick-service') { draft.serviceId = id; return draw('booking', false); }
    if (k === 'pick-date') { const days = nextDays(); draft.dateIdx = Number(a.dataset.i); draft.dateValue = days[draft.dateIdx].iso; draft.dateLabel = days[draft.dateIdx].full; draft.dayNum = days[draft.dateIdx].num; return draw('booking', false); }
    if (k === 'pick-time') { draft.time = v; return draw('booking', false); }
    if (k === 'pick-pay') { draft.payment = v; return draw('booking', false); }
    if (k === 'confirm-booking') { const addrInp = $('#bk-address'); const commentsInp = $('#bk-comments'); if (addrInp && addrInp.value.trim()) draft.address = addrInp.value.trim(); draft.comments = commentsInp ? commentsInp.value.trim() : ''; lastBooking = await api('/bookings', { method: 'POST', body: { providerId: draft.providerId, serviceId: draft.serviceId, dateValue: draft.dateValue, dateLabel: draft.dateLabel, timeLabel: draft.time, address: draft.address, comments: draft.comments, payment: draft.payment } }); trackId = lastBooking.id; draft = null; refreshCounts(); return draw('confirmation'); }
    if (k === 'open-booking') { trackId = id; return draw('tracking'); }
    if (k === 'cancel-booking') { await api(`/bookings/${id}/cancel`, { method: 'POST' }); refreshCounts(); flash('Booking cancelled — refund credited to wallet.'); return draw('bookings'); }
    if (k === 'book-tab') { bookTab = v; return draw('bookings', false); }
    if (k === 'filter') { filters[a.dataset.k] = !filters[a.dataset.k]; return draw('results', false); }
    if (k === 'save-toggle') { const on = a.textContent.includes('Save'); a.textContent = on ? '♥ Saved' : '♡ Save'; return flash(on ? 'Saved to your list.' : 'Removed from your list.'); }
    if (k === 'topup-form') { topupOpen = true; return draw('wallet', false); }
    if (k === 'topup-confirm') { const amt = Number($('#topup-amount').value); await api('/wallet/topup', { method: 'POST', body: { amount: amt } }); topupOpen = false; flash(`${inr(amt)} added to your wallet.`); return draw('wallet', false); }
    if (k === 'redeem') { const r = await api('/loyalty/redeem', { method: 'POST' }); flash(`Reward unlocked — code ${r.code}.`); return draw('loyalty', false); }
    if (k === 'rate') { const rt = $('#review-text'); if (rt) reviewDraft.text = rt.value; reviewDraft.rating = Number(v); return draw('reviews', false); }
    if (k === 'tag') { const rtx = $('#review-text'); if (rtx) reviewDraft.text = rtx.value; const i = reviewDraft.tags.indexOf(v); i >= 0 ? reviewDraft.tags.splice(i, 1) : reviewDraft.tags.push(v); return draw('reviews', false); }
    if (k === 'review-submit') { await api('/reviews', { method: 'POST', body: { bookingId: reviewDraft.bookingId, rating: reviewDraft.rating, tags: reviewDraft.tags, text: $('#review-text').value } }); reviewDraft = { rating: 5, tags: [] }; flash('Thanks — your review was posted. +25 points.'); return draw('bookings'); }
    if (k === 'ticket-submit') { await api('/tickets', { method: 'POST', body: { bookingRef: $('#cp-booking').value, category: $('#cp-category').value, resolution: $('#cp-resolution').value, description: $('#cp-desc').value } }); flash('Support request submitted — we will respond shortly.'); return draw('support'); }
    if (k === 'profile-save') return flash('Profile saved.');
    if (k === 'req-tab') { reqTab = v; return draw('requests', false); }
    if (k === 'open-job') { jobId = id; return draw('job'); }
    if (k === 'job-accept') { await api(`/partner/jobs/${id}/accept`, { method: 'POST' }); refreshCounts(); flash('Booking accepted.'); return draw('requests'); }
    if (k === 'job-decline') { await api(`/partner/jobs/${id}/decline`, { method: 'POST' }); refreshCounts(); flash('Request declined.'); return draw('requests'); }
    if (k === 'job-start') { await api(`/partner/jobs/${id}/status`, { method: 'POST', body: { status: 'in_progress' } }); refreshCounts(); flash('Service started.'); return draw('requests'); }
    if (k === 'job-complete') { await api(`/partner/jobs/${id}/status`, { method: 'POST', body: { status: 'completed' } }); refreshCounts(); flash('Service marked as complete.'); return draw('requests'); }
    if (k === 'service-add') { await api('/partner/services', { method: 'POST', body: { name: $('#ns-name').value, price: $('#ns-price').value, durationMin: $('#ns-duration').value } }); flash('Service added.'); return draw('services', false); }
    if (k === 'service-toggle') { const cur = a.textContent.trim(); await api('/partner/services/' + id, { method: 'PATCH', body: { active: cur === 'Activate' } }); flash(cur === 'Activate' ? 'Service activated.' : 'Service paused.'); return draw('services', false); }
    if (k === 'service-delete') { if (!window.confirm('Remove this service?')) return; await api('/partner/services/' + id, { method: 'DELETE' }); flash('Service removed.'); return draw('services', false); }
    if (k === 'avail-toggle') { const cur = await api('/partner/availability'); await api('/partner/availability', { method: 'PATCH', body: { open: !cur.open } }); flash(!cur.open ? 'You are now available for jobs.' : 'New bookings paused.'); return draw(screen, false); }
    if (k === 'day-toggle') { const cur = await api('/partner/availability'); const sched = (cur.schedule || []).map((d) => d.day === v ? { ...d, open: !d.open, from: !d.open ? '9:00 AM' : 'Unavailable', to: !d.open ? '7:00 PM' : '' } : d); await api('/partner/availability', { method: 'PATCH', body: { schedule: sched } }); return draw('availability', false); }
    if (k === 'partner-profile-save') { await api('/partner/profile', { method: 'PATCH', body: { businessName: $('#pf-biz').value, area: $('#pf-area').value } }); applyAccess(); flash('Business profile updated.'); return draw('profile', false); }
    if (k === 'query-select') { queryId = id; return draw('queries', false); }
    if (k === 'reply-send') { const inp = $('#reply-input'); await api(`/admin/queries/${id}/reply`, { method: 'POST', body: { text: inp.value } }); flash('Reply sent.'); return draw('queries', false); }
    if (k === 'complaint-next') { const order = ['New', 'Investigating', 'Resolution proposed', 'Resolved']; const all = await api('/admin/complaints'); const cur = all.find((x) => x.id === id); await api('/admin/complaints/' + id, { method: 'PATCH', body: { status: order[Math.min(3, order.indexOf(cur.status) + 1)] } }); refreshCounts(); return draw(screen, false); }
    if (k === 'export-create') { await api('/admin/exports', { method: 'POST', body: { dataset: $('#exp-dataset').value, format: $('#exp-format').value } }); flash('Export created.'); return draw('reports', false); }
  } catch (err) { flash(err.message); }
});
document.addEventListener('change', (e) => {
  const f = e.target.closest('[data-f]');
  if (!f || screen !== 'results') return;
  if (f.dataset.f === 'maxDistance') filters.maxDistance = f.checked ? Number(f.value) : 0;
  else filters[f.dataset.f] = f.checked;
  draw('results', false);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.id === 'service-search' && !document.body.classList.contains('auth-mode')) { lastQuery = e.target.value.trim(); draw('results'); }
});

// Capacitor/Android back button handler
document.addEventListener('backbutton', (e) => {
  e.preventDefault();
  if (document.body.classList.contains('auth-mode')) {
    // On auth screen, exit app
    if (window.Capacitor?.Plugins?.App) {
      const { App } = Capacitor.Plugins;
      App.exitApp();
    }
    return;
  }
  if (document.body.classList.contains('sidebar-open')) {
    document.body.classList.remove('sidebar-open');
    return;
  }
  // Navigate back in history or go to dashboard
  if (screen !== 'home' && screen !== 'dashboard' && role === 'customer') {
    draw('home');
    return;
  }
  if (screen !== 'dashboard' && (role === 'partner' || role === 'admin')) {
    draw('dashboard');
    return;
  }
  // On main screens, exit app
  if (window.Capacitor?.Plugins?.App) {
    const { App } = Capacitor.Plugins;
    App.exitApp();
  }
});

/* ================= boot ================= */
const appLoader = $('#app-loader');
const APP_VERSION = '1.0.0';
const UPDATE_CHECK_URL = 'https://raw.githubusercontent.com/harshmishra21/Shop2Door/main/version.json';

function hideLoader() {
  if (appLoader) {
    appLoader.classList.add('hidden');
    setTimeout(() => appLoader.remove(), 300);
  }
}

async function checkForUpdate() {
  try {
    const res = await fetch(UPDATE_CHECK_URL + '?t=' + Date.now());
    if (!res.ok) return;
    const data = await res.json();
    if (data.version && data.version !== APP_VERSION && data.url) {
      const shouldUpdate = confirm(`New version ${data.version} available. Update now?`);
      if (shouldUpdate) {
        if (window.Capacitor?.Plugins?.App) {
          const { App } = Capacitor.Plugins;
          App.openUrl({ url: data.url });
        } else {
          window.open(data.url, '_blank');
        }
      }
    }
  } catch (e) {
    console.debug('Update check failed:', e.message);
  }
}

window.addEventListener('hashchange', restore);
(async function boot() {
  applyTheme(localStorage.getItem('shop2door-theme') || 'light');
  if (session && session.token) {
    try {
      const me = await api('/auth/me');
      session.user = me.user; saveSession();
      document.body.classList.remove('auth-mode'); authRoot.classList.remove('active');
      applyAccess(); restore(); refreshCounts(); hideLoader();
      checkForUpdate();
      return;
    } catch (e) { session = null; clearSession(); }
  }
  showAuth(); hideLoader();
  checkForUpdate();
})();
