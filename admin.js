/* ═══════════════════════════════════════════════════════════
   VIA ROMA — admin.js
   Admin panel logic for menu, news, settings management
   ═══════════════════════════════════════════════════════════ */
import {
  getMenuItems,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getViewCount,
  getContactInfo,
  updateContactInfo,
  getNews,
  addNews,
  deleteNews,
  getAdminPassword,
  updateAdminPassword,
} from './supabase.js';

/* ── STATE ─────────────────────────────────────────────────── */
let menuItems = [];
let filteredItems = [];
let currentFilter = 'all';
let searchQuery = '';
let editingId = null;
let currentSection = 'dashboard';
let currentNewsLang = 'bg';
let newsData = { bg: [], en: [] };
let settingsData = {};

/* ── DOM ELEMENTS ─────────────────────────────────────────── */
const tableBody = document.getElementById('menuTableBody');
const addItemBtn = document.getElementById('addItemBtn');
const itemModal = document.getElementById('itemModal');
const modalClose = document.getElementById('modalClose');
const modalCancel = document.getElementById('modalCancel');
const modalSave = document.getElementById('modalSave');
const modalTitle = document.getElementById('modalTitle');
const categoryFilter = document.getElementById('categoryFilter');
const searchInput = document.getElementById('searchInput');
const deleteModal = document.getElementById('deleteModal');
const deleteModalClose = document.getElementById('deleteModalClose');
const deleteCancel = document.getElementById('deleteCancel');
const deleteConfirm = document.getElementById('deleteConfirm');
const logoutBtn = document.getElementById('logoutBtn');

/* ── CATEGORY LABELS ───────────────────────────────────────── */
const CATEGORY_LABELS = {
  pizza: { bg: 'Пица', class: 'admin-badge--pizza' },
  pasta: { bg: 'Паста', class: 'admin-badge--pasta' },
  appetizer: { bg: 'Предястие', class: 'admin-badge--appetizer' },
  salad: { bg: 'Салата', class: 'admin-badge--salad' },
  dessert: { bg: 'Десерт', class: 'admin-badge--dessert' },
  drink: { bg: 'Напитка', class: 'admin-badge--drink' },
};

/* ── TOAST ────────────────────────────────────────────────── */
let _toastTimer;
function showToast(msg, type = 'success') {
  const el = document.getElementById('toastEl');
  if (!el) return;
  const icons = {
    success: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    error: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  };
  el.className = `toast ${type}`;
  el.innerHTML = `<div class="toast__bar"></div><div class="toast__inner"><div class="toast__icon-wrap">${icons[type]||icons.success}</div><div class="toast__body"><div class="toast__title">${esc(msg)}</div></div></div>`;
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}

/* ── HELPERS ───────────────────────────────────────────────── */
function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatPrice(price) {
  const n = parseFloat(price);
  if (isNaN(n)) return '—';
  return `€${Number.isInteger(n) ? n : n.toFixed(2)}`;
}

function formatViews(n) {
  return Number(n||0).toLocaleString('bg-BG');
}

/* ── AUTH CHECK ────────────────────────────────────────────── */
function checkAuth() {
  const ok = sessionStorage.getItem('vr_admin_ok');
  if (!ok) {
    window.location.href = '/#admin';
    return false;
  }
  return true;
}

/* ══════════════════════════════════════════════════════════════
   SECTION NAVIGATION
   ═══════════════════════════════════════════════════════════ */
function switchSection(section) {
  currentSection = section;

  // Update nav links
  document.querySelectorAll('.admin-nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.section === section);
  });

  // Update section visibility
  document.querySelectorAll('.admin-section').forEach(sec => {
    sec.classList.toggle('active', sec.id === `section-${section}`);
  });

  // Load section-specific data
  if (section === 'dashboard') {
    loadDashboardData();
  } else if (section === 'menu') {
    // Already loaded
  } else if (section === 'news') {
    loadNewsData();
  } else if (section === 'settings') {
    loadSettingsData();
  }
}

