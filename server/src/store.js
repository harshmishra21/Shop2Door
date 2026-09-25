// Data-access layer. Every function prefers AWS RDS SQL Server when connected,
// otherwise it operates on the in-memory seed copy. Same shapes either way.
const db = require('./db');
const seed = require('./seed');
const { newSalt, hashPassword } = require('./auth');

const mem = JSON.parse(JSON.stringify(seed));
const useDb = () => db.isConnected();
const nid = (p) => p + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);
const J = (v) => JSON.stringify(v ?? null);
const P = (v, fb) => { try { const x = JSON.parse(v); return x ?? fb; } catch { return fb; } };

function breakdown(price) {
  const fee = Math.round(price * 0.097);
  const gst = Math.round((price + fee) * 0.046);
  return { price, fee, gst, amount: price + fee + gst };
}

function publicUser(u) {
  if (!u) return null;
  const { passwordHash, salt, ...pub } = u;
  return pub;
}

/* ---------------- users / auth ---------------- */

async function findUserByEmail(email) {
  const em = String(email || '').trim().toLowerCase();
  if (useDb()) {
    const r = await db.pool.request().input('email', db.sql.NVarChar, em).query('SELECT * FROM users WHERE LOWER(email)=@email');
    return r.recordset[0] || null;
  }
  return mem.users.find((u) => u.email.toLowerCase() === em) || null;
}

async function findUserById(id) {
  if (useDb()) {
    const r = await db.pool.request().input('id', db.sql.NVarChar, id).query('SELECT * FROM users WHERE id=@id');
    return r.recordset[0] || null;
  }
  return mem.users.find((u) => u.id === id) || null;
}

async function createUser({ name, email, mobile, password, role, businessName }) {
  const em = String(email).trim().toLowerCase();
  if (await findUserByEmail(em)) {
    const e = new Error('An account with this email already exists.');
    e.code = 409;
    throw e;
  }
  const salt = newSalt();
  const u = {
    id: nid('u'), name: name.trim(), email: em, mobile: mobile.trim(),
    role: role === 'partner' ? 'partner' : 'user',
    passwordHash: hashPassword(password, salt), salt,
    memberSince: 'September 2026', walletBalance: 0, walletPromo: 0, walletRefund: 0, walletSaved: 0,
    loyaltyTier: 'Bronze', loyaltyPoints: 0, providerId: null,
  };
  if (useDb()) {
    await db.pool.request()
      .input('id', db.sql.NVarChar, u.id).input('name', db.sql.NVarChar, u.name)
      .input('email', db.sql.NVarChar, u.email).input('mobile', db.sql.NVarChar, u.mobile)
      .input('role', db.sql.NVarChar, u.role).input('passwordHash', db.sql.NVarChar, u.passwordHash)
      .input('salt', db.sql.NVarChar, u.salt).input('memberSince', db.sql.NVarChar, u.memberSince)
      .input('providerId', db.sql.NVarChar, u.providerId)
      .query('INSERT INTO users (id,name,email,mobile,role,passwordHash,salt,memberSince,walletBalance,walletPromo,walletRefund,walletSaved,loyaltyTier,loyaltyPoints,providerId) VALUES (@id,@name,@email,@mobile,@role,@passwordHash,@salt,@memberSince,0,0,0,0,\'Bronze\',0,@providerId)');
  } else {
    mem.users.push(u);
  }
  if (u.role === 'partner') {
    const p = await createProvider({
      name: (businessName || `${u.name.split(' ')[0]} Services`).trim(),
      category: 'Electrician', categoryKey: 'electrician', exp: 'New partner', expYears: 0,
      rating: 5.0, reviewsCount: 0, responseMin: 15, distanceKm: 1.0, priceFrom: 299, priceUnit: '',
      tags: [], initials: u.name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase(),
      verified: false, available: true, area: 'Mumbai', about: 'New professional on Shop2Door.', trust: ['Identity verified'],
      slots: ['Tomorrow, 10:00 AM'],
    });
    u.providerId = p.id;
    if (useDb()) {
      await db.pool.request().input('id', db.sql.NVarChar, u.id).input('providerId', db.sql.NVarChar, p.id)
        .query('UPDATE users SET providerId=@providerId WHERE id=@id');
    }
  }
  return u;
}

/* ---------------- catalog ---------------- */

async function listCategories() {
  if (useDb()) {
    const r = await db.pool.request().query('SELECT * FROM categories ORDER BY sort');
    return r.recordset;
  }
  return mem.categories;
}

