/* ═══════════════════════════════════════════════════════════
   VIA ROMA — supabase.js  (WEBSITE)
   All Supabase database logic lives here. No UI code.
   UI logic stays in script.js.

   ── SETUP: Run this SQL once in your Supabase SQL editor ──

   create table menu_items (
     id bigint generated always as identity primary key,
     name text, name_bg text,
     description text, desc_bg text,
     price numeric, category text, image text,
     featured boolean default false,
     created_at timestamptz default now()
   );
   create table site_content (
     id int primary key,
     data jsonb not null
   );
   create table news (
     id bigint generated always as identity primary key,
     text text not null,
     lang text not null,
     created_at timestamptz default now()
   );
   create table website_stats (
     id int primary key,
     total_views bigint default 0 not null,
     day_views   bigint default 0 not null,
     month_views bigint default 0 not null,
     year_views  bigint default 0 not null,
     last_day    text   default '' not null,
     last_month  text   default '' not null,
     last_year   text   default '' not null
   );
   insert into website_stats (id, total_views, day_views, month_views, year_views, last_day, last_month, last_year)
     values (1, 0, 0, 0, 0, '', '', '');

   -- If table already exists, add the new columns:
   alter table website_stats
     add column if not exists day_views   bigint default 0 not null,
     add column if not exists month_views bigint default 0 not null,
     add column if not exists year_views  bigint default 0 not null,
     add column if not exists last_day    text   default '' not null,
     add column if not exists last_month  text   default '' not null,
     add column if not exists last_year   text   default '' not null;

   alter table menu_items   disable row level security;
   alter table site_content disable row level security;
   alter table news         disable row level security;
   alter table website_stats disable row level security;

   ═══════════════════════════════════════════════════════════ */
'use strict';

const SUPABASE_URL = 'https://dimfauesrcwzaxfajnev.supabase.co';
const SUPABASE_KEY = 'sb_publishable_mx57x7dLubFt1Ci7p0kL1A_0Y1xcz4o';

const _db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/* ── INTERNAL: map DB row → JS object ─────────────────────── */
function _rowToItem(row) {
  return {
    id          : row.id,
    name        : row.name        || '',
    nameBg      : row.name_bg     || '',
    description : row.description || '',
    descBg      : row.desc_bg     || '',
    price       : parseFloat(row.price) || 0,
    category    : row.category    || '',
    image       : row.image       || '',
    featured    : !!row.featured,
  };
}

/* ══ MENU ITEMS ═══════════════════════════════════════════════ */

async function getMenuItems() {
  const { data, error } = await _db
    .from('menu_items')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map(_rowToItem);
}

async function addMenuItem(item) {
  const { data, error } = await _db
    .from('menu_items')
    .insert([{
      name        : item.name        || item.nameBg      || '',
      name_bg     : item.nameBg      || item.name        || '',
      description : item.description || item.descBg      || '',
      desc_bg     : item.descBg      || item.description || '',
      price       : parseFloat(item.price) || 0,
      category    : item.category    || '',
      image       : item.image       || '',
      featured    : !!item.featured,
    }])
    .select()
    .single();
  if (error) throw error;
  return _rowToItem(data);
}

