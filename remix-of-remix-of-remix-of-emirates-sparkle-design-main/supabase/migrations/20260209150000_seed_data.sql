-- Insert Internships
INSERT INTO public.internships (title, domain, description, required_skills, min_education)
VALUES 
('Frontend Developer Intern', 'Software Development', 'Work on our main product dashboard using React.', ARRAY['React', 'TypeScript', 'Tailwind'], 'Bachelors'),
('Marketing Specialist Intern', 'Marketing', 'Manage social media campaigns and SEO.', ARRAY['Social Media', 'SEO', 'Content Writing'], 'High School'),
('Data Analyst Intern', 'Data & AI', 'Analyze user behavior data and create reports.', ARRAY['SQL', 'Python', 'Tableau'], 'Bachelors')
ON CONFLICT DO NOTHING;

-- Insert Products
INSERT INTO public.products (name, description, price, category, stock, is_featured, is_new)
VALUES
('Pro Coding Laptop', 'High performance laptop for developers', 4500.00, 'Electronics', 15, true, true),
('Wireless Noise Cancelling Headphones', 'Focus on your code with silence', 850.00, 'Accessories', 50, true, false),
('Ergonomic Chair', 'Comfort for long coding sessions', 1200.00, 'Furniture', 10, false, false),
('Mechanical Keyboard', 'Clicky keys for satisfaction', 450.00, 'Accessories', 30, false, true),
('4K Monitor 27"', 'Crystal clear display', 1800.00, 'Electronics', 20, true, false)
ON CONFLICT DO NOTHING;

-- Insert Course Enrollments
INSERT INTO public.course_enrollments (full_name, email, phone, course_id, course_name, status)
VALUES
('Ahmed Al-Farsi', 'ahmed.farsi@example.com', '+971501234567', 'c-101', 'Intro to Web Development', 'confirmed'),
('Sarah Jones', 'sarah.j@example.com', '+971509876543', 'c-102', 'Advanced Python Masterclass', 'pending'),
('Fatima Ali', 'fatima.ali@example.com', '+971551122334', 'c-103', 'Digital Marketing 101', 'completed'),
('John Doe', 'john.doe@example.com', '+971563344556', 'c-101', 'Intro to Web Development', 'cancelled'),
('Maria Rodriguez', 'maria.r@example.com', '+971527788990', 'c-104', 'Data Science Bootcamp', 'confirmed')
ON CONFLICT DO NOTHING;

-- Insert Internship Applications
INSERT INTO public.internship_applications (full_name, email, phone, program_id, preferred_type, education, availability, motivation, status)
VALUES
('John Smith', 'john.smith@example.com', '+971501112222', 'frontend-dev-intern', 'full-time', 'bachelors', 'Immediate', 'I am passionate about React.', 'pending'),
('Jane Doe', 'jane.doe@example.com', '+971503334444', 'data-science-intern', 'part-time', 'masters', 'Next month', 'I love data analysis.', 'reviewing'),
('Ali Hassan', 'ali.hassan@example.com', '+971505556666', 'marketing-intern', 'remote', 'high-school', 'Immediate', 'Marketing is my life.', 'accepted')
ON CONFLICT DO NOTHING;

-- Insert Newsletter Subscriptions
INSERT INTO public.newsletter_subscriptions (email, is_active)
VALUES
('subscriber1@example.com', true),
('subscriber2@test.com', true),
('unsubscribed@example.com', false),
('new.user@domain.com', true),
('tech.enthusiast@mail.com', true)
ON CONFLICT DO NOTHING;
