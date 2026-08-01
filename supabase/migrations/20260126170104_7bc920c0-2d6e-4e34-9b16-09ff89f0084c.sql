-- Add shop_type to products table to distinguish between different shops
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS shop_type text DEFAULT 'opal' CHECK (shop_type IN ('opal', 'hardware', 'it-products'));

-- Create an index for faster filtering by shop_type
CREATE INDEX IF NOT EXISTS idx_products_shop_type ON public.products (shop_type);

-- Insert sample hardware products
INSERT INTO public.products (name, description, category, price, original_price, stock, images, is_featured, is_new, is_sale, shop_type) VALUES
-- Printers & Plotters
('HP LaserJet Pro MFP M428fdw', 'All-in-one wireless laser printer with duplex printing, scanning, and fax. Ideal for small businesses.', 'Printers & Plotters', 34999, 42999, 15, ARRAY['https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=400'], true, false, true, 'hardware'),
('Canon imagePROGRAF TM-300', 'Professional 36" large format plotter for CAD, GIS, and poster printing with 5-color pigment ink.', 'Printers & Plotters', 189999, NULL, 5, ARRAY['https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?w=400'], true, true, false, 'hardware'),
('Epson EcoTank L3250', 'High-capacity ink tank printer with wireless connectivity. Ultra-low cost per page printing.', 'Printers & Plotters', 15999, 18999, 25, ARRAY['https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=400'], false, false, true, 'hardware'),

-- CCTV Systems
('Hikvision 8-Channel DVR Kit', 'Complete 8-channel DVR with 4 bullet cameras, 2TB HDD, and cables. 1080p Full HD recording.', 'CCTV Systems', 45999, 54999, 12, ARRAY['https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=400'], true, false, true, 'hardware'),
('Dahua 4MP IP Camera', 'Outdoor bullet camera with night vision, motion detection, and IP67 weatherproof rating.', 'CCTV Systems', 8999, NULL, 30, ARRAY['https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=400'], false, true, false, 'hardware'),
('CP Plus 16-Channel NVR', 'Enterprise-grade NVR with 16 PoE ports, 4K recording, and AI-powered analytics.', 'CCTV Systems', 89999, 99999, 8, ARRAY['https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=400'], true, false, true, 'hardware'),

-- Networking Equipment
('Cisco Catalyst 2960-X Switch', '24-port Gigabit Ethernet switch with PoE+ support. Enterprise-grade performance.', 'Networking', 125999, NULL, 10, ARRAY['https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400'], true, false, false, 'hardware'),
('Ubiquiti UniFi AC Pro', 'High-performance dual-band access point with 1750 Mbps throughput. Indoor/outdoor use.', 'Networking', 12999, 15999, 20, ARRAY['https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400'], false, true, true, 'hardware'),
('TP-Link Archer AX6000', 'Next-gen WiFi 6 router with 8-stream connectivity and 4804 Mbps speeds.', 'Networking', 24999, 29999, 18, ARRAY['https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400'], false, false, true, 'hardware'),

-- Servers & Storage
('Dell PowerEdge T40 Server', 'Entry-level tower server with Intel Xeon E-2224G, 8GB RAM, 1TB HDD. Perfect for SMBs.', 'Servers & Storage', 75999, 89999, 6, ARRAY['https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400'], true, false, true, 'hardware'),
('Synology DS920+ NAS', '4-bay NAS with Intel Celeron, 4GB RAM, and dual M.2 SSD slots for caching.', 'Servers & Storage', 52999, NULL, 10, ARRAY['https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400'], true, true, false, 'hardware'),
('WD Red Plus 4TB NAS HDD', 'Designed for NAS systems with 24/7 operation. CMR technology for reliability.', 'Servers & Storage', 12999, 14999, 40, ARRAY['https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=400'], false, false, true, 'hardware'),

-- Security Systems
('ZKTeco K40 Biometric', 'Fingerprint time attendance terminal with built-in battery backup. 1000 fingerprint capacity.', 'Security Systems', 8999, NULL, 25, ARRAY['https://images.unsplash.com/photo-1558002038-1055907df827?w=400'], false, true, false, 'hardware'),
('HID iCLASS SE Reader', 'Smart card reader for access control. Supports iCLASS, SEOS, and mobile credentials.', 'Security Systems', 15999, 18999, 15, ARRAY['https://images.unsplash.com/photo-1558002038-1055907df827?w=400'], true, false, true, 'hardware'),

-- Communication
('Yealink T46U IP Phone', 'High-end business IP phone with 4.3" color display and dual USB ports.', 'Communication', 18999, NULL, 20, ARRAY['https://images.unsplash.com/photo-1596524430615-b46475ddff6e?w=400'], true, true, false, 'hardware'),
('Poly Studio X30 Video Bar', 'All-in-one video conferencing bar with 4K camera, microphone, and speakers.', 'Communication', 145999, 165999, 5, ARRAY['https://images.unsplash.com/photo-1596524430615-b46475ddff6e?w=400'], true, false, true, 'hardware'),

