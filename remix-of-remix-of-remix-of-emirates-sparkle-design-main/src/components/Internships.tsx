import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Users, Award, DollarSign } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import internshipBg from "@/assets/internship-bg.jpg";

export type InternshipType = "paid" | "unpaid" | "stipend" | "Full-time" | "Part-time" | "Remote";

export interface Internship {
  id: string;
  title: string;
  level?: string;
  duration: string;
  topics?: string[];
  skills_required?: string[];
  spots: string;
  available_slots?: number;
  total_slots?: number;
  type: string;
  stipend?: string;
  training_fee?: string;
  location?: string;
}


const typeConfig: Record<string, { label: string; color: string; icon: typeof DollarSign }> = {
  Paid: { label: "Paid", color: "bg-green-500/10 text-green-600 border-green-200", icon: DollarSign },
  Unpaid: { label: "Unpaid", color: "bg-gray-500/10 text-gray-600 border-gray-200", icon: Users },
  Stipend: { label: "Stipend", color: "bg-blue-500/10 text-blue-600 border-blue-200", icon: DollarSign },
  paid: { label: "Paid", color: "bg-green-500/10 text-green-600 border-green-200", icon: DollarSign },
  unpaid: { label: "Unpaid", color: "bg-gray-500/10 text-gray-600 border-gray-200", icon: Users },
  stipend: { label: "Stipend", color: "bg-blue-500/10 text-blue-600 border-blue-200", icon: DollarSign },
};

interface InternshipsProps {
  showAll?: boolean;
}

const Internships = ({ showAll = false }: InternshipsProps) => {
  const [activeTab, setActiveTab] = useState("all");
  const [internshipData, setInternshipData] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInternships = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("internships")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching internships:", error);
      } else {
        setInternshipData(data as any || []);
      }
      setLoading(false);
    };

    fetchInternships();
  }, []);

  const filteredInternships = activeTab === "all" 
    ? internshipData 
    : internshipData.filter(i => i.type?.toLowerCase() === activeTab.toLowerCase());

  const displayedInternships = showAll ? filteredInternships : filteredInternships.slice(0, 4);

  return (
    <section id="internships" className="py-24 relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 opacity-5 bg-cover bg-center"
        style={{ backgroundImage: `url(${internshipBg})` }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-b from-background/90 to-background"></div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 animate-fade-in">
          <Badge className="mb-4">Career Development</Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Launch Your <span className="gradient-text-secondary">Tech Career</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Industry-focused internship programs with hands-on training and real-world projects
          </p>
        </div>

        {/* Tabs Filter */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-2xl mx-auto mb-12">
          <TabsList className="grid w-full grid-cols-4 glass">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="paid">Paid</TabsTrigger>
            <TabsTrigger value="unpaid">Unpaid</TabsTrigger>
            <TabsTrigger value="stipend">Stipend</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Internships Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {loading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="glass p-6 rounded-2xl h-64 animate-pulse"></div>
            ))
          ) : displayedInternships.length > 0 ? (
            displayedInternships.map((internship, idx) => {
              const typeInfo = typeConfig[internship.type] || typeConfig.unpaid;
              const skills = internship.skills_required || internship.topics || [];
              
              return (
                <div
                  key={internship.id}
                  className="glass p-6 rounded-2xl hover:shadow-lg transition-all duration-300 hover:-translate-y-2 group animate-scale-in"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="text-xs">{internship.level || "Beginner"}</Badge>
                      <Badge className={`text-xs ${typeInfo.color}`}>{typeInfo.label}</Badge>
                      {internship.available_slots === 0 && (
                        <Badge variant="destructive" className="text-xs">Not Available</Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1 mb-2">
                    <span className="text-xs font-medium text-primary block">
                      {internship.available_slots !== undefined 
                        ? `${internship.available_slots} Slots Remaining` 
                        : internship.spots || "Flexible"}
                    </span>
                    {internship.available_slots !== undefined && internship.available_slots <= 3 && internship.available_slots > 0 && (
                      <span className="text-[10px] text-red-500 font-bold animate-pulse">
                        ⚠️ Low Stock: Filling Fast!
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-semibold mb-3 group-hover:text-primary transition-colors">
                    {internship.title}
                  </h3>
                  
                  <div className="flex flex-col gap-1 mb-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{internship.duration}</span>
                    </div>
                    {internship.type === "Paid" && internship.training_fee && (
                      <div className="flex items-center gap-2 text-green-600 font-medium">
                        <DollarSign className="w-4 h-4" />
                        <span>Fee: {internship.training_fee}</span>
                      </div>
                    )}
                    {internship.type === "Stipend" && internship.stipend && (
                      <div className="flex items-center gap-2 text-blue-600 font-medium">
                        <DollarSign className="w-4 h-4" />
                        <span>Stipend: {internship.stipend}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {skills.slice(0, 2).map((topic, i) => (
                      <span key={i} className="text-xs px-2 py-1 bg-muted rounded-md">
                        {topic}
                      </span>
                    ))}
                    {skills.length > 2 && (
                      <span className="text-xs px-2 py-1 bg-muted rounded-md">
                        +{skills.length - 2}
                      </span>
                    )}
                  </div>

                  <Button 
                    size="sm" 
                    className="w-full group/btn" 
                    variant={internship.available_slots === 0 ? "ghost" : "outline"}
                    asChild={internship.available_slots !== 0}
                    disabled={internship.available_slots === 0}
                  >
                    {internship.available_slots === 0 ? (
                      <span className="text-muted-foreground flex items-center gap-2">
                         Closed for Applications
                      </span>
                    ) : (
                      <Link to={`/internships/apply?program=${internship.id}`}>
                        Apply Now
                        <span className="inline-block transition-transform group-hover/btn:translate-x-1 ml-1">→</span>
                      </Link>
                    )}
                  </Button>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">No internships available at the moment.</p>
            </div>
          )}
        </div>

        {/* View All Button - only show on homepage */}
        {!showAll && (
          <div className="text-center mb-12">
            <Button variant="outline" size="lg" asChild>
              <Link to="/internships">View All Internships</Link>
            </Button>
          </div>
        )}

        {/* Benefits Section */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            { icon: Award, title: "Industry Certification", desc: "Get certified upon completion" },
            { icon: Users, title: "Expert Mentors", desc: "Learn from industry professionals" },
            { icon: Clock, title: "Flexible Schedule", desc: "Weekend & evening batches" },
          ].map((benefit, idx) => (
            <div key={idx} className="text-center p-6 glass rounded-xl">
              <benefit.icon className="w-10 h-10 mx-auto mb-3 text-primary" />
              <h4 className="font-semibold mb-2">{benefit.title}</h4>
              <p className="text-sm text-muted-foreground">{benefit.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Internships;
