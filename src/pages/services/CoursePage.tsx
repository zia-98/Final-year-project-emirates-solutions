import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, Code, Database, Cloud, Shield, Users, 
  Calendar, Clock, Award, CheckCircle, ArrowLeft,
  User, Phone, Mail
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const coursesData: Record<string, {
  id: string;
  name: string;
  description: string;
  duration: string;
  icon: React.ComponentType<{ className?: string }>;
  price: number;
  topics: string[];
  prerequisites: string[];
  outcomes: string[];
  schedule: string;
  batchSize: number;
}> = {
  "web-development": {
    id: "web-development",
    name: "Web Development",
    description: "Master modern web development with HTML, CSS, JavaScript, React, and Node.js. Build responsive, dynamic web applications from scratch.",
    duration: "12 weeks",
    icon: Code,
    price: 15000,
    topics: [
      "HTML5 & CSS3 Fundamentals",
      "JavaScript ES6+ & TypeScript",
      "React.js with Hooks & Context",
      "Node.js & Express.js",
      "MongoDB & SQL Databases",
      "RESTful API Development",
      "Git Version Control",
      "Deployment & DevOps Basics"
    ],
    prerequisites: ["Basic computer skills", "Logical thinking ability"],
    outcomes: [
      "Build full-stack web applications",
      "Create responsive user interfaces",
      "Develop RESTful APIs",
      "Deploy applications to cloud"
    ],
    schedule: "Weekends (Sat-Sun, 10 AM - 1 PM)",
    batchSize: 15
  },
  "data-science": {
    id: "data-science",
    name: "Data Science",
    description: "Learn Python, SQL, Machine Learning basics, and data visualization. Analyze data and build predictive models.",
    duration: "16 weeks",
    icon: Database,
    price: 20000,
    topics: [
      "Python Programming",
      "NumPy & Pandas",
      "Data Visualization with Matplotlib",
      "SQL & Database Management",
      "Statistics & Probability",
      "Machine Learning Algorithms",
      "Scikit-learn & TensorFlow",
      "Real-world Projects"
    ],
    prerequisites: ["Basic math skills", "Computer literacy"],
    outcomes: [
      "Analyze and visualize data",
      "Build machine learning models",
      "Work with large datasets",
      "Create data-driven insights"
    ],
    schedule: "Weekdays (Mon-Wed-Fri, 6 PM - 8 PM)",
    batchSize: 12
  },
  "cloud-computing": {
    id: "cloud-computing",
    name: "Cloud Computing",
    description: "Get certified in AWS, Azure, and Google Cloud. Learn cloud architecture, deployment, and management.",
    duration: "8 weeks",
    icon: Cloud,
    price: 18000,
    topics: [
      "Cloud Computing Fundamentals",
      "AWS Core Services",
      "Azure Administration",
      "Google Cloud Platform",
      "Cloud Security",
      "Container & Kubernetes",
      "Serverless Architecture",
      "Cost Optimization"
    ],
    prerequisites: ["Basic IT knowledge", "Networking fundamentals"],
    outcomes: [
      "Deploy cloud infrastructure",
      "Manage cloud services",
      "Implement cloud security",
      "Prepare for certification exams"
    ],
    schedule: "Weekends (Sat-Sun, 2 PM - 5 PM)",
    batchSize: 20
  },
  "cybersecurity": {
    id: "cybersecurity",
    name: "Cybersecurity",
    description: "Learn network security, ethical hacking, and security best practices. Protect systems from cyber threats.",
    duration: "10 weeks",
    icon: Shield,
    price: 22000,
    topics: [
      "Network Security Fundamentals",
      "Ethical Hacking Techniques",
      "Penetration Testing",
      "Security Tools & Frameworks",
      "Incident Response",
      "Cryptography",
      "Compliance & Regulations",
      "Security Audit"
    ],
    prerequisites: ["Networking knowledge", "Linux basics"],
    outcomes: [
      "Identify security vulnerabilities",
      "Perform penetration testing",
      "Implement security measures",
      "Handle security incidents"
    ],
    schedule: "Weekdays (Tue-Thu, 7 PM - 9 PM)",
    batchSize: 10
  },
  "it-project-management": {
    id: "it-project-management",
    name: "IT Project Management",
    description: "Master Agile, Scrum, and prepare for PMP certification. Lead IT projects effectively.",
    duration: "6 weeks",
    icon: Users,
    price: 12000,
    topics: [
      "Project Management Basics",
      "Agile Methodology",
      "Scrum Framework",
      "Sprint Planning",
      "Risk Management",
      "Stakeholder Communication",
      "Project Tools (Jira, Trello)",
      "PMP Exam Preparation"
    ],
    prerequisites: ["Work experience preferred", "Basic IT understanding"],
    outcomes: [
      "Lead agile projects",
      "Manage project teams",
      "Handle project risks",
      "Prepare for PMP certification"
    ],
    schedule: "Weekends (Saturday, 10 AM - 4 PM)",
    batchSize: 25
  },
  "microsoft-office": {
    id: "microsoft-office",
    name: "Microsoft Office",
    description: "Advanced training in Excel, PowerPoint, and Word. Boost your productivity with professional office skills.",
    duration: "4 weeks",
    icon: BookOpen,
    price: 5000,
    topics: [
      "Advanced Excel Functions",
      "Pivot Tables & Charts",
      "VBA Macros",
      "PowerPoint Presentations",
      "Word Document Formatting",
      "Mail Merge",
      "Data Analysis Tools",
      "Productivity Tips"
    ],
    prerequisites: ["Basic computer skills"],
    outcomes: [
      "Create complex spreadsheets",
      "Build professional presentations",
      "Automate tasks with macros",
      "Manage documents efficiently"
    ],
    schedule: "Weekdays (Mon-Wed-Fri, 5 PM - 7 PM)",
    batchSize: 30
  }
};