async function updateMenuItem(id, item) {
  const { data, error } = await _db
    .from('menu_items')
    .update({
      name        : item.name        || item.nameBg      || '',
      name_bg     : item.nameBg      || item.name        || '',
      description : item.description || item.descBg      || '',
      desc_bg     : item.descBg      || item.description || '',
      price       : parseFloat(item.price) || 0,
      category    : item.category    || '',
      image       : item.image       || '',
      featured    : !!item.featured,
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return _rowToItem(data);
}

async function deleteMenuItem(id) {
  const { error } = await _db.from('menu_items').delete().eq('id', id);
  if (error) throw error;
}

/* ══ SITE CONTENT (contact, about, social, settings) ════════ */

async function getContactInfo() {
  const { data, error } = await _db
    .from('site_content')
    .select('data')
    .eq('id', 1)
    .maybeSingle();
  if (error) throw error;
  return data ? data.data : null;
}

async function updateContactInfo(content) {
  const toSave = { ...content };
  delete toSave.news;
  delete toSave.newsEn;
  const { error } = await _db
    .from('site_content')
    .upsert({ id: 1, data: toSave }, { onConflict: 'id' });
  if (error) throw error;
}

/* ══ NEWS ═════════════════════════════════════════════════════ */

async function getNews() {
  const { data, error } = await _db
    .from('news')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  const rows = data || [];
  return {
    bg: rows.filter(r => r.lang === 'bg').map(r => ({ id: r.id, text: r.text })),
    en: rows.filter(r => r.lang === 'en').map(r => ({ id: r.id, text: r.text })),
  };
}

async function addNews(text, lang) {
  const { data, error } = await _db
    .from('news')
    .insert([{ text, lang }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteNews(id) {
  const { error } = await _db.from('news').delete().eq('id', id);
  if (error) throw error;
}

/* ══ WEBSITE STATS (visitor counter) ════════════════════════ */

/* IMPORTANT: getViewCount and incrementViewCount NEVER throw.
   If the website_stats table doesn't exist yet, they silently return 0
   so that admin loadData() (which calls getViewCount in Promise.all)
   never crashes and always loads the menu correctly. */

async function getViewCount() {
  try {
    const { data, error } = await _db
      .from('website_stats')
      .select('total_views')
      .eq('id', 1)
      .maybeSingle();
    if (error) return 0;
    return data ? Number(data.total_views) : 0;
  } catch { return 0; }
}

/* incrementViewCount — increments total, day, month, and year counters.
   Day/month/year counters auto-reset when the date period changes.
   RESILIENT: if the table only has the old schema (total_views only),
   the full upsert fails and we fall back to incrementing just total_views
   so the visitor count ALWAYS works regardless of migration state. */
async function incrementViewCount() {
  try {
    /* ── Step 1: Read current row ─────────────────────────── */
    const { data: row, error: readErr } = await _db
      .from('website_stats')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    /* If the table doesn't exist at all, try a minimal bootstrap insert */
    if (readErr) {
      try {
        const { data: d } = await _db
          .from('website_stats')
          .upsert({ id: 1, total_views: 1 }, { onConflict: 'id' })
          .select('total_views').single();
        return d ? Number(d.total_views) : 1;
      } catch { return 1; }
    }

    const now        = new Date();
    const todayStr   = now.toISOString().slice(0, 10);   /* YYYY-MM-DD */
    const monthStr   = now.toISOString().slice(0, 7);    /* YYYY-MM    */
    const yearStr    = String(now.getFullYear());         /* YYYY       */

    const cur        = row || {};
    const totalViews = (Number(cur.total_views) || 0) + 1;
    const dayViews   = ((cur.last_day   === todayStr) ? Number(cur.day_views)   || 0 : 0) + 1;
    const monthViews = ((cur.last_month === monthStr)  ? Number(cur.month_views) || 0 : 0) + 1;
    const yearViews  = ((cur.last_year  === yearStr)   ? Number(cur.year_views)  || 0 : 0) + 1;

    /* ── Step 2: Try full upsert (new schema with all 7 columns) ── */
    const { data, error: writeErr } = await _db
      .from('website_stats')
      .upsert({
        id          : 1,
        total_views : totalViews,
        day_views   : dayViews,
        month_views : monthViews,
        year_views  : yearViews,
        last_day    : todayStr,
        last_month  : monthStr,
        last_year   : yearStr,
      }, { onConflict: 'id' })
      .select('total_views')
      .single();

    if (!writeErr) return Number(data.total_views);

    /* ── Step 3: Fallback — table has old schema (only total_views) ─
       The full upsert failed because day_views / month_views / year_views
       columns don't exist yet. Increment just total_views so the counter
       still works before the user runs the ALTER TABLE migration. */
    console.warn('[Via Roma] Full upsert failed (old schema?), using fallback:', writeErr.message);
    const { data: d2, error: e2 } = await _db
      .from('website_stats')
      .upsert({ id: 1, total_views: totalViews }, { onConflict: 'id' })
      .select('total_views')
      .single();

    if (!e2) return Number(d2.total_views);

    /* Absolute last resort: RPC-free increment via update */
    const { data: d3 } = await _db
      .from('website_stats')
      .update({ total_views: totalViews })
      .eq('id', 1)
      .select('total_views')
      .single();
    return d3 ? Number(d3.total_views) : totalViews;

  } catch(err) {
    console.error('[Via Roma] View count unexpected error:', err);
    return 0;
  }
}

/* ══ BULK HELPERS (data reset only) ═════════════════════════ */

async function _clearAllMenuItems() {
  const { error } = await _db.from('menu_items').delete().gte('id', 0);
  if (error) throw error;
}

async function _clearAllNews() {
  const { error } = await _db.from('news').delete().gte('id', 0);
  if (error) throw error;
}

/* ══ ADMIN PASSWORD ═══════════════════════════════════════════ */

async function getAdminPassword() {
  try {
    const { data, error } = await _db
      .from('admin_settings')
      .select('password')
      .eq('id', 1)
      .maybeSingle();
    if (error || !data) return 'admin123';
    return data.password || 'admin123';
  } catch { return 'admin123'; }
}
