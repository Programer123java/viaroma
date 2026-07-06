/* ═══════════════════════════════════════════════════════════
   VIA ROMA — supabase.js  (WEBSITE)
   All Supabase database logic lives here. No UI code.
   UI logic stays in script.js.
   ═══════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://0ec90b57d6e95fcbda19832f.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJib2x0IiwicmVmIjoiMGVjOTBiNTdkNmU5NWZjYmRhMTk4MzJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODE1NzQsImV4cCI6MTc1ODg4MTU3NH0.9I8-U0x86Ak8t2DGaIk0HfvTSLsAyzdnz-Nw00mMkKw';

const _db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

export async function getMenuItems() {
  const { data, error } = await _db
    .from('menu_items')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map(_rowToItem);
}

export async function addMenuItem(item) {
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

export async function updateMenuItem(id, item) {
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

export async function deleteMenuItem(id) {
  const { error } = await _db.from('menu_items').delete().eq('id', id);
  if (error) throw error;
}

/* ══ SITE CONTENT (contact, about, social, settings) ════════ */

export async function getContactInfo() {
  const { data, error } = await _db
    .from('site_content')
    .select('data')
    .eq('id', 1)
    .maybeSingle();
  if (error) throw error;
  return data ? data.data : null;
}

export async function updateContactInfo(content) {
  const toSave = { ...content };
  delete toSave.news;
  delete toSave.newsEn;
  const { error } = await _db
    .from('site_content')
    .upsert({ id: 1, data: toSave }, { onConflict: 'id' });
  if (error) throw error;
}

/* ══ NEWS ═════════════════════════════════════════════════════ */

export async function getNews() {
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

export async function addNews(text, lang) {
  const { data, error } = await _db
    .from('news')
    .insert([{ text, lang }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteNews(id) {
  const { error } = await _db.from('news').delete().eq('id', id);
  if (error) throw error;
}

/* ══ WEBSITE STATS (visitor counter) ════════════════════════ */

export async function getViewCount() {
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

export async function incrementViewCount() {
  try {
    const { data: row, error: readErr } = await _db
      .from('website_stats')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

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
    const todayStr   = now.toISOString().slice(0, 10);
    const monthStr   = now.toISOString().slice(0, 7);
    const yearStr    = String(now.getFullYear());

    const cur        = row || {};
    const totalViews = (Number(cur.total_views) || 0) + 1;
    const dayViews   = ((cur.last_day   === todayStr) ? Number(cur.day_views)   || 0 : 0) + 1;
    const monthViews = ((cur.last_month === monthStr)  ? Number(cur.month_views) || 0 : 0) + 1;
    const yearViews  = ((cur.last_year  === yearStr)   ? Number(cur.year_views)  || 0 : 0) + 1;

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

    console.warn('[Via Roma] Full upsert failed (old schema?), using fallback:', writeErr.message);
    const { data: d2, error: e2 } = await _db
      .from('website_stats')
      .upsert({ id: 1, total_views: totalViews }, { onConflict: 'id' })
      .select('total_views')
      .single();

    if (!e2) return Number(d2.total_views);

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

export async function _clearAllMenuItems() {
  const { error } = await _db.from('menu_items').delete().gte('id', 0);
  if (error) throw error;
}

export async function _clearAllNews() {
  const { error } = await _db.from('news').delete().gte('id', 0);
  if (error) throw error;
}

/* ══ ADMIN PASSWORD ═══════════════════════════════════════════ */

export async function getAdminPassword() {
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

export async function updateAdminPassword(newPassword) {
  const { error } = await _db
    .from('admin_settings')
    .upsert({ id: 1, password: newPassword }, { onConflict: 'id' });
  if (error) throw error;
}

/* ══ REALTIME CHANNEL ═════════════════════════════════════════ */
export { _db };
