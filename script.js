const roleButtons = document.querySelectorAll('.role');
const views = document.querySelectorAll('.view');
const nav = document.getElementById('main-nav');
const navMap = {
  customer: ['◈|Discover', '⌕|Browse services', '▣|My bookings|2', '◇|Wallet', '♧|Saved'],
  partner: ['◈|Home', '▣|Jobs|4', '□|Calendar', '₹|Earnings', '♙|Profile'],
  admin: ['◈|Overview', '♙|Customers', '♜|Providers', '▣|Bookings', '◌|Queries|8', '⚑|Complaints|3', '✦|AI insights']
};

function setRole(role) {
  roleButtons.forEach(button => button.classList.toggle('active', button.dataset.role === role));
  views.forEach(view => view.classList.toggle('active', view.id === `${role}-view`));
  nav.innerHTML = navMap[role].map((item, index) => {
    const [icon, label, badge] = item.split('|');
    return `<button class="nav-item ${index === 0 ? 'active' : ''}"><span>${icon}</span> ${label}${badge ? `<b>${badge}</b>` : ''}</button>`;
  }).join('');
}
roleButtons.forEach(button => button.addEventListener('click', () => setRole(button.dataset.role)));

document.addEventListener('click', event => {
  const book = event.target.closest('.book-button, .smart-content .primary-button');
  if (book) {
    const toast = document.getElementById('toast');
    toast.textContent = book.classList.contains('book-button') ? 'Booking flow ready to continue' : 'Showing AC technicians near you';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2600);
  }
  const category = event.target.closest('.category');
  if (category) document.querySelectorAll('.category').forEach(el => el.classList.toggle('selected', el === category));
  const favorite = event.target.closest('.heart');
  if (favorite) { favorite.textContent = favorite.textContent === '♡' ? '♥' : '♡'; favorite.style.color = favorite.textContent === '♥' ? '#e45f77' : '#3c4960'; }
});

document.getElementById('service-search').addEventListener('keydown', event => {
  if (event.key === 'Enter' && event.target.value.trim()) {
    document.getElementById('toast').textContent = `Searching for “${event.target.value.trim()}”`;
    document.getElementById('toast').classList.add('show');
    setTimeout(() => document.getElementById('toast').classList.remove('show'), 2600);
  }
});