// Nav link click handlers
document.querySelectorAll('.admin-nav-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    switchSection(link.dataset.section);
  });
});

// Quick action handlers
document.querySelectorAll('.admin-quick-action').forEach(action => {
  action.addEventListener('click', () => {
    const act = action.dataset.action;
    if (act === 'add-item') {
      switchSection('menu');
      setTimeout(() => openModal(), 100);
    } else if (act === 'view-site') {
      window.open('/', '_blank');
    } else if (act === 'settings') {
      switchSection('settings');
    }
  });
});

/* ══════════════════════════════════════════════════════════════
   DASHBOARD SECTION
   ═══════════════════════════════════════════════════════════ */
async function loadDashboardData() {
  const stats = await getViewCount();

  document.getElementById('totalItemsDashboard').textContent = menuItems.length;
  document.getElementById('featuredItemsDashboard').textContent = menuItems.filter(i => i.featured).length;
  document.getElementById('totalViewsDashboard').textContent = formatViews(stats);
  document.getElementById('todayViewsDashboard').textContent = '—';

  // Recent items
  const recentContainer = document.getElementById('recentItems');
  const recent = menuItems.slice(-5).reverse();

  if (recent.length === 0) {
    recentContainer.innerHTML = `
      <div class="admin-empty" style="padding: 2rem;">
        <p class="admin-empty-text">Няма добавени ястия</p>
      </div>
    `;
    return;
  }

  recentContainer.innerHTML = recent.map(item => `
    <div class="admin-recent-item">
      <img class="admin-recent-img" src="${esc(item.image || '/logo.png')}" alt="${esc(item.name||item.nameBg)}" onerror="this.src='/logo.png'">
      <span class="admin-recent-name">${esc(item.name || item.nameBg || 'Без име')}</span>
      <span class="admin-badge">${esc(CATEGORY_LABELS[item.category]?.bg || item.category)}</span>
      <span class="admin-price">${formatPrice(item.price)}</span>
    </div>
  `).join('');
}

/* ══════════════════════════════════════════════════════════════
   MENU SECTION
   ═══════════════════════════════════════════════════════════ */
async function loadMenuData() {
  try {
    showSkeleton();

    const [items, stats] = await Promise.all([
      getMenuItems(),
      getViewCount(),
    ]);

    menuItems = items;
    filteredItems = [...menuItems];

    applyFilters();
    updateStats(stats);
    renderTable();

  } catch (err) {
    console.error('[Admin] Load error:', err);
    showToast('Грешка при зареждане на данните', 'error');
  }
}

function showSkeleton() {
  if (!tableBody) return;
  let html = '';
  for (let i = 0; i < 5; i++) {
    html += `
      <tr>
        <td><div class="admin-skeleton" style="height: 52px; width: 220px;"></div></td>
        <td><div class="admin-skeleton" style="height: 24px; width: 80px;"></div></td>
        <td><div class="admin-skeleton" style="height: 24px; width: 60px;"></div></td>
        <td><div class="admin-skeleton" style="height: 24px; width: 70px;"></div></td>
        <td><div class="admin-skeleton" style="height: 32px; width: 75px;"></div></td>
      </tr>
    `;
  }
  tableBody.innerHTML = html;
}

function updateStats(views) {
  const totalItems = document.getElementById('totalItems');
  const featuredItems = document.getElementById('featuredItems');
  const totalViews = document.getElementById('totalViews');
  const todayViews = document.getElementById('todayViews');

  if (totalItems) totalItems.textContent = menuItems.length;
  if (featuredItems) featuredItems.textContent = menuItems.filter(i => i.featured).length;
  if (totalViews) totalViews.textContent = formatViews(views);
  if (todayViews) todayViews.textContent = '—';
}