async function searchProviders({ q = '', maxDistance = 0, maxPrice = 0, minRating = 0, availableToday = false }) {
  const needle = q.trim().toLowerCase();
  let list;
  if (useDb()) {
    const r = await db.pool.request().query('SELECT * FROM providers');
    list = r.recordset.map((p) => ({ ...p, tags: P(p.tags, []), trust: P(p.trust, []), slots: P(p.slots, []) }));
  } else {
    list = mem.providers;
  }
  return list
    .filter((p) => {
      if (needle && ![p.name, p.category, ...(p.tags || [])].join(' ').toLowerCase().includes(needle)) return false;
      if (maxDistance && p.distanceKm > maxDistance) return false;
      if (maxPrice && p.priceFrom > maxPrice) return false;
      if (minRating && p.rating < minRating) return false;
      if (availableToday && !(p.available && (p.slots || []).length)) return false;
      return true;
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

async function listServices(providerId) {
  if (useDb()) {
    const r = await db.pool.request().input('pid', db.sql.NVarChar, providerId).query('SELECT * FROM services WHERE providerId=@pid');
    return r.recordset;
  }
  return mem.services.filter((s) => s.providerId === providerId);
}

async function listReviews(providerId) {
  if (useDb()) {
    const r = await db.pool.request().input('pid', db.sql.NVarChar, providerId).query('SELECT * FROM reviews WHERE providerId=@pid');
    return r.recordset;
  }
  return mem.reviews.filter((r) => r.providerId === providerId);
}

async function getProvider(id) {
  let p;
  if (useDb()) {
    const r = await db.pool.request().input('id', db.sql.NVarChar, id).query('SELECT * FROM providers WHERE id=@id');
    p = r.recordset[0];
    if (p) { p.tags = P(p.tags, []); p.trust = P(p.trust, []); p.slots = P(p.slots, []); }
  } else {
    p = mem.providers.find((x) => x.id === id);
  }
  if (!p) return null;
  const services = await listServices(id);
  const reviews = await listReviews(id);
  return { ...p, services, reviews };
}

async function createProvider(p) {
  const rec = { id: nid('p'), verification: 'Pending', status: 'Review', availability: p.available ? 'Available' : 'Unavailable', jobsCompleted: 0, ...p };
  if (useDb()) {
    await db.pool.request()
      .input('id', db.sql.NVarChar, rec.id).input('name', db.sql.NVarChar, rec.name)
      .input('category', db.sql.NVarChar, rec.category).input('categoryKey', db.sql.NVarChar, rec.categoryKey)
      .input('exp', db.sql.NVarChar, rec.exp).input('expYears', db.sql.Int, rec.expYears)
      .input('rating', db.sql.Float, rec.rating).input('reviewsCount', db.sql.Int, rec.reviewsCount)
      .input('responseMin', db.sql.Int, rec.responseMin).input('distanceKm', db.sql.Float, rec.distanceKm)
      .input('priceFrom', db.sql.Int, rec.priceFrom).input('priceUnit', db.sql.NVarChar, rec.priceUnit)
      .input('tags', db.sql.NVarChar, J(rec.tags)).input('initials', db.sql.NVarChar, rec.initials)
      .input('verified', db.sql.Bit, rec.verified ? 1 : 0).input('available', db.sql.Bit, rec.available ? 1 : 0)
      .input('area', db.sql.NVarChar, rec.area).input('about', db.sql.NVarChar, rec.about)
      .input('trust', db.sql.NVarChar, J(rec.trust)).input('slots', db.sql.NVarChar, J(rec.slots))
      .query('INSERT INTO providers (id,name,category,categoryKey,exp,expYears,rating,reviewsCount,responseMin,distanceKm,priceFrom,priceUnit,tags,initials,verified,available,area,about,trust,slots,verification,status,availability,jobsCompleted) VALUES (@id,@name,@category,@categoryKey,@exp,@expYears,@rating,@reviewsCount,@responseMin,@distanceKm,@priceFrom,@priceUnit,@tags,@initials,@verified,@available,@area,@about,@trust,@slots,\'Pending\',\'Review\',@availability,0)');
  } else {
    mem.providers.push(rec);
  }
  return rec;
}

async function listRecommendations() {
  if (useDb()) {
    const r = await db.pool.request().query('SELECT * FROM recommendations');
    return r.recordset;
  }
  return mem.recommendations;
}

/* ---------------- bookings ---------------- */

const TAB_STATUS = { upcoming: ['pending', 'confirmed'], active: ['in_progress'], completed: ['completed'], cancelled: ['cancelled'], due: ['due'] };

async function allBookings() {
  if (useDb()) {
    const r = await db.pool.request().query('SELECT * FROM bookings');
    return r.recordset.map((b) => ({ ...b, history: P(b.history, []) }));
  }
  return mem.bookings;
}

async function enrichBooking(b) {
  const p = await getProvider(b.providerId);
  return { ...b, providerName: p ? p.name : 'Provider', providerInitials: p ? p.initials : '··', providerRating: p ? p.rating : null };
}

async function listBookings(userId, tab = 'upcoming') {
  await updateOverdueBookings();
  const all = (await allBookings()).filter((b) => b.userId === userId && (TAB_STATUS[tab] || TAB_STATUS.upcoming).includes(b.status));
  const out = [];
  for (const b of all) out.push(await enrichBooking(b));
  return out;
}

async function getBooking(id, userId) {
  const b = (await allBookings()).find((x) => x.id === id && (!userId || x.userId === userId));
  return b ? enrichBooking(b) : null;
}

async function updateOverdueBookings() {
  const all = await allBookings();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let updated = 0;
  for (const b of all) {
    if (['pending', 'confirmed'].includes(b.status)) {
      const dateText = String(b.dateLabel || '').replace(/^[^,]+,\s*/, '').trim();
      const dateParts = dateText.match(/^(\d{1,2})\s+([A-Za-z]+)$/);
      const bookingDate = dateParts ? new Date(`${dateParts[2]} ${dateParts[1]}, ${new Date().getFullYear()}`) : new Date(dateText);
      if (!Number.isNaN(bookingDate.getTime()) && bookingDate < today) {
        b.status = 'due';
        b.history = [...(b.history || []), { label: 'Marked as due (past date)', at: nowLabel() }];
        if (useDb()) {
          await db.pool.request().input('id', db.sql.NVarChar, b.id).input('status', db.sql.NVarChar, 'due')
            .input('history', db.sql.NVarChar, JSON.stringify(b.history))
            .query('UPDATE bookings SET status=@status, history=@history WHERE id=@id');
        }
        updated++;
      }
    }
  }
  return updated;
}

const nowLabel = () => new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit' });

async function createBooking(userId, { providerId, serviceId, dateValue, dateLabel, timeLabel, address, comments, payment }) {
  const provider = await getProvider(providerId);
  if (!provider) { const e = new Error('Provider not found.'); e.code = 404; throw e; }
  const service = (provider.services || []).find((s) => s.id === serviceId) || (provider.services || []).find((s) => s.active) || provider.services[0];
  if (!service) { const e = new Error('This provider has no bookable services right now.'); e.code = 400; throw e; }
  const user = await findUserById(userId);
  if (!user) { const e = new Error('Customer account not found.'); e.code = 404; throw e; }
  const isoDate = /^\d{4}-\d{2}-\d{2}$/.test(String(dateValue || '')) ? String(dateValue) : '';
  const dateText = String(dateLabel || '').replace(/^[^,]+,\s*/, '').trim();
  const dateParts = dateText.match(/^(\d{1,2})\s+([A-Za-z]+)$/);
  const bookingDate = isoDate
    ? new Date(`${isoDate}T00:00:00`)
    : dateParts ? new Date(`${dateParts[2]} ${dateParts[1]}, ${new Date().getFullYear()}`) : new Date(dateText);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (Number.isNaN(bookingDate.getTime()) || bookingDate < today) {
    const e = new Error('Choose a valid future booking date.'); e.code = 400; throw e;
  }
  const { price, fee, gst, amount } = breakdown(service.price);
  if (payment === 'Wallet' && (user.walletBalance || 0) < amount) {
    const e = new Error('Insufficient wallet balance for this booking.');
    e.code = 402;
    throw e;
  }
  const dayNum = String(dateLabel || '').replace(/^[^,]+,\s*/, '').split(' ')[0] || '';
  const monthLabel = bookingDate.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase();
  const b = {
    id: nid('b'), code: 'BK-2026-' + Math.floor(1000 + Math.random() * 9000) + '-' + Math.floor(100 + Math.random() * 900),
    userId, customerName: user.name, providerId, partnerName: provider.name, serviceId: service.id, serviceName: service.name,
    monthLabel, dayNum, dateLabel: dateLabel || 'Saturday', timeLabel: timeLabel || provider.slots[0] || '10:00 AM',
    address: address || 'Home', comments: String(comments || '').trim().slice(0, 500), price, fee, gst, amount, status: 'pending',
    payment: payment || 'UPI', createdAt: nowLabel(),
    history: [{ label: 'Booking requested', at: nowLabel() }],
  };
  if (useDb()) {
    await db.pool.request()
      .input('id', db.sql.NVarChar, b.id).input('code', db.sql.NVarChar, b.code)
      .input('userId', db.sql.NVarChar, b.userId).input('customerName', db.sql.NVarChar, b.customerName)
      .input('providerId', db.sql.NVarChar, b.providerId).input('partnerName', db.sql.NVarChar, b.partnerName)
      .input('serviceId', db.sql.NVarChar, b.serviceId).input('serviceName', db.sql.NVarChar, b.serviceName)
      .input('monthLabel', db.sql.NVarChar, b.monthLabel).input('dayNum', db.sql.NVarChar, b.dayNum)
      .input('dateLabel', db.sql.NVarChar, b.dateLabel).input('timeLabel', db.sql.NVarChar, b.timeLabel)
      .input('address', db.sql.NVarChar, b.address).input('comments', db.sql.NVarChar, b.comments).input('price', db.sql.Int, b.price)
      .input('fee', db.sql.Int, b.fee).input('gst', db.sql.Int, b.gst).input('amount', db.sql.Int, b.amount)
      .input('status', db.sql.NVarChar, b.status).input('payment', db.sql.NVarChar, b.payment)
      .input('createdAt', db.sql.NVarChar, b.createdAt).input('history', db.sql.NVarChar, J(b.history))
      .query('INSERT INTO bookings (id,code,userId,customerName,providerId,partnerName,serviceId,serviceName,monthLabel,dayNum,dateLabel,timeLabel,address,comments,price,fee,gst,amount,status,payment,createdAt,history) VALUES (@id,@code,@userId,@customerName,@providerId,@partnerName,@serviceId,@serviceName,@monthLabel,@dayNum,@dateLabel,@timeLabel,@address,@comments,@price,@fee,@gst,@amount,@status,@payment,@createdAt,@history)');
  } else {
    mem.bookings.push(b);
  }
  if (payment === 'Wallet') await adjustWallet(userId, -amount, `Service payment · ${service.name}`, 'Booking payment');
  const pts = Math.round(amount * 0.25);
  await addLoyalty(userId, pts, 'Booking completed', `${service.name}`);
  return enrichBooking(b);
}

async function cancelBooking(id, userId) {
  const b = (await allBookings()).find((x) => x.id === id && x.userId === userId);
  if (!b) { const e = new Error('Booking not found.'); e.code = 404; throw e; }
  if (['completed', 'cancelled'].includes(b.status)) { const e = new Error('This booking can no longer be cancelled.'); e.code = 400; throw e; }
  b.status = 'cancelled';
  b.history = [...(b.history || []), { label: 'Booking cancelled', at: nowLabel() }];
  if (useDb()) {
    await db.pool.request().input('id', db.sql.NVarChar, id).input('history', db.sql.NVarChar, J(b.history))
      .query("UPDATE bookings SET status='cancelled', history=@history WHERE id=@id");
  }
  await adjustWallet(userId, b.amount, 'Refund received', 'Booking cancelled');
  return enrichBooking(b);
}

/* ---------------- wallet / loyalty ---------------- */

async function getWallet(userId) {
  const u = await findUserById(userId);
  let txns;
  if (useDb()) {
    const r = await db.pool.request().input('uid', db.sql.NVarChar, userId).query('SELECT * FROM wallet_txns WHERE userId=@uid ORDER BY row DESC');
    txns = r.recordset;
  } else {
    txns = mem.walletTxns.filter((t) => t.userId === userId);
  }
  return { balance: u.walletBalance || 0, promo: u.walletPromo || 0, refund: u.walletRefund || 0, saved: u.walletSaved || 0, transactions: txns };
}

async function adjustWallet(userId, amount, name, reason) {
  const txn = { id: 'WT-' + Math.floor(100000 + Math.random() * 899999), userId, name, meta: reason, amount, kind: amount >= 0 ? 'credit' : 'debit', date: nowLabel().split(',')[0], reason, status: 'Completed' };
  if (useDb()) {
    await db.pool.request()
      .input('id', db.sql.NVarChar, txn.id).input('userId', db.sql.NVarChar, userId)
      .input('name', db.sql.NVarChar, name).input('meta', db.sql.NVarChar, reason)
      .input('amount', db.sql.Int, amount).input('kind', db.sql.NVarChar, txn.kind)
      .input('date', db.sql.NVarChar, txn.date).input('reason', db.sql.NVarChar, reason)
      .query('INSERT INTO wallet_txns (id,userId,name,meta,amount,kind,date,reason,status) VALUES (@id,@userId,@name,@meta,@amount,@kind,@date,@reason,\'Completed\')');
    await db.pool.request().input('uid', db.sql.NVarChar, userId).input('amt', db.sql.Int, amount)
      .query('UPDATE users SET walletBalance=walletBalance+@amt WHERE id=@uid');
  } else {
    mem.walletTxns.unshift(txn);
    const u = mem.users.find((x) => x.id === userId);
    u.walletBalance = (u.walletBalance || 0) + amount;
  }
  return txn;
}

async function topupWallet(userId, amount) {
  const amt = Math.floor(Number(amount));
  if (!amt || amt < 10 || amt > 50000) { const e = new Error('Enter an amount between ₹10 and ₹50,000.'); e.code = 400; throw e; }
  return adjustWallet(userId, amt, 'Wallet top-up', 'Added via UPI');
}

async function getLoyalty(userId) {
  const u = await findUserById(userId);
  let activity;
  if (useDb()) {
    const r = await db.pool.request().input('uid', db.sql.NVarChar, userId).query('SELECT * FROM loyalty_activity WHERE userId=@uid ORDER BY row DESC');
    activity = r.recordset;
  } else {
    activity = mem.loyaltyActivity.filter((a) => a.userId === userId);
  }
  const tier = u.loyaltyTier || 'Bronze';
  const points = u.loyaltyPoints || 0;
  const toNext = tier === 'Silver' ? Math.max(0, 2500 - points) : tier === 'Bronze' ? Math.max(0, 1000 - points) : 0;
  const progress = tier === 'Silver' ? Math.min(100, Math.round((points / 2500) * 100)) : tier === 'Bronze' ? Math.min(100, Math.round((points / 1000) * 100)) : 100;
  return {
    tier, points, toNext, progress,
    benefits: tier === 'Silver' ? ['2× points on weekday bookings', 'Priority support queue', 'Early access to offers'] : ['1× points on every booking', 'Member-only offers', 'Priority support queue'],
    nextReward: { title: '₹150 off your next AC service', cost: 1200, valid: 'Redeem 1,200 points before 30 September.' },
    activity,
  };
}

async function addLoyalty(userId, points, name, meta) {
  const entry = { id: nid('l'), userId, name, meta, points };
  if (useDb()) {
    await db.pool.request().input('id', db.sql.NVarChar, entry.id).input('userId', db.sql.NVarChar, userId)
      .input('name', db.sql.NVarChar, name).input('meta', db.sql.NVarChar, meta).input('points', db.sql.Int, points)
      .query('INSERT INTO loyalty_activity (id,userId,name,meta,points) VALUES (@id,@userId,@name,@meta,@points)');
    await db.pool.request().input('uid', db.sql.NVarChar, userId).input('pts', db.sql.Int, points)
      .query('UPDATE users SET loyaltyPoints=loyaltyPoints+@pts WHERE id=@uid');
  } else {
    mem.loyaltyActivity.unshift(entry);
    const u = mem.users.find((x) => x.id === userId);
    u.loyaltyPoints = (u.loyaltyPoints || 0) + points;
  }
  return entry;
}

async function redeemReward(userId) {
  const u = await findUserById(userId);
  if ((u.loyaltyPoints || 0) < 1200) { const e = new Error('You need 1,200 points to redeem this reward.'); e.code = 400; throw e; }
  await addLoyalty(userId, -1200, 'Reward redeemed', '₹150 off AC service');
  return { code: 'S2D-' + Math.random().toString(36).slice(2, 8).toUpperCase(), title: '₹150 off your next AC service' };
}

async function submitReview(userId, { bookingId, rating, tags, text }) {
  const r = Math.min(5, Math.max(1, Number(rating) || 5));
  const b = (await allBookings()).find((x) => x.id === bookingId && x.userId === userId);
  if (!b) { const e = new Error('Booking not found.'); e.code = 404; throw e; }
  const u = await findUserById(userId);
  const rev = { id: nid('r'), providerId: b.providerId, author: u.name, rating: r, text: text || '', tags: tags || [], at: nowLabel().split(',')[0] };
  if (useDb()) {
    await db.pool.request().input('id', db.sql.NVarChar, rev.id).input('pid', db.sql.NVarChar, rev.providerId)
      .input('author', db.sql.NVarChar, rev.author).input('rating', db.sql.Int, r)
      .input('text', db.sql.NVarChar, rev.text).input('at', db.sql.NVarChar, rev.at)
      .query('INSERT INTO reviews (id,providerId,author,rating,text,at) VALUES (@id,@pid,@author,@rating,@text,@at)');
    await db.pool.request().input('id', db.sql.NVarChar, bookingId).query("UPDATE bookings SET reviewed=1 WHERE id=@id");
  } else {
    mem.reviews.unshift(rev);
    b.reviewed = true;
  }
  await addLoyalty(userId, 25, 'Review submitted', b.serviceName);
  return rev;
}

/* ---------------- support tickets ---------------- */

async function listTickets(userId) {
  if (useDb()) {
    const r = await db.pool.request().input('uid', db.sql.NVarChar, userId).query('SELECT * FROM tickets WHERE userId=@uid ORDER BY row DESC');
    return r.recordset.map((t) => ({ ...t, messages: P(t.messages, []) }));
  }
  return mem.tickets.filter((t) => t.userId === userId);
}

async function createTicket(userId, { bookingRef, category, resolution, description }) {
  if (!description || !description.trim()) { const e = new Error('Please describe the issue.'); e.code = 400; throw e; }
  const u = await findUserById(userId);
  const t = {
    id: 'TK-' + Math.floor(8100 + Math.random() * 900), userId, customerName: u.name,
    subject: (category || 'General') + (bookingRef ? ` · ${bookingRef}` : ''), category: category || 'General',
    status: 'In progress', priority: 'Medium', updated: 'just now',
    messages: [{ from: 'customer', text: `${description.trim()}${resolution ? ` (Preferred resolution: ${resolution})` : ''}`, at: nowLabel() }],
  };
  if (useDb()) {
    await db.pool.request().input('id', db.sql.NVarChar, t.id).input('uid', db.sql.NVarChar, userId)
      .input('customerName', db.sql.NVarChar, t.customerName).input('subject', db.sql.NVarChar, t.subject)
      .input('category', db.sql.NVarChar, t.category).input('messages', db.sql.NVarChar, J(t.messages))
      .query("INSERT INTO tickets (id,userId,customerName,subject,category,status,priority,updated,messages) VALUES (@id,@uid,@customerName,@subject,@category,'In progress','Medium','just now',@messages)");
  } else {
    mem.tickets.unshift(t);
  }
  return t;
}

async function customerCounts(userId) {
  const upcoming = (await listBookings(userId, 'upcoming')).length;
  return { bookings: upcoming };
}

/* ---------------- partner ---------------- */

async function providerIdFor(userId) {
  const u = await findUserById(userId);
  return u ? u.providerId : null;
}

async function bookingJobFor(booking) {
  const customer = await findUserById(booking.userId);
  const customerName = customer ? customer.name : 'Customer';
  const status = booking.status === 'pending' ? 'new' :
    booking.status === 'confirmed' ? 'upcoming' :
    booking.status === 'in_progress' ? 'active' :
    booking.status === 'completed' ? 'completed' :
    booking.status === 'declined' ? 'declined' :
    booking.status === 'cancelled' ? 'cancelled' :
    booking.status === 'due' ? 'due' : 'new';
  return {
    id: booking.id,
    providerId: booking.providerId,
    kind: 'request',
    customer: customerName,
    customerMeta: booking.payment ? `${booking.payment} · ${booking.status}` : booking.status,
    type: (booking.serviceName || 'SERVICE').toUpperCase(),
    service: booking.serviceName || 'Service',
    dateLabel: booking.dateLabel || 'Today',
    timeLabel: booking.timeLabel || 'Flexible',
    place: booking.address || 'Service address',
    price: Number(booking.amount || 0),
    status,
    note: booking.comments || `Booking ${booking.code || booking.id}`,
    payment: booking.payment || 'UPI',
  };
}

async function allJobs() {
  const bookings = (await allBookings()).map((b) => bookingJobFor(b));
  return await Promise.all(bookings);
}

async function getDashboard(providerId) {
  const jobs = (await allJobs()).filter((j) => j.providerId === providerId);
  const upcoming = jobs.filter((j) => (j.kind === 'job' && j.status === 'upcoming') || (j.kind === 'request' && ['new', 'upcoming'].includes(j.status)));
  const todayEarnings = upcoming.filter((j) => j.dateLabel === 'Today').reduce((s, j) => s + Number(j.price || 0), 0);
  const p = await getProvider(providerId);
  const av = await getAvailability(providerId);
  return {
    kpis: {
      upcomingJobs: upcoming.length, upcomingDelta: '+2 since yesterday',
      todayEarnings, pendingEarnings: 1200,
      rating: p.rating, ratingCount: p.reviewsCount, responseMin: p.responseMin, responseNote: 'Top 10% in Mumbai',
    },
    jobs: upcoming,
    availability: { open: av.open, note: av.note },
  };
}

const REQ_STATUS = { new: ['new'], upcoming: ['upcoming'], active: ['in_progress'], completed: ['completed'], due: ['due'] };

async function listRequests(providerId, tab = 'new') {
  await updateOverdueBookings();
  const all = (await allJobs()).filter((j) => j.providerId === providerId && (REQ_STATUS[tab] || REQ_STATUS.new).includes(j.status));
  const counts = {};
  for (const [k, st] of Object.entries(REQ_STATUS)) counts[k] = (await allJobs()).filter((j) => j.providerId === providerId && st.includes(j.status)).length;
  return { list: all, counts };
}

async function getJob(id, providerId) {
  const j = (await allJobs()).find((x) => x.id === id && x.providerId === providerId);
  if (j) return j;
  const booking = (await allBookings()).find((x) => x.id === id && x.providerId === providerId);
  return booking ? bookingJobFor(booking) : null;
}

async function setJobStatus(id, providerId, status) {
  const allowed = ['upcoming', 'declined', 'in_progress', 'completed', 'cancelled', 'due'];
  if (!allowed.includes(status)) { const e = new Error('Invalid status.'); e.code = 400; throw e; }
  const booking = (await allBookings()).find((x) => x.id === id && x.providerId === providerId);
  if (booking) {
    const mapped = { upcoming: 'confirmed', declined: 'declined', in_progress: 'in_progress', completed: 'completed', cancelled: 'cancelled', due: 'due' }[status] || status;
    booking.status = mapped;
    if (useDb()) {
      await db.pool.request().input('id', db.sql.NVarChar, id).input('status', db.sql.NVarChar, mapped)
        .query('UPDATE bookings SET status=@status WHERE id=@id');
    }
    return bookingJobFor(booking);
  }
  const j = (await allJobs()).find((x) => x.id === id && x.providerId === providerId);
  if (!j) { const e = new Error('Job not found.'); e.code = 404; throw e; }
  j.status = status;
  if (useDb()) {
    await db.pool.request().input('id', db.sql.NVarChar, id).input('status', db.sql.NVarChar, status)
      .query('UPDATE jobs SET status=@status WHERE id=@id');
  }
  return j;
}

async function addService(providerId, { name, price, durationMin, detail }) {
  if (!name || !name.trim()) { const e = new Error('Service name is required.'); e.code = 400; throw e; }
  const s = { id: nid('s'), providerId, name: name.trim(), detail: detail || `${durationMin || 30} min · Andheri West`, price: Math.max(1, Math.floor(Number(price) || 299)), durationMin: Number(durationMin) || 30, active: true };
  if (useDb()) {
    await db.pool.request().input('id', db.sql.NVarChar, s.id).input('pid', db.sql.NVarChar, providerId)
      .input('name', db.sql.NVarChar, s.name).input('detail', db.sql.NVarChar, s.detail)
      .input('price', db.sql.Int, s.price).input('durationMin', db.sql.Int, s.durationMin)
      .query('INSERT INTO services (id,providerId,name,detail,price,durationMin,active) VALUES (@id,@pid,@name,@detail,@price,@durationMin,1)');
  } else {
    mem.services.push(s);
  }
  return s;
}

async function updateService(providerId, id, patch) {
  const list = await listServices(providerId);
  const s = list.find((x) => x.id === id);
  if (!s) { const e = new Error('Service not found.'); e.code = 404; throw e; }
  if (patch.active !== undefined) s.active = !!patch.active;
  if (patch.name) s.name = patch.name;
  if (patch.price) s.price = Math.max(1, Math.floor(Number(patch.price)));
  if (useDb()) {
    await db.pool.request().input('id', db.sql.NVarChar, id).input('active', db.sql.Bit, s.active ? 1 : 0)
      .input('name', db.sql.NVarChar, s.name).input('price', db.sql.Int, s.price)
      .query('UPDATE services SET active=@active, name=@name, price=@price WHERE id=@id');
  }
  return s;
}

async function removeService(providerId, id) {
  const list = await listServices(providerId);
  if (!list.some((service) => service.id === id)) { const e = new Error('Service not found.'); e.code = 404; throw e; }
  if (useDb()) {
    await db.pool.request().input('id', db.sql.NVarChar, id).input('providerId', db.sql.NVarChar, providerId)
      .query('DELETE FROM services WHERE id=@id AND providerId=@providerId');
  } else {
    mem.services = mem.services.filter((service) => service.id !== id);
  }
  return { ok: true, id };
}

async function getAvailability(providerId) {
  if (useDb()) {
    const r = await db.pool.request().input('pid', db.sql.NVarChar, providerId).query('SELECT * FROM availability WHERE providerId=@pid');
    const row = r.recordset[0];
    if (row) return { open: !!row.open, note: row.note, schedule: P(row.schedule, []) };
  } else if (mem.availability[providerId]) {
    return mem.availability[providerId];
  }
  return { open: true, note: "You'll be shown to nearby customers for new jobs.", schedule: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, i) => ({ day, open: i !== 6, from: i === 5 ? '10:00 AM' : '9:00 AM', to: i === 5 ? '4:00 PM' : '7:00 PM' })) };
}

async function updateAvailability(providerId, patch) {
  const cur = await getAvailability(providerId);
  const next = { open: patch.open !== undefined ? !!patch.open : cur.open, note: cur.note, schedule: patch.schedule || cur.schedule };
  if (useDb()) {
    const exists = await db.pool.request().input('pid', db.sql.NVarChar, providerId).query('SELECT providerId FROM availability WHERE providerId=@pid');
    if (exists.recordset.length) {
      await db.pool.request().input('pid', db.sql.NVarChar, providerId).input('open', db.sql.Bit, next.open ? 1 : 0).input('schedule', db.sql.NVarChar, J(next.schedule))
        .query('UPDATE availability SET [open]=@open, schedule=@schedule WHERE providerId=@pid');
    } else {
      await db.pool.request().input('pid', db.sql.NVarChar, providerId).input('open', db.sql.Bit, next.open ? 1 : 0).input('note', db.sql.NVarChar, next.note).input('schedule', db.sql.NVarChar, J(next.schedule))
        .query('INSERT INTO availability (providerId,[open],note,schedule) VALUES (@pid,@open,@note,@schedule)');
    }
  } else {
    mem.availability[providerId] = next;
  }
  return next;
}

async function getEarnings(providerId) {
  if (useDb()) {
    const r = await db.pool.request().input('pid', db.sql.NVarChar, providerId).query('SELECT * FROM earnings WHERE providerId=@pid');
    const row = r.recordset[0];
    if (row) return { ...row, series: P(row.series, []), payments: P(row.payments, []) };
  } else if (mem.earnings[providerId]) {
    return mem.earnings[providerId];
  }
  return { week: 0, weekDelta: 'No payouts yet', pending: 0, pendingNote: '', completed: 0, avg: 0, avgNote: '', series: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], payments: [] };
}

