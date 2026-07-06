/* ═══════════════════════════════════════════════════════════
   VIA ROMA — script.js  (v5 — Supabase)
   UI logic only. All DB calls go through supabase.js.
   ═══════════════════════════════════════════════════════════ */
import { getMenuItems, getContactInfo, getNews, incrementViewCount, getAdminPassword, _db } from './supabase.js';

/* ── TRANSLATIONS ─────────────────────────────────────────── */
const T = {
  bg: {
    'news.badge':'НОВИНИ','nav.home':'Начало','nav.menu':'Меню','nav.contact':'Контакти',
    'hero.headline':'Изкуството на','hero.headline2':'Италианската Кухня',
    'hero.sub':'Автентични рецепти, премиум съставки, незабравими вкусове.',
    'hero.cta':'Вижте Менюто','about.label':'За нас','about.heading':'За Via Roma',
    'about.text':'Намерен в сърцето на София, Via Roma донася автентичните вкусове на Италия на вашата маса. Всяко ястие е приготвено с любов.',
    'about.sub':'Основан 1998 · Истинска италианска кухня · Sofia, Bulgaria',
    'about.feat1':'Традиционни рецепти','about.feat1sub':'Предадени от поколения',
    'about.feat2':'Свежи съставки','about.feat2sub':'Внос от Италия всяка седмица',
    'about.feat3':'Пещ на дърва','about.feat3sub':'Автентична италианска технология',
    'featured.label':'Избор на готвача','featured.heading':'Избрани Ястия',
    'menu.label':'Меню','menu.heading':'Нашето Меню','menu.all':'Всички',
    'menu.empty':'Няма ястия в тази категория.',
    'contact.label':'Контакти','contact.heading':'Свържете се с нас',
    'contact.phoneLabel':'Резервации','contact.hours':'Работно Време',
    'contact.hoursVal':'Вт – Нд: 12:00 – 22:30','contact.address':'Адрес',
    'contact.followUs':'Следвайте ни','footer.nav':'Навигация',
    'admin.title':'Admin Достъп','admin.sub':'Въведете паролата за продължение',
    'admin.placeholder':'Парола','admin.enter':'Влез','admin.cancel':'Откажи',
    'admin.error':'Грешна парола. Опитайте отново.',
  },
  en: {
    'news.badge':'NEWS','nav.home':'Home','nav.menu':'Menu','nav.contact':'Contact',
    'hero.headline':'The Art of','hero.headline2':'Italian Cuisine',
    'hero.sub':'Authentic recipes, premium ingredients, unforgettable flavors.',
    'hero.cta':'View Menu','about.label':'About','about.heading':'About Via Roma',
    'about.text':'Located in the heart of Sofia, Via Roma brings the authentic flavors of Italy to your table. Every dish is crafted with passion.',
    'about.sub':'Est. 1998 · Authentic Italian Cuisine · Sofia, Bulgaria',
    'about.feat1':'Traditional Recipes','about.feat1sub':'Passed down through generations',
    'about.feat2':'Fresh Ingredients','about.feat2sub':'Imported from Italy every week',
    'about.feat3':'Wood-Fired Oven','about.feat3sub':'Authentic Italian technique',
    'featured.label':"Chef's Selection",'featured.heading':'Featured Dishes',
    'menu.label':'Menu','menu.heading':'Our Menu','menu.all':'All',
    'menu.empty':'No items in this category.',
    'contact.label':'Contact','contact.heading':'Get In Touch',
    'contact.phoneLabel':'Reservations','contact.hours':'Opening Hours',
    'contact.hoursVal':'Tue – Sun: 12:00 – 22:30','contact.address':'Address',
    'contact.followUs':'Follow Us','footer.nav':'Navigation',
    'admin.title':'Admin Access','admin.sub':'Enter your password to continue',
    'admin.placeholder':'Password','admin.enter':'Enter','admin.cancel':'Cancel',
    'admin.error':'Incorrect password. Try again.',
  }
};

const PAGE_TITLES = {
  bg:'Via Roma — Автентична Италианска Пицария · Sofia',
  en:'Via Roma — Authentic Italian Pizzeria · Sofia',
};

