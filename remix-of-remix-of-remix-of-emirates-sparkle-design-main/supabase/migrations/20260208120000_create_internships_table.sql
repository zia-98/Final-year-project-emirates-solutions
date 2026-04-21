-- Create internships table
CREATE TABLE IF NOT EXISTS public.internships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    domain TEXT NOT NULL,
    description TEXT NOT NULL,
    required_skills TEXT[] DEFAULT '{}',
    min_education TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.internships ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE tablename = 'internships'
        AND policyname = 'Allow public read access to internships'
    ) THEN
        CREATE POLICY "Allow public read access to internships"
            ON public.internships
            FOR SELECT
            TO public
            USING (true);
    END IF;
END $$;

-- Seed with initial data
INSERT INTO public.internships (title, domain, description, required_skills, min_education)
VALUES
    (
        'Web Development Intern',
        'Software Development',
        'Build modern, responsive web applications using React, Node.js, and other cutting-edge technologies. You will work on real-world projects, collaborate with senior developers, and learn best practices in frontend and backend development.',
        ARRAY['JavaScript', 'React', 'Node.js', 'HTML', 'CSS', 'TypeScript', 'Tailwind'],
        'High School'
    ),
    (
        'Mobile App Development Intern',
        'Software Development',
        'Design and develop native and cross-platform mobile applications. Gain hands-on experience with Flutter, React Native, or Native Android/iOS development while contributing to high-impact mobile solutions.',
        ARRAY['Flutter', 'React Native', 'Dart', 'Kotlin', 'Swift', 'Mobile UI Design'],
        'Diploma'
    ),
    (
        'Data Science & AI/ML Intern',
        'Data & AI',
        'Dive into the world of Artificial Intelligence and Machine Learning. You will work on data preprocessing, model training, and deploying ML models to solve complex business problems using Python and standard libraries.',
        ARRAY['Python', 'Machine Learning', 'Deep Learning', 'TensorFlow', 'Pandas', 'NumPy', 'Scikit-learn'],
        'Bachelors'
    ),
    (
        'Cloud Computing Intern',
        'Infrastructure',
        'Assist in managing and deploying scalable cloud infrastructure. Learn about AWS/Azure services, containerization with Docker, and orchestration with Kubernetes in a DevOps environment.',
        ARRAY['AWS', 'Azure', 'Docker', 'Kubernetes', 'DevOps', 'Terraform', 'Linux'],
        'Bachelors'
    ),
    (
        'Cybersecurity Intern',
        'Security',
        'Protect digital assets by identifying vulnerabilities and implementing security measures. You will learn about network security, ethical hacking, and security protocols in a professional setting.',
        ARRAY['Network Security', 'Ethical Hacking', 'Linux', 'Penetration Testing', 'Cryptography', 'Python'],
        'Bachelors'
    ),
    (
        'Digital Marketing Intern',
        'Marketing',
        'Create and execute digital marketing strategies to drive engagement and growth. Work on social media campaigns, SEO optimization, and content creation for various platforms.',
        ARRAY['SEO', 'Social Media Marketing', 'Content Creation', 'Google Analytics', 'Copywriting', 'Branding'],
        'High School'
    ),
    (
        'UI/UX Design Intern',
        'Design',
        'Design intuitive and beautiful user interfaces. You will create wireframes, prototypes, and high-fidelity mockups while conducting user research to improve user experience.',
        ARRAY['Figma', 'Adobe XD', 'Prototyping', 'User Research', 'Wireframing', 'Visual Design'],
        'Diploma'
    ),
    (
        'Software Testing Intern',
        'Software Development',
        'Ensure software quality by writing and executing test cases. Learn manual and automated testing techniques to identify bugs and improve application stability.',
        ARRAY['Manual Testing', 'Selenium', 'Java', 'Python', 'Bug Tracking', 'QA Methodologies'],
        'Diploma'
    ),
    (
        'Data Analytics Intern',
        'Data & AI',
        'Analyze complex datasets to derive actionable insights. Create data visualizations and reports to help stakeholders make informed decisions.',
        ARRAY['SQL', 'Python', 'Power BI', 'Tableau', 'Excel', 'Data Visualization'],
        'Bachelors'
    );