async function updateProfile(providerId, patch) {
  let p;
  if (useDb()) {
    const r = await db.pool.request().input('id', db.sql.NVarChar, providerId).query('SELECT * FROM providers WHERE id=@id');
    p = r.recordset[0];
    if (!p) { const e = new Error('Provider not found.'); e.code = 404; throw e; }
    const name = patch.businessName || p.name;
    const area = patch.area || p.area;
    await db.pool.request().input('id', db.sql.NVarChar, providerId).input('name', db.sql.NVarChar, name).input('area', db.sql.NVarChar, area)
      .query('UPDATE providers SET name=@name, area=@area WHERE id=@id');
    return { ...p, name, area, tags: P(p.tags, []), trust: P(p.trust, []), slots: P(p.slots, []) };
  }
  p = mem.providers.find((x) => x.id === providerId);
  if (!p) { const e = new Error('Provider not found.'); e.code = 404; throw e; }
  if (patch.businessName) p.name = patch.businessName;
  if (patch.area) p.area = patch.area;
  return p;
}

async function partnerCounts(providerId) {
  const all = (await allJobs()).filter((j) => j.providerId === providerId);
  return { requests: all.filter((j) => j.status === 'new').length };
}

/* ---------------- admin ---------------- */

async function getOverview() {
  if (useDb()) {
    const r = await db.pool.request().query('SELECT * FROM overview WHERE id=1');
    const row = r.recordset[0];
    if (row) return { ...row, metrics: P(row.metrics, []), series: P(row.series, []), seriesLabels: P(row.seriesLabels, []), aiInsight: P(row.aiInsight, {}), topCategory: P(row.topCategory, {}) };
  }
  return mem.overview;
}

