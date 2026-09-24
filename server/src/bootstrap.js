const db = require('./db');
const seed = require('./seed');

const request = () => db.pool.request();
const J = (value) => JSON.stringify(value ?? null);
const accountPassword = (value) => {
  const salt = `s2d-${value.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 18)}`;
  return { passwordHash: require('./auth').hashPassword(value, salt), salt };
};

async function insertUser(user) {
  await request()
    .input('id', db.sql.NVarChar, user.id).input('name', db.sql.NVarChar, user.name)
    .input('email', db.sql.NVarChar, user.email).input('mobile', db.sql.NVarChar, user.mobile)
    .input('role', db.sql.NVarChar, user.role).input('passwordHash', db.sql.NVarChar, user.passwordHash)
    .input('salt', db.sql.NVarChar, user.salt).input('memberSince', db.sql.NVarChar, user.memberSince)
    .query("IF NOT EXISTS (SELECT 1 FROM users WHERE id=@id) INSERT INTO users (id,name,email,mobile,role,passwordHash,salt,memberSince,walletBalance,walletPromo,walletRefund,walletSaved,loyaltyTier,loyaltyPoints,providerId) VALUES (@id,@name,@email,@mobile,@role,@passwordHash,@salt,@memberSince,0,0,0,0,'Bronze',0,NULL)");
}

async function insertProvider(provider) {
  await request()
    .input('id', db.sql.NVarChar, provider.id).input('name', db.sql.NVarChar, provider.name)
    .input('category', db.sql.NVarChar, provider.category).input('categoryKey', db.sql.NVarChar, provider.categoryKey)
    .input('exp', db.sql.NVarChar, provider.exp).input('expYears', db.sql.Int, provider.expYears)
    .input('rating', db.sql.Float, provider.rating).input('reviewsCount', db.sql.Int, provider.reviewsCount)
    .input('responseMin', db.sql.Int, provider.responseMin).input('distanceKm', db.sql.Float, provider.distanceKm)
    .input('priceFrom', db.sql.Int, provider.priceFrom).input('priceUnit', db.sql.NVarChar, provider.priceUnit)
    .input('tags', db.sql.NVarChar, J(provider.tags)).input('initials', db.sql.NVarChar, provider.initials)
    .input('verified', db.sql.Bit, provider.verified ? 1 : 0).input('available', db.sql.Bit, provider.available ? 1 : 0)
    .input('area', db.sql.NVarChar, provider.area).input('about', db.sql.NVarChar, provider.about)
    .input('trust', db.sql.NVarChar, J(provider.trust)).input('slots', db.sql.NVarChar, J(provider.slots))
    .query("IF NOT EXISTS (SELECT 1 FROM providers WHERE id=@id) INSERT INTO providers (id,name,category,categoryKey,exp,expYears,rating,reviewsCount,responseMin,distanceKm,priceFrom,priceUnit,tags,initials,verified,available,area,about,trust,slots,verification,status,availability,jobsCompleted) VALUES (@id,@name,@category,@categoryKey,@exp,@expYears,@rating,@reviewsCount,@responseMin,@distanceKm,@priceFrom,@priceUnit,@tags,@initials,@verified,@available,@area,@about,@trust,@slots,'Pending','Active','Available',0)");
}

async function run() {
  await db.connect();
  if (!db.isConnected()) throw new Error('RDS connection is required to bootstrap accounts.');
  await request().query("IF COL_LENGTH('bookings', 'customerName') IS NULL ALTER TABLE bookings ADD customerName NVARCHAR(120) NOT NULL CONSTRAINT DF_bookings_customerName DEFAULT '' WITH VALUES");
  await request().query("IF COL_LENGTH('bookings', 'partnerName') IS NULL ALTER TABLE bookings ADD partnerName NVARCHAR(160) NOT NULL CONSTRAINT DF_bookings_partnerName DEFAULT '' WITH VALUES");
  await request().query("IF COL_LENGTH('bookings', 'comments') IS NULL ALTER TABLE bookings ADD comments NVARCHAR(500) NOT NULL CONSTRAINT DF_bookings_comments DEFAULT '' WITH VALUES");
  if (process.env.RESET_DATA === 'true') {
    for (const table of ['audit', 'exports', 'insights', 'loyalty_admin', 'overview', 'earnings', 'availability', 'jobs', 'complaints', 'tickets', 'recommendations', 'loyalty_activity', 'wallet_txns', 'reviews', 'bookings', 'services', 'providers', 'categories', 'users']) {
      await request().query(`DELETE FROM [${table}]`);
    }
    console.log('[seed] Existing application data cleared.');
  }
  for (const category of seed.categories) {
    await request().input('key', db.sql.NVarChar, category.key).input('label', db.sql.NVarChar, category.label)
      .input('icon', db.sql.NVarChar, category.icon).input('tone', db.sql.NVarChar, category.tone).input('sort', db.sql.Int, category.sort)
      .query("IF NOT EXISTS (SELECT 1 FROM categories WHERE [key]=@key) INSERT INTO categories ([key],label,icon,tone,sort) VALUES (@key,@label,@icon,@tone,@sort)");
  }
  for (const user of seed.users) await insertUser(user);
  for (const [index, account] of seed.accounts.partners.entries()) {
    const providerId = `provider-${index + 1}`;
    const credentials = accountPassword(account.password);
    await insertUser({ id: `partner-${index + 1}`, name: account.name, email: account.email, mobile: '', role: 'partner', ...credentials, memberSince: 'September 2026' });
    await request().input('id', db.sql.NVarChar, `partner-${index + 1}`).input('providerId', db.sql.NVarChar, providerId).query('UPDATE users SET providerId=@providerId WHERE id=@id');
  }
  for (const provider of seed.providers) await insertProvider(provider);
  for (const service of seed.services) {
    await request().input('id', db.sql.NVarChar, service.id).input('providerId', db.sql.NVarChar, service.providerId)
      .input('name', db.sql.NVarChar, service.name).input('detail', db.sql.NVarChar, service.detail)
      .input('price', db.sql.Int, service.price).input('durationMin', db.sql.Int, service.durationMin)
      .query("IF NOT EXISTS (SELECT 1 FROM services WHERE id=@id) INSERT INTO services (id,providerId,name,detail,price,durationMin,active) VALUES (@id,@providerId,@name,@detail,@price,@durationMin,1)");
  }
  for (const provider of seed.providers) {
    const av = seed.availability[provider.id];
    await request().input('providerId', db.sql.NVarChar, provider.id).input('open', db.sql.Bit, 1).input('note', db.sql.NVarChar, av.note).input('schedule', db.sql.NVarChar, J(av.schedule))
      .query("IF NOT EXISTS (SELECT 1 FROM availability WHERE providerId=@providerId) INSERT INTO availability (providerId,[open],note,schedule) VALUES (@providerId,@open,@note,@schedule)");
  }
  console.log(`[seed] RDS bootstrap complete: ${seed.providers.length} partners, ${seed.services.length} services, 1 admin, 1 user.`);
  await db.pool.close();
}

run().catch((error) => { console.error('[seed] Bootstrap failed:', error.message); process.exitCode = 1; });