/* ── DEFAULT DATA (fallback when DB is empty) ─────────────── */
const DEFAULT_MENU = [
  { id:1, name:'Margherita Tradizionale', nameBg:'Маргарита Традиционале',
    description:'Classic Neapolitan pizza with San Marzano tomatoes, fresh buffalo mozzarella, and fragrant basil drizzled with extra virgin olive oil.',
    descBg:'Класическа неаполитанска пица със San Marzano домати, прясна биволска моцарела и ароматен босилек.',
    price:11.50, category:'pizza',
    image:'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=85&auto=format&fit=crop', featured:true },
  { id:2, name:'Pepperoni Gourmet', nameBg:'Пеперони Гурме',
    description:'Rich tomato base with premium aged mozzarella, artisan pepperoni and Calabrian chili.',
    descBg:'Богата доматена основа с узряла моцарела, занаятчийски пеперони и калабрийски чили.',
    price:14.00, category:'pizza',
    image:'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&q=85&auto=format&fit=crop', featured:true },
  { id:3, name:'Spaghetti Carbonara', nameBg:'Спагети Карбонара',
    description:'Traditional Roman pasta with slow-cured guanciale, farm eggs, Pecorino Romano and cracked black pepper.',
    descBg:'Традиционна римска паста с гуанчале, прясни яйца, Пекорино Романо и черен пипер.',
    price:16.00, category:'pasta',
    image:'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800&q=85&auto=format&fit=crop', featured:true },
  { id:4, name:'Classic Tiramisu', nameBg:'Класическо Тирамису',
    description:'Layers of espresso-soaked ladyfingers and mascarpone cream dusted with premium cocoa.',
    descBg:'Пластове бишкоти с еспресо и крем маскарпоне, поръсени с какао.',
    price:8.50, category:'dessert',
    image:'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&q=85&auto=format&fit=crop', featured:true },
];

const DEFAULT_CONTENT = {
  phone:'+359 87 8399843',
  address:'ул. Рим 14, София, България', addressEn:'14 Via Roma St, Sofia, Bulgaria',
  hours:'Вт – Нд: 12:00 – 22:30',       hoursEn:'Tue – Sun: 12:00 – 22:30',
  aboutText:'Намерен в сърцето на София, Via Roma донася автентичните вкусове на Италия на вашата маса.',
  aboutTextEn:'Located in the heart of Sofia, Via Roma brings the authentic flavors of Italy to your table.',
  aboutSub:'Основан 1998 · Истинска италианска кухня · Sofia, Bulgaria',
  aboutSubEn:'Est. 1998 · Authentic Italian Cuisine · Sofia, Bulgaria',
  features:[
    { title:'Традиционни рецепти', sub:'Предадени от поколения', titleEn:'Traditional Recipes', subEn:'Passed down through generations' },
    { title:'Свежи съставки', sub:'Внос от Италия всяка седмица', titleEn:'Fresh Ingredients', subEn:'Imported from Italy every week' },
    { title:'Пещ на дърва', sub:'Автентична италианска технология', titleEn:'Wood-Fired Oven', subEn:'Authentic Italian technique' },
  ],
  social:{ instagram:'#', facebook:'#', tripadvisor:'#', youtube:'', tiktok:'' },
  news:['Новото ни сезонно меню вече е налично!','Резервирайте маса: +359 87 8399843','Пресни италиански съставки всяка седмица'],
  newsEn:['Our new seasonal menu is now available!','Book a table: +359 87 8399843','Fresh Italian ingredients every week'],
  copyright:'Via Roma Pizzeria · Sofia, Bulgaria',
  currency:'euro',
  customCats:[],
};

/* ── STATE ─────────────────────────────────────────────────── */
let lang               = localStorage.getItem('vr_lang')  || 'bg';
let theme              = localStorage.getItem('vr_theme') || 'dark';
let menuItems          = [];
let siteContent        = {};
let currentCat         = 'all';

/* ── LOAD STATE FROM SUPABASE ──────────────────────────────── */
async function loadState() {
  try {
    const [items, content, news] = await Promise.all([
      getMenuItems(),
      getContactInfo(),
      getNews(),
    ]);

    menuItems = items;   /* never fall back to DEFAULT_MENU — respect empty DB */

    siteContent = content ? { ...content } : clone(DEFAULT_CONTENT);

    /* merge news from news table — fall back to defaults so news is always visible */
    siteContent.news   = news.bg.length ? news.bg.map(r => r.text) : [...DEFAULT_CONTENT.news];
    siteContent.newsEn = news.en.length ? news.en.map(r => r.text) : [...DEFAULT_CONTENT.newsEn];

    /* ensure all required fields exist */
    const d = DEFAULT_CONTENT;
    const ensure = (key, val) => { if (siteContent[key] == null) siteContent[key] = val; };
    ensure('social',     { ...d.social });
    ensure('news',       [...d.news]);
    ensure('newsEn',     [...d.newsEn]);
    ensure('addressEn',  d.addressEn);
    ensure('hours',      d.hours);
    ensure('hoursEn',    d.hoursEn);
    ensure('aboutText',  d.aboutText);
    ensure('aboutTextEn',d.aboutTextEn);
    ensure('aboutSub',   d.aboutSub);
    ensure('aboutSubEn', d.aboutSubEn);
    ensure('copyright',  d.copyright);
    ensure('currency',   d.currency);
    ensure('customCats', []);
    if (!Array.isArray(siteContent.features) || !siteContent.features.length)
      siteContent.features = clone(d.features);
    if (!siteContent.social.youtube) siteContent.social.youtube = '';
    if (!siteContent.social.tiktok)  siteContent.social.tiktok  = '';

  } catch (err) {
    console.error('[Via Roma] Supabase load error:', err);
    menuItems   = [];                    /* never ghost items on DB error */
    siteContent = clone(DEFAULT_CONTENT);
  }
}