async function listCustomers() {
  const users = useDb()
    ? (await db.pool.request().query("SELECT * FROM users WHERE role='user'")).recordset
    : mem.users.filter((u) => u.role === 'user');
  const bookings = await allBookings();
  return users.map((u, i) => {
    const mine = bookings.filter((b) => b.userId === u.id);
    const spend = mine.reduce((s, b) => s + (b.status === 'cancelled' ? 0 : b.amount), 0);
    return {
      name: u.name, location: u.id === 'u1' ? 'Andheri W, Mumbai' : u.id === 'u4' ? 'Bandra, Mumbai' : 'Pune',
      bookings: mine.length, spend: '₹' + spend.toLocaleString('en-IN'), tier: u.loyaltyTier || 'Bronze',
      lastActivity: ['10 min ago', '24 min ago', '2 hr ago'][i % 3],
      status: (u.loyaltyTier === 'Bronze' && mine.length <= 1) ? 'At risk' : 'Active',
    };
  });
}

async function listProviders() {
  const list = useDb() ? (await db.pool.request().query('SELECT * FROM providers')).recordset : mem.providers;
  return list.map((p) => ({ name: p.name, category: p.category, verification: p.verification || (p.verified ? 'Verified' : 'Pending'), rating: p.rating, jobs: p.jobsCompleted || 0, availability: p.availability || (p.available ? 'Available' : 'Unavailable'), status: p.status || 'Active' }));
}