/* ── FILTERS ───────────────────────────────────────────────── */
function applyFilters() {
  filteredItems = menuItems.filter(item => {
    const matchesCat = currentFilter === 'all' || item.category === currentFilter;
    const matchesSearch = !searchQuery ||
      (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.nameBg || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });
}

/* ── RENDER TABLE ──────────────────────────────────────────── */
function renderTable() {
  if (!tableBody) return;

  if (!filteredItems.length) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5">
          <div class="admin-empty">
            <svg class="admin-empty-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3"><path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/><line x1="6" y1="17" x2="18" y2="17"/><line x1="6" y1="13" x2="18" y2="13"/></svg>
            <p class="admin-empty-text">Няма намерени ястия</p>
            <button class="btn-solid" onclick="document.getElementById('addItemBtn').click()">Добави първото ястие</button>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = filteredItems.map(item => {
    const cat = CATEGORY_LABELS[item.category] || { bg: item.category, class: '' };
    const imgSrc = item.image || '/logo.png';
    return `
      <tr>
        <td>
          <div class="admin-item-row">
            <img class="admin-item-img" src="${esc(imgSrc)}" alt="${esc(item.name||item.nameBg)}" onerror="this.src='/logo.png'">
            <div>
              <div class="admin-item-name">${esc(item.name || item.nameBg || 'Без име')}</div>
              <div class="admin-item-name-bg">${esc(item.nameBg || item.name || '')}</div>
            </div>
          </div>
        </td>
        <td>
          <span class="admin-badge ${cat.class}">${esc(cat.bg)}</span>
        </td>
        <td>
          <span class="admin-price">${formatPrice(item.price)}</span>
        </td>
        <td>
          <button class="admin-featured-toggle ${item.featured ? 'active' : ''}" data-action="toggle-featured" data-id="${item.id}" title="${item.featured ? 'Премахни от избрани' : 'Добави в избрани'}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="${item.featured ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </button>
        </td>
        <td>
          <div class="admin-actions-row">
            <button class="admin-btn-icon" title="Редактирай" data-action="edit" data-id="${item.id}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="admin-btn-icon admin-btn-icon--danger" title="Изтрий" data-action="delete" data-id="${item.id}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Attach action handlers
  tableBody.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', handleAction);
  });
}

/* ── MODAL HANDLERS ────────────────────────────────────────── */
function openModal(editItem = null) {
  editingId = editItem ? editItem.id : null;
  modalTitle.textContent = editItem ? 'Редактирай ястие' : 'Добави ястие';

  // Reset form
  document.getElementById('itemId').value = editItem ? editItem.id : '';
  document.getElementById('itemName').value = editItem ? (editItem.name || '') : '';
  document.getElementById('itemNameBg').value = editItem ? (editItem.nameBg || '') : '';
  document.getElementById('itemDesc').value = editItem ? (editItem.description || '') : '';
  document.getElementById('itemDescBg').value = editItem ? (editItem.descBg || '') : '';
  document.getElementById('itemCategory').value = editItem ? (editItem.category || 'pizza') : 'pizza';
  document.getElementById('itemPrice').value = editItem ? editItem.price : '';
  document.getElementById('itemImage').value = editItem ? (editItem.image || '') : '';
  document.getElementById('itemFeatured').checked = editItem ? !!editItem.featured : false;

  // Image preview
  const preview = document.getElementById('imagePreview');
  const cardPreview = document.getElementById('previewImg');
  if (editItem?.image) {
    preview.src = editItem.image;
    preview.classList.add('show');
    cardPreview.src = editItem.image;
  } else {
    preview.classList.remove('show');
    cardPreview.src = '/logo.png';
  }

  // Update live preview
  updateLivePreview();

  itemModal.classList.add('show');
  document.getElementById('itemName').focus();
}

function closeModal() {
  itemModal.classList.remove('show');
  editingId = null;
}

function handleAction(e) {
  const action = e.currentTarget.dataset.action;
  const id = parseInt(e.currentTarget.dataset.id);

  if (action === 'edit') {
    const item = menuItems.find(i => i.id === id);
    if (item) openModal(item);
  } else if (action === 'delete') {
    const item = menuItems.find(i => i.id === id);
    if (item) openDeleteModal(item);
  } else if (action === 'toggle-featured') {
    toggleFeatured(id);
  }
}

/* ── TOGGLE FEATURED ──────────────────────────────────────── */
async function toggleFeatured(id) {
  const item = menuItems.find(i => i.id === id);
  if (!item) return;

  try {
    await updateMenuItem(id, {
      ...item,
      featured: !item.featured,
    });

    showToast(item.featured ? 'Премахнато от избрани' : 'Добавено в избрани');
    await loadMenuData();
    loadDashboardData();

  } catch (err) {
    console.error('[Admin] Toggle featured error:', err);
    showToast('Грешка при промяна', 'error');
  }
}

/* ── LIVE PREVIEW ─────────────────────────────────────────── */
function updateLivePreview() {
  const name = document.getElementById('itemNameBg')?.value || document.getElementById('itemName')?.value || 'Име на ястието';
  const desc = document.getElementById('itemDescBg')?.value || document.getElementById('itemDesc')?.value || 'Описание на ястието...';
  const price = parseFloat(document.getElementById('itemPrice')?.value) || 0;
  const image = document.getElementById('itemImage')?.value || '/logo.png';

  document.getElementById('previewName').textContent = name || 'Име на ястието';
  document.getElementById('previewDesc').textContent = desc || 'Описание на ястието...';
  document.getElementById('previewPrice').textContent = formatPrice(price);
  document.getElementById('previewImg').src = image;
}

// Live preview input listeners
['itemName', 'itemNameBg', 'itemDesc', 'itemDescBg', 'itemPrice', 'itemImage'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', updateLivePreview);
});

/* ── SAVE ITEM ─────────────────────────────────────────────── */
async function saveItem() {
  const name = document.getElementById('itemName').value.trim();
  const nameBg = document.getElementById('itemNameBg').value.trim();
  const description = document.getElementById('itemDesc').value.trim();
  const descBg = document.getElementById('itemDescBg').value.trim();
  const category = document.getElementById('itemCategory').value;
  const price = parseFloat(document.getElementById('itemPrice').value) || 0;
  const image = document.getElementById('itemImage').value.trim();
  const featured = document.getElementById('itemFeatured').checked;

  if (!name && !nameBg) {
    showToast('Моля, въведете име на ястието', 'error');
    return;
  }

  try {
    modalSave.disabled = true;
    modalSave.textContent = 'Запазване...';

    const data = {
      name,
      nameBg,
      description,
      descBg,
      category,
      price,
      image,
      featured,
    };

    if (editingId) {
      await updateMenuItem(editingId, data);
      showToast('Ястието е обновено успешно');
    } else {
      await addMenuItem(data);
      showToast('Ястието е добавено успешно');
    }

    closeModal();
    await loadMenuData();
    loadDashboardData();

  } catch (err) {
    console.error('[Admin] Save error:', err);
    showToast('Грешка при запазване', 'error');
  } finally {
    modalSave.disabled = false;
    modalSave.textContent = 'Запази';
  }
}

/* ── DELETE MODAL ──────────────────────────────────────────── */
function openDeleteModal(item) {
  document.getElementById('deleteItemId').value = item.id;
  document.getElementById('deleteItemName').textContent = item.name || item.nameBg || 'Без име';
  deleteModal.classList.add('show');
}

function closeDeleteModal() {
  deleteModal.classList.remove('show');
}

async function confirmDelete() {
  const id = parseInt(document.getElementById('deleteItemId').value);

  try {
    deleteConfirm.disabled = true;
    deleteConfirm.textContent = 'Изтриване...';

    await deleteMenuItem(id);
    showToast('Ястието е изтрито успешно');
    closeDeleteModal();
    await loadMenuData();
    loadDashboardData();

  } catch (err) {
    console.error('[Admin] Delete error:', err);
    showToast('Грешка при изтриване', 'error');
  } finally {
    deleteConfirm.disabled = false;
    deleteConfirm.textContent = 'Изтрий';
  }
}

/* ── IMAGE PREVIEW ─────────────────────────────────────────── */
document.getElementById('itemImage')?.addEventListener('input', (e) => {
  const preview = document.getElementById('imagePreview');
  const url = e.target.value.trim();
  if (url) {
    preview.src = url;
    preview.classList.add('show');
    preview.onerror = () => preview.classList.remove('show');
  } else {
    preview.classList.remove('show');
  }
});

/* ══════════════════════════════════════════════════════════════
   NEWS SECTION
   ═══════════════════════════════════════════════════════════ */
async function loadNewsData() {
  try {
    newsData = await getNews();
    renderNewsList();
  } catch (err) {
    console.error('[Admin] News load error:', err);
  }
}

function renderNewsList() {
  const container = document.getElementById('newsList');
  const items = newsData[currentNewsLang] || [];

  if (items.length === 0) {
    container.innerHTML = `
      <div class="admin-empty" style="padding: 3rem 2rem;">
        <svg class="admin-empty-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        <p class="admin-empty-text">Няма новини на ${currentNewsLang === 'bg' ? 'български' : 'английски'}</p>
        <button class="btn-solid" id="addNewsEmptyBtn">Добави първата новина</button>
      </div>
    `;
    document.getElementById('addNewsEmptyBtn')?.addEventListener('click', () => openNewsModal());
    return;
  }

  container.innerHTML = items.map(item => `
    <div class="admin-news-item">
      <div class="admin-news-text">${esc(item.text)}</div>
      <div class="admin-actions-row">
        <button class="admin-btn-icon admin-btn-icon--danger" title="Изтрий" data-action="delete-news" data-id="${item.id}" data-lang="${currentNewsLang}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('[data-action="delete-news"]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('deleteNewsId').value = btn.dataset.id;
      document.getElementById('deleteNewsModal').classList.add('show');
    });
  });
}