function clone(o) { return JSON.parse(JSON.stringify(o)); }

/* ── HELPERS ───────────────────────────────────────────────── */
function t(key) { return T[lang]?.[key] || T.en?.[key] || key; }
function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function svgPlate() {
  return `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" opacity=".3"><circle cx="12" cy="12" r="9"/><path d="M8 12h8M12 8v8"/></svg>`;
}

/* ── PRICE FORMATTING ─────────────────────────────────────── */
function formatPrice(price) {
  const n = parseFloat(price);
  if (isNaN(n)) return '—';
  /* Always euros. €20 for whole numbers, €11.50 for decimals. */
  return `€${Number.isInteger(n) ? n : n.toFixed(2)}`;
}

/* ── CATEGORY LABEL ───────────────────────────────────────── */
function catLabel(cat) {
  const customCats = siteContent.customCats || [];
  const custom = customCats.find(c => c.key === cat);
  if (custom) return lang === 'en' ? (custom.nameEn || custom.nameBg) : (custom.nameBg || custom.nameEn);
  const builtIn = {
    pizza:     { bg:'Пица',      en:'Pizza' },
    pasta:     { bg:'Паста',     en:'Pasta' },
    appetizer: { bg:'Предястие', en:'Appetizer' },
    salad:     { bg:'Салата',    en:'Salad' },
    soup:      { bg:'Супа',      en:'Soup' },
    dessert:   { bg:'Десерт',    en:'Dessert' },
    drink:     { bg:'Напитка',   en:'Drink' },
  };
  if (builtIn[cat]) return lang === 'en' ? builtIn[cat].en : builtIn[cat].bg;
  return cat;
}

/* ── I18N ──────────────────────────────────────────────────── */
function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  document.querySelectorAll('.lang-opt').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.lang === lang);
  });
  document.documentElement.lang = lang;
  document.title = PAGE_TITLES[lang] || PAGE_TITLES.bg;
  renderAbout();
  renderFeatured();
  renderMenuTabs();
  renderMenu();
  renderContact();
  renderFooterNews();
}

function setLang(newLang) {
  if (newLang === lang) return;
  lang = newLang;
  localStorage.setItem('vr_lang', lang);
  applyTranslations();
  renderFooterNews();
  positionAllLangPills();
}

/* ── THEME ─────────────────────────────────────────────────── */
function applyTheme(th) {
  document.documentElement.setAttribute('data-theme', th);
  theme = th;
}
function toggleTheme() {
  applyTheme(theme === 'dark' ? 'light' : 'dark');
  localStorage.setItem('vr_theme', theme);
}

/* ── NAV SCROLL — GSAP progressive fill ────────────────────── */
function initNavScroll() {
  const nav = document.getElementById('nav');
  if (!nav) return;

  const FILL_PX  = 340;                /* px of scroll to reach full opacity */
  const isMobile = () => window.matchMedia('(max-width:768px)').matches;
  let ticking = false;
  let lastP   = -1;

  function update() {
    ticking = false;
    const p       = Math.min(window.scrollY / FILL_PX, 1);
    const scrolled = p > 0.08;
    nav.classList.toggle('scrolled', scrolled);
    highlightActiveLink();

    /* On mobile the CSS already gives a frosted background — skip GSAP */
    if (isMobile() || typeof gsap === 'undefined') return;
    if (Math.abs(p - lastP) < 0.003) return;   /* skip imperceptible moves */
    lastP = p;

    const alpha   = +(p * 0.96).toFixed(3);
    const blur    = Math.round(p * 16);
    const shadowA = +(p * 0.12).toFixed(3);
    const borderA = +(Math.min(p * 1.5, 1)).toFixed(3);

    /* GSAP tweens background-color and box-shadow — smooth & GPU-friendly */
    gsap.to(nav, {
      backgroundColor  : `rgba(254,250,244,${alpha})`,
      boxShadow        : `0 2px 24px rgba(0,0,0,${shadowA})`,
      borderBottomColor: `rgba(221,211,190,${borderA})`,
      duration         : 0.18,
      ease             : 'power1.out',
      overwrite        : true,
    });
    /* Backdrop-filter via style — GSAP can't cross-browser tween this */
    nav.style.backdropFilter       = `blur(${blur}px)`;
    nav.style.webkitBackdropFilter = `blur(${blur}px)`;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
  update();
}

/* ── NAV ───────────────────────────────────────────────────── */
function initNav() {
  const burger   = document.getElementById('hamburger');
  const mobileM  = document.getElementById('mobileMenu');
  const backdrop = document.getElementById('mobileBackdrop');
  if (!burger || !mobileM) return;
  burger.addEventListener('click', () => {
    const open = !mobileM.classList.contains('open');
    mobileM.classList.toggle('open', open);
    backdrop.classList.toggle('open', open);
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  });
  backdrop.addEventListener('click', closeMobile);
  mobileM.querySelectorAll('.mobile-menu__link').forEach(a => a.addEventListener('click', closeMobile));
}
function closeMobile() {
  document.getElementById('mobileMenu')?.classList.remove('open');
  document.getElementById('mobileBackdrop')?.classList.remove('open');
  const b = document.getElementById('hamburger');
  if (b) { b.classList.remove('open'); b.setAttribute('aria-expanded','false'); }
  document.body.style.overflow = '';
}

function highlightActiveLink() {
  const ids = ['home','about','featured','menu','contact'];
  let active = 'home';
  for (const id of ids) {
    const el = document.getElementById(id);
    if (el && el.getBoundingClientRect().top <= 130) active = id;
  }
  document.querySelectorAll('.nav__link').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === `#${active}`);
  });
}