async function listBookingsAdmin() {
  const all = await allBookings();
  const out = [];
  for (const b of all) {
    const e = await enrichBooking(b);
    const u = await findUserById(b.userId);
    out.push({ code: b.code, customer: b.customerName || (u ? u.name : '—'), service: b.serviceName, provider: b.partnerName || e.providerName, comments: b.comments || '', time: `${b.dateLabel} · ${b.timeLabel}`, amount: '₹' + b.amount, status: b.status });
  }
  return out;
}

async function listWalletAdmin() {
  const txns = useDb() ? (await db.pool.request().query('SELECT * FROM wallet_txns ORDER BY row DESC')).recordset : mem.walletTxns;
  const out = [];
  for (const t of txns.slice(0, 20)) {
    const u = await findUserById(t.userId);
    out.push({ id: t.id, customer: u ? u.name : '—', type: t.name, amount: '₹' + Math.abs(t.amount), date: t.date, reason: t.reason, status: t.status });
  }
  return out;
}

async function listAudit() {
  if (useDb()) {
    const r = await db.pool.request().query('SELECT TOP 50 * FROM audit ORDER BY row DESC');
    return r.recordset;
  }
  return mem.auditLog;
}

async function logAudit(entry) {
  const row = { at: nowLabel(), result: 'Success', ...entry };
  if (useDb()) {
    await db.pool.request().input('at', db.sql.NVarChar, row.at).input('user', db.sql.NVarChar, row.user)
      .input('role', db.sql.NVarChar, row.role).input('action', db.sql.NVarChar, row.action)
      .input('resource', db.sql.NVarChar, row.resource).input('result', db.sql.NVarChar, row.result)
      .query('INSERT INTO audit (at,[user],role,action,resource,result) VALUES (@at,@user,@role,@action,@resource,@result)');
  } else {
    mem.auditLog.unshift(row);
  }
  return row;
}