// News language tabs
document.querySelectorAll('.admin-news-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.admin-news-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentNewsLang = tab.dataset.lang;
    renderNewsList();
  });
});

// Add news button
document.getElementById('addNewsBtn')?.addEventListener('click', () => openNewsModal());

function openNewsModal() {
  document.getElementById('newsId').value = '';
  document.getElementById('newsLang').value = currentNewsLang;
  document.getElementById('newsText').value = '';
  document.getElementById('newsModalTitle').textContent = 'Добави новина';
  document.getElementById('newsModal').classList.add('show');
}

function closeNewsModal() {
  document.getElementById('newsModal').classList.remove('show');
}

async function saveNews() {
  const text = document.getElementById('newsText').value.trim();
  const lang = document.getElementById('newsLang').value;

  if (!text) {
    showToast('Моля, въведете текст на новината', 'error');
    return;
  }

  try {
    document.getElementById('newsModalSave').disabled = true;
    document.getElementById('newsModalSave').textContent = 'Запазване...';

    await addNews(text, lang);
    showToast('Новината е добавена успешно');
    closeNewsModal();
    await loadNewsData();

  } catch (err) {
    console.error('[Admin] News save error:', err);
    showToast('Грешка при запазване', 'error');
  } finally {
    document.getElementById('newsModalSave').disabled = false;
    document.getElementById('newsModalSave').textContent = 'Запази';
  }
}