/* ── SMOOTH SCROLL ─────────────────────────────────────────── */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href').slice(1);
      const el = document.getElementById(id);
      if (el) {
        e.preventDefault();
        const navH    = document.getElementById('nav')?.offsetHeight || 70;
        const tickerH = 0; /* news moved to footer — no top bar offset needed */
        const top     = el.getBoundingClientRect().top + window.scrollY - navH - tickerH;
        window.scrollTo({ top, behavior:'smooth' });
        closeMobile();
      }
    });
  });
}

/* ── LANG PILL ─────────────────────────────────────────────── */
function positionLangPill(containerEl) {
  const pill      = containerEl.querySelector('.lang-pill');
  const activeOpt = containerEl.querySelector(`.lang-opt[data-lang="${lang}"]`);
  if (!pill || !activeOpt) return;
  const cRect = containerEl.getBoundingClientRect();
  const aRect = activeOpt.getBoundingClientRect();
  pill.style.width     = aRect.width + 'px';
  pill.style.transform = `translateX(${aRect.left - cRect.left - 3}px)`;
}
function positionAllLangPills() {
  ['langToggle','langToggleMobile'].forEach(id => {
    const el = document.getElementById(id);
    if (el) positionLangPill(el);
  });
}

/* ── LANG TOGGLES ──────────────────────────────────────────── */
function initLangToggles() {
  ['langToggle','langToggleMobile'].forEach(id => {
    const container = document.getElementById(id);
    if (!container) return;
    let startX = 0, didSwipe = false;
    container.addEventListener('pointerdown', e => { startX = e.clientX; didSwipe = false; }, { passive:true });
    container.addEventListener('pointerup', e => {
      const dx = e.clientX - startX;
      if (Math.abs(dx) >= 16) { didSwipe = true; setLang(dx > 0 ? 'en' : 'bg'); }
    }, { passive:true });
    container.addEventListener('click', e => {
      if (didSwipe) { didSwipe = false; return; }
      const opt = e.target.closest('.lang-opt');
      if (opt) { setLang(opt.dataset.lang); return; }
      const rect = container.getBoundingClientRect();
      setLang(e.clientX >= rect.left + rect.width / 2 ? 'en' : 'bg');
    });
  });
}

/* ── FOOTER NEWS ───────────────────────────────────────────── */
function renderFooterNews() {
  const section = document.getElementById('footerNewsSection');
  const list    = document.getElementById('footerNewsList');
  const badge   = document.getElementById('footerNewsBadge');
  if (!section || !list) return;

  const newsBg = Array.isArray(siteContent.news)   ? siteContent.news   : DEFAULT_CONTENT.news;
  const newsEn = Array.isArray(siteContent.newsEn) ? siteContent.newsEn : DEFAULT_CONTENT.newsEn;
  const news = lang === 'en'
    ? (newsEn.length ? newsEn : newsBg)
    : (newsBg.length ? newsBg : newsEn);

  const items = (news || []).filter(n => n && n.trim());
  if (badge) badge.textContent = t('news.badge');

  if (!items.length) { section.style.display = 'none'; return; }
  section.style.display = '';

  list.innerHTML = items.map(n =>
    `<div class="footer-news__item">
      <span class="footer-news__dot">✦</span>
      <span class="footer-news__text">${esc(n)}</span>
    </div>`
  ).join('');
}

/* ── ABOUT ─────────────────────────────────────────────────── */
function renderAbout() {
  const c    = siteContent;
  const isEn = lang === 'en';

  const textEl = document.querySelector('[data-i18n="about.text"]');
  if (textEl) textEl.textContent = isEn
    ? (c.aboutTextEn || T.en['about.text'])
    : (c.aboutText   || T.bg['about.text']);

  const subEl = document.querySelector('[data-i18n="about.sub"]');
  if (subEl) subEl.textContent = isEn
    ? (c.aboutSubEn  || T.en['about.sub'])
    : (c.aboutSub    || T.bg['about.sub']);

  const feats = Array.isArray(c.features) ? c.features : [];
  [1,2,3].forEach(i => {
    const f  = feats[i-1];
    const t1 = document.querySelector(`[data-i18n="about.feat${i}"]`);
    const t2 = document.querySelector(`[data-i18n="about.feat${i}sub"]`);
    if (f) {
      if (t1) t1.textContent = isEn ? (f.titleEn||f.title) : (f.title||f.titleEn);
      if (t2) t2.textContent = isEn ? (f.subEn  ||f.sub)   : (f.sub  ||f.subEn);
    }
  });
}

