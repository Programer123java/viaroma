-- Menu items table
CREATE TABLE IF NOT EXISTS menu_items (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT,
  name_bg TEXT,
  description TEXT,
  desc_bg TEXT,
  price NUMERIC DEFAULT 0,
  category TEXT DEFAULT 'pizza',
  image TEXT,
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Site content table (stores contact info, settings, etc.)
CREATE TABLE IF NOT EXISTS site_content (
  id INT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'
);

-- News table
CREATE TABLE IF NOT EXISTS news (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  text TEXT NOT NULL,
  lang TEXT NOT NULL DEFAULT 'bg',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Website stats table
CREATE TABLE IF NOT EXISTS website_stats (
  id INT PRIMARY KEY,
  total_views BIGINT DEFAULT 0 NOT NULL,
  day_views BIGINT DEFAULT 0 NOT NULL,
  month_views BIGINT DEFAULT 0 NOT NULL,
  year_views BIGINT DEFAULT 0 NOT NULL,
  last_day TEXT DEFAULT '' NOT NULL,
  last_month TEXT DEFAULT '' NOT NULL,
  last_year TEXT DEFAULT '' NOT NULL
);

-- Admin settings table
CREATE TABLE IF NOT EXISTS admin_settings (
  id INT PRIMARY KEY,
  password TEXT NOT NULL DEFAULT 'admin123'
);

-- Insert default data
INSERT INTO website_stats (id, total_views, day_views, month_views, year_views, last_day, last_month, last_year)
VALUES (1, 0, 0, 0, 0, '', '', '')
ON CONFLICT (id) DO NOTHING;

INSERT INTO admin_settings (id, password)
VALUES (1, 'viaroma2024')
ON CONFLICT (id) DO NOTHING;

-- Insert sample menu items
INSERT INTO menu_items (name, name_bg, description, desc_bg, price, category, image, featured) VALUES
('Margherita Tradizionale', 'Маргарита Традиционале', 
 'Classic Neapolitan pizza with San Marzano tomatoes, fresh buffalo mozzarella, and fragrant basil drizzled with extra virgin olive oil.',
 'Класическа неаполитанска пица със San Marzano домати, прясна биволска моцарела и ароматен босилек.',
 11.50, 'pizza', 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=85&auto=format&fit=crop', true),
('Pepperoni Gourmet', 'Пеперони Гурме',
 'Rich tomato base with premium aged mozzarella, artisan pepperoni and Calabrian chili.',
 'Богата доматена основа с узряла моцарела, занаятчийски пеперони и калабрийски чили.',
 14.00, 'pizza', 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&q=85&auto=format&fit=crop', true),
('Spaghetti Carbonara', 'Спагети Карбонара',
 'Traditional Roman pasta with slow-cured guanciale, farm eggs, Pecorino Romano and cracked black pepper.',
 'Традиционна римска паста с гуанчале, прясни яйца, Пекорино Романо и черен пипер.',
 16.00, 'pasta', 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800&q=85&auto=format&fit=crop', true),
('Classic Tiramisu', 'Класическо Тирамису',
 'Layers of espresso-soaked ladyfingers and mascarpone cream dusted with premium cocoa.',
 'Пластове бишкоти с еспресо и крем маскарпоне, поръсени с какао.',
 8.50, 'dessert', 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&q=85&auto=format&fit=crop', true),
('Quattro Formaggi', 'Четири Сира',
 'Four-cheese pizza with mozzarella, gorgonzola, fontina and parmesan.',
 'Пица с четири вида сирена моцарела, горгонзола, фонтина и пармезан.',
 15.00, 'pizza', 'https://images.unsplash.com/photo-1571066811602-716837d591de?w=800&q=85&auto=format&fit=crop', false),
('Bruschetta Classica', 'Брускета Класика',
 'Toasted bread topped with fresh tomatoes, garlic, basil and olive oil.',
 'Препечен хляб с пресни домати, чесън, босилек и зехтин.',
 7.50, 'appetizer', 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=800&q=85&auto=format&fit=crop', false),
('Caesar Salad', 'Салата Цезар',
 'Crisp romaine lettuce, parmesan, croutons and Caesar dressing.',
 'Хрупкава салата ромейн, пармезан, крутони и сос Цезар.',
 9.00, 'salad', 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=800&q=85&auto=format&fit=crop', false),
('Italian Espresso', 'Италианско Еспресо',
 'Authentic Italian espresso, strong and aromatic.',
 'Автентично италианско еспресо, силно и ароматно.',
 3.50, 'drink', 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=800&q=85&auto=format&fit=crop', false);

-- Insert sample news
INSERT INTO news (text, lang) VALUES
('Новото ни сезонно меню вече е налично!', 'bg'),
('Резервирайте маса: +359 87 8399843', 'bg'),
('Пресни италиански съставки всяка седмица', 'bg'),
('Our new seasonal menu is now available!', 'en'),
('Book a table: +359 87 8399843', 'en'),
('Fresh Italian ingredients every week', 'en');

-- Insert site content
INSERT INTO site_content (id, data) VALUES (
  1,
  '{
    "phone": "+359 87 8399843",
    "address": "ул. Рим 14, София, България",
    "addressEn": "14 Via Roma St, Sofia, Bulgaria",
    "hours": "Вт – Нд: 12:00 – 22:30",
    "hoursEn": "Tue – Sun: 12:00 – 22:30",
    "aboutText": "Намерен в сърцето на София, Via Roma донася автентичните вкусове на Италия на вашата маса.",
    "aboutTextEn": "Located in the heart of Sofia, Via Roma brings the authentic flavors of Italy to your table.",
    "copyright": "Via Roma Pizzeria · Sofia, Bulgaria",
    "social": {
      "instagram": "https://instagram.com/viaromabulgaria",
      "facebook": "https://facebook.com/viaroma.bg",
      "tripadvisor": "https://tripadvisor.com/viaroma"
    }
  }'
)
ON CONFLICT (id) DO NOTHING;

-- Disable RLS for public access (no auth required for website)
ALTER TABLE menu_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE site_content DISABLE ROW LEVEL SECURITY;
ALTER TABLE news DISABLE ROW LEVEL SECURITY;
ALTER TABLE website_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings DISABLE ROW LEVEL SECURITY;