async function confirmDeleteNews() {
  const id = parseInt(document.getElementById('deleteNewsId').value);

  try {
    document.getElementById('deleteNewsConfirm').disabled = true;
    document.getElementById('deleteNewsConfirm').textContent = 'Изтриване...';

    await deleteNews(id);
    showToast('Новината е изтрита успешно');
    document.getElementById('deleteNewsModal').classList.remove('show');
    await loadNewsData();

  } catch (err) {
    console.error('[Admin] News delete error:', err);
    showToast('Грешка при изтриване', 'error');
  } finally {
    document.getElementById('deleteNewsConfirm').disabled = false;
    document.getElementById('deleteNewsConfirm').textContent = 'Изтрий';
  }
}

// News modal event listeners
document.getElementById('newsModalClose')?.addEventListener('click', closeNewsModal);
document.getElementById('newsModalCancel')?.addEventListener('click', closeNewsModal);
document.getElementById('newsModalSave')?.addEventListener('click', saveNews);
document.getElementById('newsModal')?.addEventListener('click', (e) => {
  if (e.target === document.getElementById('newsModal')) closeNewsModal();
});

document.getElementById('deleteNewsModalClose')?.addEventListener('click', () => {
  document.getElementById('deleteNewsModal').classList.remove('show');
});
document.getElementById('deleteNewsCancel')?.addEventListener('click', () => {
  document.getElementById('deleteNewsModal').classList.remove('show');
});
document.getElementById('deleteNewsConfirm')?.addEventListener('click', confirmDeleteNews);