const CoursePage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const course = courseId ? coursesData[courseId] : null;
  
  const [enrolling, setEnrolling] = useState(false);
  const [showEnrollForm, setShowEnrollForm] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
  });

  if (!course) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Course Not Found</h1>
          <Button asChild>
            <Link to="/services/professional-training">Back to Training Programs</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const IconComponent = course.icon;

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Please sign in to enroll in courses");
      navigate("/auth");
      return;
    }

    setEnrolling(true);

    try {
      const { error } = await supabase.from("course_enrollments").insert({
        user_id: user.id,
        course_id: course.id,
        course_name: course.name,
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
      });

      if (error) throw error;

      toast.success("Enrollment successful! We'll contact you shortly.");
      setShowEnrollForm(false);
      setFormData({ fullName: "", email: "", phone: "" });
    } catch (error: any) {
      console.error("Enrollment error:", error);
      toast.error("Failed to enroll. Please try again.");
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-secondary/10 to-background">
        <div className="container mx-auto px-4">
          <Link 
            to="/services/professional-training" 
            className="inline-flex items-center gap-2 text-primary hover:underline mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Training Programs
          </Link>
          
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl gradient-secondary flex items-center justify-center shadow-lg">
                  <IconComponent className="w-8 h-8 text-white" />
                </div>
                <Badge variant="secondary" className="text-sm">
                  <Calendar className="w-3 h-3 mr-1" />
                  {course.duration}
                </Badge>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                {course.name}
              </h1>
              
              <p className="text-xl text-muted-foreground mb-8">
                {course.description}
              </p>
              
              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-5 h-5" />
                  <span>{course.schedule}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-5 h-5" />
                  <span>Batch Size: {course.batchSize}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold text-primary">
                  ₹{course.price.toLocaleString("en-IN")}
                </div>
                <Button 
                  size="lg" 
                  className="gradient-primary shadow-glow"
                  onClick={() => setShowEnrollForm(true)}
                >
                  Enroll Now
                </Button>
              </div>
            </div>

            {/* Enrollment Form */}
            {showEnrollForm && (
              <Card className="sticky top-24">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4">Enroll in {course.name}</h3>
                  <form onSubmit={handleEnroll} className="space-y-4">
                    <div>
                      <Label htmlFor="fullName">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="fullName"
                          required
                          className="pl-10"
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          required
                          className="pl-10"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          type="tel"
                          required
                          className="pl-10"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1" disabled={enrolling}>
                        {enrolling ? "Enrolling..." : "Submit Enrollment"}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => setShowEnrollForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* Course Details */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Topics */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold mb-6">What You'll Learn</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {course.topics.map((topic, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>{topic}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Prerequisites */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold mb-4">Prerequisites</h3>
                  <ul className="space-y-2">
                    {course.prerequisites.map((prereq, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {prereq}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Outcomes */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary" />
                    Learning Outcomes
                  </h3>
                  <ul className="space-y-2">
                    {course.outcomes.map((outcome, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        {outcome}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CoursePage;