/* ── TOUCH HOVER — powered by GSAP ────────────────────────────────────
   WHY GSAP instead of CSS classes for the transform:
   • initAnimations() runs gsap.from('.dish-card', { y:28 }) etc. on scroll.
     After completion GSAP leaves an inline style="transform: translate(0,0)"
     on each card. Inline styles have CSS specificity 1,0,0,0 which beats
     ANY class selector (max 0,x,x,x). So .touch-hover { transform:... }
     in CSS was silently ignored — the card never lifted.
   • GSAP-to-GSAP: gsap.killTweensOf() + gsap.to() replaces the existing
     inline style with our new value — no specificity battle, always wins.
   • CSS class (.touch-hover) still handles NON-transform props (border-color,
     box-shadow, background) because GSAP ScrollTrigger never touches those.
──────────────────────────────────────────────────────────────────────── */
function initTouchHover() {
  /* Skip if not a touch device */
  if (!('ontouchstart' in window) && navigator.maxTouchPoints < 1) return;
  /* GSAP required for transform animation */
  if (typeof gsap === 'undefined') return;

  /* Finger must move this many px before we treat it as a scroll gesture.
     Keeps tiny resting-finger tremors from cancelling the hover effect. */
  const SCROLL_PX = 12;

  /* Each entry: which container to watch, which child to animate, how far */
  const CONFIG = [
    { parent:'#featuredGrid',    sel:'.dish-card',    imgSel:'.dish-card__img',     liftY:-7, imgScale:1.13 },
    { parent:'#menuGrid',        sel:'.menu-card',    imgSel:'.menu-card__img',     liftY:-7, imgScale:1.13 },
    { parent:'.about__features', sel:'.about__feat',  imgSel:'.about__feat-icon',   liftY:-4, imgScale:1.1  },
    { parent:'.contact-cards',   sel:'.contact-card', imgSel:'.contact-card__icon', liftY:-4, imgScale:1.1  },
    { parent:'#menuTabs',        sel:'.menu-tab',     imgSel:null,                  liftY:-2, imgScale:1    },
    { parent:'#socialIcons',     sel:'.social-link',  imgSel:null,                  liftY:-4, imgScale:1.1  },
    { parent:'#footerSocial',    sel:'.social-link',  imgSel:null,                  liftY:-4, imgScale:1.1  },
  ];

  CONFIG.forEach(({ parent, sel, imgSel, liftY, imgScale }) => {
    const container = document.querySelector(parent);
    if (!container) return;

    let active    = null;   /* currently pressed element */
    let startX    = 0;
    let startY    = 0;
    let scrolling = false;

    /* Animate element INTO the hover state */
    function hoverIn(el) {
      if (active && active !== el) hoverOut(active, 0); /* release previous */
      active = el;
      el.classList.add('touch-hover');              /* border / shadow via CSS */

      gsap.killTweensOf(el);
      gsap.to(el, { y: liftY, duration: 0.30, ease: 'power2.out', overwrite: true });

      if (imgSel) {
        const img = el.querySelector(imgSel);
        if (img) {
          gsap.killTweensOf(img);
          gsap.to(img, { scale: imgScale, duration: 0.40, ease: 'power2.out', overwrite: true });
        }
      }
    }

    /* Animate element BACK to its resting state.
       delayMs = 0   → instant reverse (scroll cancel)
       delayMs = 300 → hold briefly so the user sees the lift, then ease back */
    function hoverOut(el, delayMs) {
      if (active === el) active = null;
      const d = delayMs / 1000;

      gsap.killTweensOf(el);
      gsap.to(el, {
        y         : 0,
        duration  : 0.36,
        ease      : 'power2.inOut',
        delay     : d,
        overwrite : true,
        onComplete: () => {
          el.classList.remove('touch-hover');
          /* Clear GSAP's inline transform so the element is fully CSS-controlled
             again — prevents stale inline styles accumulating over many taps. */
          gsap.set(el, { clearProps: 'y,transform' });
        }
      });

      if (imgSel) {
        const img = el.querySelector(imgSel);
        if (img) {
          gsap.killTweensOf(img);
          gsap.to(img, {
            scale    : 1,
            duration : 0.38,
            ease     : 'power2.inOut',
            delay    : d,
            overwrite: true,
            onComplete: () => gsap.set(img, { clearProps: 'scale,transform' })
          });
        }
      }
    }

    /* ── Events ── */
    container.addEventListener('touchstart', e => {
      const el = e.target.closest(sel);
      if (!el) return;
      startX    = e.touches[0].clientX;
      startY    = e.touches[0].clientY;
      scrolling = false;
      hoverIn(el);
    }, { passive: true });

    container.addEventListener('touchmove', e => {
      if (scrolling || !active) return;
      const dx = Math.abs(e.touches[0].clientX - startX);
      const dy = Math.abs(e.touches[0].clientY - startY);
      if (dx > SCROLL_PX || dy > SCROLL_PX) {
        scrolling = true;
        hoverOut(active, 0);   /* cancel immediately on real scroll */
      }
    }, { passive: true });

    container.addEventListener('touchend', () => {
      if (!active) return;
      if (scrolling) { hoverOut(active, 0); return; }
      hoverOut(active, 300);   /* hold for 300 ms then ease back */
    }, { passive: true });

    container.addEventListener('touchcancel', () => {
      if (active) hoverOut(active, 0);
    }, { passive: true });
  });
}