/* ══════════════════════════════════════════════════════════════
   SETTINGS SECTION
   ═══════════════════════════════════════════════════════════ */
async function loadSettingsData() {
  try {
    settingsData = await getContactInfo() || {};

    document.getElementById('settingsPhone').value = settingsData.phone || '';
    document.getElementById('settingsAddressBg').value = settingsData.addressBg || '';
    document.getElementById('settingsAddressEn').value = settingsData.addressEn || '';
    document.getElementById('settingsHoursBg').value = settingsData.hoursBg || '';
    document.getElementById('settingsHoursEn').value = settingsData.hoursEn || '';
    document.getElementById('settingsInstagram').value = settingsData.instagram || '';
    document.getElementById('settingsFacebook').value = settingsData.facebook || '';
    document.getElementById('settingsTripAdvisor').value = settingsData.tripAdvisor || '';
    document.getElementById('settingsYouTube').value = settingsData.youTube || '';
    document.getElementById('settingsAboutBg').value = settingsData.aboutBg || '';
    document.getElementById('settingsAboutEn').value = settingsData.aboutEn || '';
    document.getElementById('settingsCopyright').value = settingsData.copyright || '';

  } catch (err) {
    console.error('[Admin] Settings load error:', err);
  }
}

async function saveSettings() {
  try {
    document.getElementById('saveSettingsBtn').disabled = true;
    document.getElementById('saveSettingsBtn').textContent = 'Запазване...';

    const data = {
      phone: document.getElementById('settingsPhone').value.trim(),
      addressBg: document.getElementById('settingsAddressBg').value.trim(),
      addressEn: document.getElementById('settingsAddressEn').value.trim(),
      hoursBg: document.getElementById('settingsHoursBg').value.trim(),
      hoursEn: document.getElementById('settingsHoursEn').value.trim(),
      instagram: document.getElementById('settingsInstagram').value.trim(),
      facebook: document.getElementById('settingsFacebook').value.trim(),
      tripAdvisor: document.getElementById('settingsTripAdvisor').value.trim(),
      youTube: document.getElementById('settingsYouTube').value.trim(),
      aboutBg: document.getElementById('settingsAboutBg').value.trim(),
      aboutEn: document.getElementById('settingsAboutEn').value.trim(),
      copyright: document.getElementById('settingsCopyright').value.trim(),
    };

    await updateContactInfo(data);
    showToast('Настройките са запазени успешно');

  } catch (err) {
    console.error('[Admin] Settings save error:', err);
    showToast('Грешка при запазване', 'error');
  } finally {
    document.getElementById('saveSettingsBtn').disabled = false;
    document.getElementById('saveSettingsBtn').textContent = 'Запази';
  }
}