async function listTicketsAdmin() {
  if (useDb()) {
    const r = await db.pool.request().query('SELECT * FROM tickets ORDER BY row DESC');
    return r.recordset.map((t) => ({ ...t, messages: P(t.messages, []) }));
  }
  return mem.tickets;
}

async function replyTicket(id, { from, text }) {
  if (!text || !text.trim()) { const e = new Error('Reply cannot be empty.'); e.code = 400; throw e; }
  const all = await listTicketsAdmin();
  const t = all.find((x) => x.id === id);
  if (!t) { const e = new Error('Ticket not found.'); e.code = 404; throw e; }
  const msg = { from: from || 'agent', text: text.trim(), at: nowLabel() };
  t.messages = [...(t.messages || []), msg];
  t.updated = 'just now';
  if (useDb()) {
    await db.pool.request().input('id', db.sql.NVarChar, id).input('messages', db.sql.NVarChar, J(t.messages))
      .query("UPDATE tickets SET messages=@messages, updated='just now' WHERE id=@id");
  }
  return t;
}

async function listComplaints() {
  if (useDb()) {
    const r = await db.pool.request().query('SELECT * FROM complaints ORDER BY row DESC');
    return r.recordset;
  }
  return mem.complaints;
}

async function updateComplaint(id, patch, actor) {
  const all = await listComplaints();
  const c = all.find((x) => x.id === id);
  if (!c) { const e = new Error('Complaint not found.'); e.code = 404; throw e; }
  if (patch.status) c.status = patch.status;
  if (patch.assignee) c.assignee = patch.assignee;
  if (useDb()) {
    await db.pool.request().input('id', db.sql.NVarChar, id).input('status', db.sql.NVarChar, c.status)
      .query('UPDATE complaints SET status=@status WHERE id=@id');
  }
  await logAudit({ user: (actor && actor.userId) || 'ADMIN_02', role: 'Administrator', action: `Updated complaint ${id} → ${c.status}`, resource: id });
  return c;
}