/* ── GSAP ANIMATIONS ───────────────────────────────────────── */
function initAnimations() {
  if (typeof gsap === 'undefined') return;
  if (typeof ScrollTrigger !== 'undefined') gsap.registerPlugin(ScrollTrigger);

  const fadeFrom = (sel, vars = {}) => {
    const els = document.querySelectorAll(sel);
    if (!els.length) return;
    gsap.from(sel, {
      scrollTrigger: { trigger: sel, start:'top 86%' },
      opacity:0, duration:.7, ease:'power3.out', ...vars,
      /* Clear inline transform after animation so CSS :hover transforms work */
      onComplete() { gsap.set(sel, { clearProps: 'transform,x,y,opacity' }); },
    });
  };

  fadeFrom('.about__body',  { x:-32 });
  fadeFrom('.about__feat',  { x:24, stagger:.1 });
  fadeFrom('.dish-card',    { y:28, stagger:.07 });
  fadeFrom('.menu-tabs',    { y:14 });
  fadeFrom('.contact-card', { y:24, stagger:.1 });
  document.querySelectorAll('.section-head').forEach(el => {
    gsap.from(el, {
      scrollTrigger:{ trigger:el, start:'top 88%' },
      opacity:0, y:18, duration:.6, ease:'power2.out'
    });
  });
}

/* ── MENU TABS ─────────────────────────────────────────────── */
function getAllCategories() {
  return [...new Set(menuItems.map(i => i.category).filter(Boolean))];
}
function renderMenuTabs() {
  const tabsEl = document.getElementById('menuTabs');
  if (!tabsEl) return;
  const cats   = getAllCategories();
  const allLbl = lang === 'bg' ? 'Всички' : 'All';
  let html = `<button class="menu-tab${currentCat==='all'?' active':''}" data-cat="all">${allLbl}</button>`;
  cats.forEach(cat => {
    html += `<button class="menu-tab${currentCat===cat?' active':''}" data-cat="${esc(cat)}">${esc(catLabel(cat))}</button>`;
  });
  tabsEl.innerHTML = html;
}

function initMenuTabs() {
  document.getElementById('menuTabs')?.addEventListener('click', e => {
    const tab = e.target.closest('.menu-tab');
    if (!tab || tab.dataset.cat === currentCat) return;
    currentCat = tab.dataset.cat;
    document.querySelectorAll('.menu-tab').forEach(tb => tb.classList.toggle('active', tb===tab));
    const grid = document.getElementById('menuGrid');
    if (grid) { grid.classList.remove('is-switching'); void grid.offsetWidth; grid.classList.add('is-switching'); }
    renderMenu();
  });
}

/* ── FEATURED ──────────────────────────────────────────────── */
function renderFeatured() {
  const grid    = document.getElementById('featuredGrid');
  const section = document.getElementById('featured');
  if (!grid) return;
  const featItems = menuItems.filter(i => i.featured);
  if (!featItems.length) {
    if (section) section.hidden = true;
    return;
  }
  if (section) section.hidden = false;
  grid.innerHTML = featItems.map(item => {
    const nm = lang === 'en' ? (item.name||item.nameBg||'') : (item.nameBg||item.name||'');
    const ds = lang === 'en' ? (item.description||item.descBg||'') : (item.descBg||item.description||'');
    return `<div class="dish-card">
      <div class="dish-card__img-wrap">
        ${item.image ? `<img class="dish-card__img" src="${esc(item.image)}" alt="${esc(nm)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">` : ''}
        <div class="dish-card__img-ph" style="display:${item.image?'none':'flex'}">${svgPlate()}</div>
        <span class="dish-card__badge">${esc(catLabel(item.category))}</span>
      </div>
      <div class="dish-card__body">
        <h3 class="dish-card__name">${esc(nm)}</h3>
        ${ds ? `<p class="dish-card__desc">${esc(ds)}</p>` : ''}
        <div class="dish-card__footer">
          <span class="dish-card__price">${formatPrice(item.price)}</span>
        </div>
      </div>
    </div>`;
  }).join('');
}

