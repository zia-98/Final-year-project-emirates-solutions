-- Fix Internships Data Migration (Corrected Skills)
-- Truncate existing data to remove duplicates or bad data
TRUNCATE TABLE public.internships;

-- Also clear history as previous entries had bad data/matching (optional but recommended for clean slate)
TRUNCATE TABLE public.recommendation_history;

-- Seed with correct data using CSV Titles but REAL Matchable Skills
INSERT INTO public.internships (title, domain, description, required_skills, min_education)
VALUES
    (
        'Software Testing Intern',
        'Software Development',
        'Join our team as a Software Testing Intern. You will work on real-world projects, write test cases, and ensure software quality using manual and automated testing tools.',
        ARRAY['Manual Testing', 'Selenium', 'Java', 'Python', 'Bug Tracking', 'QA Methodologies', 'JIRA', 'Test Automation'],
        'High School'
    ),
    (
        'Cybersecurity Intern',
        'Security',
        'Join our team as a Cybersecurity Intern. Protect digital assets by identifying vulnerabilities, performing penetration testing, and implementing security protocols.',
        ARRAY['Network Security', 'Ethical Hacking', 'Linux', 'Penetration Testing', 'Cryptography', 'Python', 'Wireshark', 'Firewalls'],
        'Bachelors'
    ),
    (
        'Web Development Intern',
        'Software Development',
        'Join our team as a Web Development Intern. Build modern, responsive web applications using the latest frontend and backend technologies.',
        ARRAY['JavaScript', 'React', 'Node.js', 'HTML', 'CSS', 'TypeScript', 'Tailwind', 'Git', 'REST APIs'],
        'High School'
    ),
    (
        'Digital Marketing Intern',
        'Marketing',
        'Join our team as a Digital Marketing Intern. Create engaging content, manage social media campaigns, and optimize websites for search engines.',
        ARRAY['SEO', 'Social Media Marketing', 'Content Creation', 'Google Analytics', 'Copywriting', 'Branding', 'Email Marketing', 'PPC'],
        'High School'
    ),
    (
        'Data Analytics Intern',
        'Data & AI',
        'Join our team as a Data Analytics Intern. Analyze complex datasets to derive actionable insights and create compelling data visualizations.',
        ARRAY['SQL', 'Python', 'Power BI', 'Tableau', 'Excel', 'Data Visualization', 'Statistics', 'R'],
        'Bachelors'
    ),
    (
        'AI/ML Intern',
        'Data & AI',
        'Join our team as a AI/ML Intern. Develop and train machine learning models to solve real-world problems using Python and deep learning frameworks.',
        ARRAY['Python', 'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'Computer Vision', 'NLP'],
        'Bachelors'
    ),
    (
        'Cloud Computing Intern',
        'Infrastructure',
        'Join our team as a Cloud Computing Intern. Assist in managing scalable cloud infrastructure and implementing DevOps practices.',
        ARRAY['AWS', 'Azure', 'Docker', 'Kubernetes', 'DevOps', 'Terraform', 'Linux', 'Google Cloud', 'CI/CD'],
        'Bachelors'
    );