async function getLoyaltyAdmin() {
  if (useDb()) {
    const r = await db.pool.request().query('SELECT * FROM loyalty_admin WHERE id=1');
    const row = r.recordset[0];
    if (row) return { ...row, totals: P(row.totals, []), tiers: P(row.tiers, []), campaign: P(row.campaign, {}) };
  }
  return mem.loyaltyAdmin;
}

async function listInsights() {
  if (useDb()) {
    const r = await db.pool.request().query('SELECT * FROM insights');
    return r.recordset;
  }
  return mem.insights;
}

async function listExports() {
  if (useDb()) {
    const r = await db.pool.request().query('SELECT * FROM exports ORDER BY row DESC');
    return r.recordset;
  }
  return mem.exportsLog;
}

async function createExport({ dataset, format, by }) {
  const row = { id: 'EXP-' + Math.floor(10400 + Math.random() * 400), by: by || 'Admin', records: String(800 + Math.floor(Math.random() * 4000)), format: format || 'Masked CSV', status: 'Completed' };
  if (useDb()) {
    await db.pool.request().input('id', db.sql.NVarChar, row.id).input('by', db.sql.NVarChar, row.by)
      .input('records', db.sql.NVarChar, row.records).input('format', db.sql.NVarChar, row.format)
      .query("INSERT INTO exports (id,by,records,format,status) VALUES (@id,@by,@records,@format,'Completed')");
  } else {
    mem.exportsLog.unshift(row);
  }
  await logAudit({ user: row.by, role: 'Administrator', action: `Exported ${dataset || 'records'}`, resource: row.id });
  return row;
}

async function adminCounts() {
  const tickets = await listTicketsAdmin();
  const complaints = await listComplaints();
  return {
    queries: tickets.filter((t) => t.status === 'In progress').length,
    complaints: complaints.filter((c) => c.status !== 'Resolved').length,
  };
}

module.exports = {
  publicUser, findUserByEmail, findUserById, createUser,
  listCategories, searchProviders, getProvider, listRecommendations,
  listBookings, getBooking, createBooking, cancelBooking,
  getWallet, topupWallet, getLoyalty, redeemReward, submitReview,
  listTickets, createTicket, customerCounts,
  providerIdFor, getDashboard, listRequests, getJob, setJobStatus,
  listServices, addService, updateService, removeService, getAvailability, updateAvailability,
  getEarnings, updateProfile, partnerCounts,
  getOverview, listCustomers, listProviders, listBookingsAdmin, listWalletAdmin,
  listAudit, listTicketsAdmin, replyTicket, listComplaints, updateComplaint,
  getLoyaltyAdmin, listInsights, listExports, createExport, adminCounts,
  updateOverdueBookings,
};