/* ── MENU ──────────────────────────────────────────────────── */
function renderMenu() {
  const grid = document.getElementById('menuGrid');
  if (!grid) return;
  const filtered = currentCat === 'all' ? menuItems : menuItems.filter(i => i.category === currentCat);
  if (!filtered.length) {
    grid.innerHTML = `<p class="menu-empty">${t('menu.empty')}</p>`;
    return;
  }
  grid.innerHTML = filtered.map(item => {
    const nm = lang === 'en' ? (item.name||item.nameBg||'') : (item.nameBg||item.name||'');
    const ds = lang === 'en' ? (item.description||item.descBg||'') : (item.descBg||item.description||'');
    return `<div class="menu-card">
      <div class="menu-card__img-wrap">
        ${item.image ? `<img class="menu-card__img" src="${esc(item.image)}" alt="${esc(nm)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">` : ''}
        <div class="menu-card__img-ph" style="display:${item.image?'none':'flex'}">${svgPlate()}</div>
        <span class="menu-card__badge">${esc(catLabel(item.category))}</span>
      </div>
      <div class="menu-card__body">
        <h3 class="menu-card__name">${esc(nm)}</h3>
        <p class="menu-card__desc">${esc(ds)}</p>
        <div class="menu-card__footer">
          <span class="menu-card__price">${formatPrice(item.price)}</span>
        </div>
      </div>
    </div>`;
  }).join('');

  if (typeof gsap !== 'undefined') {
    gsap.from('.menu-card', {
      opacity:0, y:14, duration:.35, stagger:.05, ease:'power2.out',
      onComplete() { gsap.set('.menu-card', { clearProps: 'transform,y,opacity' }); },
    });
  }
}

/* ── CONTACT ───────────────────────────────────────────────── */
function renderContact() {
  const c     = siteContent;
  const isEn  = lang === 'en';
  const phone = c.phone || DEFAULT_CONTENT.phone;
  const addr  = isEn ? (c.addressEn||DEFAULT_CONTENT.addressEn) : (c.address||DEFAULT_CONTENT.address);
  const hours = isEn ? (c.hoursEn  ||DEFAULT_CONTENT.hoursEn)   : (c.hours  ||DEFAULT_CONTENT.hours);

  ['phoneLink','footerPhone'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.textContent = phone; el.href = `tel:${phone.replace(/[\s-]/g,'')}`; }
  });
  ['hoursDisplay','footerHours'].forEach(id => {
    const el = document.getElementById(id); if (el) el.textContent = hours;
  });
  ['addressDisplay','footerAddress'].forEach(id => {
    const el = document.getElementById(id); if (el) el.textContent = addr;
  });

  const cpEl = document.getElementById('copyrightText');
  if (cpEl) cpEl.textContent = c.copyright || DEFAULT_CONTENT.copyright;

  renderSocials();
}

/* ── SOCIALS ───────────────────────────────────────────────── */
const SOCIAL_SVG = {
  instagram:`<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>`,
  facebook:`<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>`,
  tripadvisor:`<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 2"/></svg>`,
  youtube:`<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-1.96C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.4 19.54C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/></svg>`,
  tiktok:`<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>`,
};
function renderSocials() {
  const s         = siteContent.social || DEFAULT_CONTENT.social;
  const platforms = ['instagram','facebook','tripadvisor','youtube','tiktok'];
  const active    = platforms.filter(k => s[k] && s[k] !== '#' && s[k] !== '');
  const html      = active.length
    ? active.map(k => `<a href="${esc(s[k])}" class="social-link" aria-label="${k}" target="_blank" rel="noopener noreferrer">${SOCIAL_SVG[k]}</a>`).join('')
    : platforms.slice(0,3).map(k => `<a href="#" class="social-link" aria-label="${k}">${SOCIAL_SVG[k]}</a>`).join('');
  ['socialIcons','footerSocial'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  });
}

/* ── ADMIN MODAL ───────────────────────────────────────────── */
function openAdminModal() {
  const overlay = document.getElementById('adminOverlay');
  if (!overlay) return;
  overlay.hidden = false;
  const inp = document.getElementById('adminPwInput');
  if (inp) { inp.value = ''; inp.focus(); }
  const err = document.getElementById('adminPwError');
  if (err) err.style.display = 'none';
}
function closeAdminModal() {
  const overlay = document.getElementById('adminOverlay');
  if (overlay) overlay.hidden = true;
}
async function submitAdminPw() {
  const val    = document.getElementById('adminPwInput').value;
  const err    = document.getElementById('adminPwError');
  const btn    = document.getElementById('adminEnterBtn');
  if (err) err.style.display = 'none';
  if (btn) btn.disabled = true;
  try {
    const stored = await getAdminPassword();
    if (val === stored) {
      sessionStorage.setItem('vr_admin_ok','1');
      window.location.href = '/admin.html';
    } else {
      if (err) err.style.display = 'block';
      document.getElementById('adminPwInput').select();
    }
  } catch(e) {
    /* Supabase unreachable — fall back to localStorage default */
    const stored = localStorage.getItem('vr_admin_pw') || 'admin123';
    if (val === stored) {
      sessionStorage.setItem('vr_admin_ok','1');
      window.location.href = '/admin.html';
    } else {
      if (err) err.style.display = 'block';
      document.getElementById('adminPwInput').select();
    }
  } finally {
    if (btn) btn.disabled = false;
  }
}