document.getElementById('saveSettingsBtn')?.addEventListener('click', saveSettings);

/* ══════════════════════════════════════════════════════════════
   PASSWORD SECTION
   ═══════════════════════════════════════════════════════════ */
const newPasswordInput = document.getElementById('newPassword');
const passwordStrengthBars = document.querySelectorAll('#passwordStrength .admin-password-bar');

function checkPasswordStrength(password) {
  let strength = 0;
  if (password.length >= 6) strength++;
  if (password.length >= 10) strength++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++;
  if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) strength++;
  return strength;
}

newPasswordInput?.addEventListener('input', (e) => {
  const strength = checkPasswordStrength(e.target.value);
  passwordStrengthBars.forEach((bar, i) => {
    bar.className = 'admin-password-bar';
    if (i < strength) {
      bar.classList.add(strength <= 1 ? 'weak' : strength <= 2 ? 'medium' : 'strong');
    }
  });
});

async function changePassword() {
  const current = document.getElementById('currentPassword').value;
  const newPass = document.getElementById('newPassword').value;
  const confirm = document.getElementById('confirmPassword').value;

  if (!current || !newPass || !confirm) {
    showToast('Моля, попълнете всички полета', 'error');
    return;
  }

  if (newPass !== confirm) {
    showToast('Новата парола и потвърждението не съвпадат', 'error');
    return;
  }

  if (checkPasswordStrength(newPass) < 2) {
    showToast('Паролата е твърде слаба', 'error');
    return;
  }

  try {
    document.getElementById('changePasswordBtn').disabled = true;
    document.getElementById('changePasswordBtn').textContent = 'Променяне...';

    const savedPassword = await getAdminPassword();
    if (current !== savedPassword) {
      showToast('Грешна текуща парола', 'error');
      return;
    }

    await updateAdminPassword(newPass);
    showToast('Паролата е променена успешно');
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    passwordStrengthBars.forEach(bar => bar.className = 'admin-password-bar');

  } catch (err) {
    console.error('[Admin] Password change error:', err);
    showToast('Грешка при промяна на паролата', 'error');
  } finally {
    document.getElementById('changePasswordBtn').disabled = false;
    document.getElementById('changePasswordBtn').textContent = 'Промени паролата';
  }
}

document.getElementById('changePasswordBtn')?.addEventListener('click', changePassword);

/* ══════════════════════════════════════════════════════════════
   EVENT LISTENERS
   ═══════════════════════════════════════════════════════════ */
addItemBtn?.addEventListener('click', () => openModal());
modalClose?.addEventListener('click', closeModal);
modalCancel?.addEventListener('click', closeModal);
modalSave?.addEventListener('click', saveItem);
itemModal?.addEventListener('click', (e) => {
  if (e.target === itemModal) closeModal();
});

deleteModalClose?.addEventListener('click', closeDeleteModal);
deleteCancel?.addEventListener('click', closeDeleteModal);
deleteConfirm?.addEventListener('click', confirmDelete);
deleteModal?.addEventListener('click', (e) => {
  if (e.target === deleteModal) closeDeleteModal();
});

categoryFilter?.addEventListener('change', (e) => {
  currentFilter = e.target.value;
  applyFilters();
  renderTable();
});

searchInput?.addEventListener('input', (e) => {
  searchQuery = e.target.value.trim();
  applyFilters();
  renderTable();
});

logoutBtn?.addEventListener('click', () => {
  sessionStorage.removeItem('vr_admin_ok');
  window.location.href = '/';
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
    closeDeleteModal();
    closeNewsModal();
    document.getElementById('deleteNewsModal')?.classList.remove('show');
  }
});

/* ══════════════════════════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════════════════════ */
if (checkAuth()) {
  loadMenuData().then(() => {
    loadDashboardData();
  });
}