-- Insert sample IT Products
-- Monitors & Displays
('Dell UltraSharp U2722D', '27" 4K IPS monitor with USB-C hub, 100% sRGB. Perfect for professionals.', 'Monitors & Displays', 45999, 52999, 12, ARRAY['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400'], true, false, true, 'it-products'),
('LG 27GP950-B Gaming Monitor', '27" 4K Nano IPS with 144Hz refresh rate and HDMI 2.1. Ultimate gaming display.', 'Monitors & Displays', 78999, NULL, 8, ARRAY['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400'], true, true, false, 'it-products'),
('Samsung Odyssey G9', '49" Curved QLED gaming monitor with 240Hz refresh and 1ms response time.', 'Monitors & Displays', 135999, 159999, 4, ARRAY['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400'], true, false, true, 'it-products'),

-- Processors & CPUs
('Intel Core i9-13900K', '24-core desktop processor with up to 5.8GHz boost. Unlocked for overclocking.', 'Processors & CPUs', 52999, 59999, 15, ARRAY['https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=400'], true, false, true, 'it-products'),
('AMD Ryzen 9 7950X', '16-core processor with Zen 4 architecture. Fastest consumer desktop CPU.', 'Processors & CPUs', 48999, NULL, 10, ARRAY['https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=400'], true, true, false, 'it-products'),
('Intel Core i5-13600K', '14-core mid-range powerhouse. Best value for gaming and productivity.', 'Processors & CPUs', 28999, 32999, 20, ARRAY['https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=400'], false, false, true, 'it-products'),

-- Storage Solutions
('Samsung 990 Pro 2TB SSD', 'PCIe 4.0 NVMe SSD with 7450 MB/s read speeds. Heatsink included.', 'Storage Solutions', 18999, 22999, 25, ARRAY['https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=400'], true, false, true, 'it-products'),
('WD Black SN850X 1TB', 'High-performance gaming SSD with 7300 MB/s reads. PS5 compatible.', 'Storage Solutions', 11999, NULL, 30, ARRAY['https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=400'], false, true, false, 'it-products'),
('Seagate Exos X18 16TB', 'Enterprise-class HDD for data centers. 7200 RPM with 5-year warranty.', 'Storage Solutions', 32999, 38999, 12, ARRAY['https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=400'], true, false, true, 'it-products'),

-- Keyboards
('Keychron Q1 Pro', 'Premium QMK/VIA wireless mechanical keyboard with hot-swappable switches.', 'Keyboards', 18999, NULL, 15, ARRAY['https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=400'], true, true, false, 'it-products'),
('Logitech MX Keys S', 'Advanced wireless illuminated keyboard with smart backlighting and palm rest.', 'Keyboards', 14999, 16999, 20, ARRAY['https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=400'], false, false, true, 'it-products'),
('Corsair K100 RGB', 'Flagship gaming keyboard with optical-mechanical switches and iCUE control.', 'Keyboards', 21999, 24999, 10, ARRAY['https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=400'], true, false, true, 'it-products'),

-- Mice & Peripherals
('Logitech MX Master 3S', 'Premium wireless mouse with MagSpeed scrolling and 8K DPI sensor.', 'Mice & Peripherals', 9999, 11999, 25, ARRAY['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400'], true, false, true, 'it-products'),
('Razer DeathAdder V3 Pro', 'Ultra-lightweight wireless gaming mouse with Focus Pro 30K sensor.', 'Mice & Peripherals', 14999, NULL, 18, ARRAY['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400'], true, true, false, 'it-products'),
('Elgato Stream Deck MK.2', '15 LCD key controller for streamers and content creators. Customizable actions.', 'Mice & Peripherals', 14999, 17999, 12, ARRAY['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400'], false, false, true, 'it-products'),

-- Complete Systems
('Custom Gaming PC - RTX 4070', 'Pre-built gaming PC with i7-13700F, RTX 4070, 32GB RAM, 1TB NVMe. VR-ready.', 'Complete Systems', 145999, 165999, 5, ARRAY['https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400'], true, false, true, 'it-products'),
('HP Z4 G5 Workstation', 'Professional workstation with Intel Xeon, NVIDIA RTX A4000, 64GB ECC RAM.', 'Complete Systems', 325999, NULL, 3, ARRAY['https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400'], true, true, false, 'it-products'),
('Lenovo ThinkCentre M90q', 'Tiny desktop PC with i7-13700T, 16GB RAM, 512GB SSD. Ultra-compact design.', 'Complete Systems', 78999, 89999, 8, ARRAY['https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400'], false, false, true, 'it-products');