/* ── TOAST ─────────────────────────────────────────────────── */
let _toastTimer;
function showToast(msg, type = 'info') {
  const el = document.getElementById('toastEl');
  if (!el) return;
  const icons = {
    success:`<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    error:`<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    info:`<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  };
  el.className = `toast ${type}`;
  el.innerHTML = `<div class="toast__bar"></div><div class="toast__inner"><div class="toast__icon-wrap">${icons[type]||icons.info}</div><div class="toast__body"><div class="toast__title">${esc(msg)}</div></div></div>`;
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}

/* ── YEAR & COPYRIGHT ──────────────────────────────────────── */
function setYear() {
  const el = document.getElementById('yearSpan');
  if (el) el.textContent = new Date().getFullYear();
}

/* ── VIEW COUNTER ──────────────────────────────────────────── */
function renderViewCount(n) {
  const el = document.getElementById('viewCountDisplay');
  if (!el) return;
  const formatted = Number(n).toLocaleString('en-US');
  el.textContent = `Total Views: ${formatted}`;
  el.style.display = 'block';
}

/* ── SKELETON HELPERS ──────────────────────────────────────── */
function _skelCard(imgClass, bodyItems) {
  return `<div class="dish-card skel-card" aria-hidden="true"><div class="skel ${imgClass}"></div><div class="skel-body">${bodyItems}</div></div>`;
}
function showFeaturedSkeleton() {
  const g = document.getElementById('featuredGrid');
  if (!g) return;
  const card = _skelCard('skel-img','<div class="skel skel-title"></div><div class="skel skel-text"></div><div class="skel skel-text"></div><div class="skel skel-price"></div>');
  g.innerHTML = card.repeat(4);
}
function showMenuSkeleton() {
  const g = document.getElementById('menuGrid');
  if (!g) return;
  const row = `<div class="menu-card skel-card" aria-hidden="true"><div class="skel skel-menu-img"></div><div class="skel-menu-body"><div class="skel skel-menu-name"></div><div class="skel skel-menu-desc"></div><div class="skel skel-menu-desc"></div><div class="skel skel-menu-price"></div></div></div>`;
  g.innerHTML = row.repeat(6);
}

/* ── BOOT ──────────────────────────────────────────────────── */
async function init() {
  applyTheme('light');
  setYear();

  initNav();
  initNavScroll();
  initLangToggles();
  initSmoothScroll();
  initMenuTabs();

  showFeaturedSkeleton();
  showMenuSkeleton();

  await loadState();

  applyTranslations();
  renderContact();
  renderFooterNews();
  initRealtime();

  /* ── PAGE VIEW COUNTER ─────────────────────────────────────
     Increment on every page load (no session guard).
     Runs after loadState so Supabase client is ready.
     Fire-and-forget: errors are silent so they don't break the page. */
  incrementViewCount()
    .then(count => renderViewCount(count))
    .catch(err  => console.warn('[Via Roma] View counter error:', err));

  document.getElementById('adminTrigger')?.addEventListener('click', openAdminModal);
  document.getElementById('adminEnterBtn')?.addEventListener('click', submitAdminPw);
  document.getElementById('adminCancelBtn')?.addEventListener('click', closeAdminModal);
  document.getElementById('adminPwInput')?.addEventListener('keydown', e => {
    if (e.key === 'Enter')  submitAdminPw();
    if (e.key === 'Escape') closeAdminModal();
  });
  document.getElementById('adminOverlay')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeAdminModal();
  });

  initTouchHover();
  requestAnimationFrame(() => requestAnimationFrame(positionAllLangPills));
  setTimeout(initAnimations, 120);
}

/* ── SUPABASE REALTIME — auto-refresh website when admin saves ── */
let _reloadTimer;
function initRealtime() {
  try {
    _db.channel('vr-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' },   _onLiveChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_content' }, _onLiveChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'news' },         _onLiveChange)
      .subscribe();
  } catch(e) {
    console.warn('[Via Roma] Realtime unavailable:', e);
  }
}
function _onLiveChange() {
  clearTimeout(_reloadTimer);
  _reloadTimer = setTimeout(async () => {
    try {
      await loadState();
      applyTranslations();
      renderContact();
      renderFooterNews();
    } catch(e) { console.warn('[Via Roma] Live reload error:', e); }
  }, 300);
}

document.addEventListener('DOMContentLoaded', init);
