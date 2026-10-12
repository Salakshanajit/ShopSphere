-- ShopSphere sample data: 21 products in 6 categories.
-- Loaded automatically by "npm run db:init" when the products table is empty.
-- Image files live in client/public/products/ and are served by the React app.
-- Note: no users are created here. Create the first admin with "npm run create-admin".

USE shopsphere;

INSERT INTO products (name, description, price, category, image_url, stock, rating) VALUES
  ('Wireless Noise-Cancelling Headphones', 'Over-ear Bluetooth headphones with active noise cancellation, 30-hour battery life and a foldable, comfortable design for travel and study.', 4999.00, 'Electronics', '/products/wireless-headphones.svg', 25, 4.6),
  ('Smart Fitness Watch', 'AMOLED display smartwatch with heart-rate tracking, sleep monitoring, over 100 workout modes and a 7-day battery.', 3499.00, 'Electronics', '/products/smart-fitness-watch.svg', 40, 4.3),
  ('Portable Bluetooth Speaker', 'Waterproof pocket speaker with deep bass, 12-hour playtime and a built-in microphone for hands-free calls.', 1999.00, 'Electronics', '/products/bluetooth-speaker.svg', 60, 4.4),
  ('Mechanical Gaming Keyboard', 'Compact tenkeyless keyboard with tactile switches, RGB backlighting and a detachable USB-C cable.', 2799.00, 'Electronics', '/products/mechanical-keyboard.svg', 18, 4.5),
  ('20000mAh Power Bank', 'High-capacity power bank with fast charging, dual USB ports and USB-C input for phones, tablets and earbuds.', 1499.00, 'Electronics', '/products/power-bank.svg', 80, 4.2),
  ('Classic Denim Jacket', 'Medium-wash denim jacket with a relaxed fit, metal buttons and two chest pockets. Pairs with almost anything.', 2299.00, 'Fashion', '/products/denim-jacket.svg', 30, 4.1),
  ('Everyday Running Sneakers', 'Lightweight breathable sneakers with a cushioned sole and non-slip grip, made for daily runs and long walks.', 3199.00, 'Fashion', '/products/running-sneakers.svg', 45, 4.5),
  ('Canvas Laptop Backpack', 'Water-resistant backpack with a padded 15.6 inch laptop sleeve, organiser pockets and adjustable shoulder straps.', 1799.00, 'Fashion', '/products/laptop-backpack.svg', 55, 4.4),
  ('Polarized Aviator Sunglasses', 'Classic metal-frame aviators with polarized UV400 lenses that cut glare and protect your eyes.', 999.00, 'Fashion', '/products/aviator-sunglasses.svg', 70, 4.0),
  ('Ceramic Coffee Mug Set (4 pcs)', 'Set of four 300 ml glazed ceramic mugs, microwave and dishwasher safe, in soft matte colours.', 899.00, 'Home & Kitchen', '/products/coffee-mug-set.svg', 35, 4.3),
  ('Non-Stick Frying Pan 28 cm', 'Heavy-base aluminium frying pan with a durable non-stick coating and a heat-resistant handle.', 1299.00, 'Home & Kitchen', '/products/frying-pan.svg', 28, 4.4),
  ('Scented Soy Candle', 'Hand-poured soy wax candle in a glass jar with a calming lavender and vanilla scent. Burns for about 40 hours.', 499.00, 'Home & Kitchen', '/products/soy-candle.svg', 0, 4.7),
  ('Cotton Bedsheet Set', 'Soft 100 percent cotton double bedsheet with two pillow covers. Breathable, fade-resistant and easy to wash.', 1599.00, 'Home & Kitchen', '/products/bedsheet-set.svg', 22, 4.2),
  ('JavaScript for Beginners', 'A friendly step-by-step guide to JavaScript with practical exercises, from variables and functions to building small web projects.', 599.00, 'Books', '/products/javascript-book.svg', 50, 4.6),
  ('Undated Productivity Planner', 'Hardcover planner with daily, weekly and monthly layouts, habit trackers and thick paper that resists ink bleed.', 349.00, 'Books', '/products/productivity-planner.svg', 90, 4.3),
  ('Home Cooking Recipe Book', 'Over 150 easy weeknight recipes with photographs, ingredient lists and simple meal-planning tips.', 449.00, 'Books', '/products/recipe-book.svg', 33, 4.5),
  ('Non-Slip Yoga Mat', 'Six millimetre thick eco-friendly mat with a textured non-slip surface and a carrying strap.', 799.00, 'Sports', '/products/yoga-mat.svg', 65, 4.4),
  ('Insulated Steel Water Bottle', 'One litre double-wall stainless steel bottle that keeps drinks cold for 24 hours or hot for 12 hours.', 649.00, 'Sports', '/products/steel-bottle.svg', 100, 4.5),
  ('Badminton Racket Pair', 'Two lightweight graphite-aluminium rackets with a padded grip, three shuttlecocks and a zip carry bag.', 1199.00, 'Sports', '/products/badminton-rackets.svg', 6, 4.1),
  ('Herbal Face Wash', 'Gentle daily face wash with neem and aloe vera that cleans without drying the skin. Suitable for all skin types.', 299.00, 'Beauty', '/products/face-wash.svg', 120, 4.2),
  ('Vitamin C Face Serum', 'Lightweight serum with 10 percent vitamin C and hyaluronic acid to brighten the skin and keep it hydrated.', 699.00, 'Beauty', '/products/vitamin-c-serum.svg', 3, 4.6);
