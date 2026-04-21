import { useState, useRef } from "react";
import Header from "@/components/Header";
import Internships from "@/components/Internships";
import InternshipRecommendations from "@/components/InternshipRecommendations";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";

const InternshipsPage = () => {
  const [showAI, setShowAI] = useState(false);
  const aiSectionRef = useRef<HTMLDivElement>(null);

  const toggleAI = () => {
    const nextState = !showAI;
    setShowAI(nextState);

    if (nextState) {
      // Small delay to allow render before scroll
      setTimeout(() => {
        aiSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />

      {/* Standard Internships List First */}
      <div className="pt-12">
        <div className="container mx-auto px-4 flex flex-col items-center mb-8">
          <Button
            onClick={toggleAI}
            variant={showAI ? "outline" : "default"}
            size="lg"
            className={`rounded-full shadow-lg hover:shadow-xl transition-all duration-300 font-bold px-8 ${!showAI ? 'bg-gradient-to-r from-primary to-purple-600 hover:scale-105' : ''}`}
          >
            <Sparkles className="w-5 h-5 mr-2" />
            {showAI ? "Hide AI Recommendations" : "Get Personal AI Recommendations"}
            {showAI ? <ChevronUp className="ml-2 w-4 h-4" /> : <ChevronDown className="ml-2 w-4 h-4" />}
          </Button>
          {!showAI && (
            <p className="mt-4 text-sm text-muted-foreground animate-pulse">
              Not sure where to start? Let our AI match you to the best programs!
            </p>
          )}
        </div>

        <Internships showAll />
      </div>

      {/* AI Recommendations Section - Hidden by default */}
      {showAI && (
        <section ref={aiSectionRef} className="py-16 bg-gradient-to-br from-primary/5 via-background to-secondary/5 border-t border-primary/10 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-8">
              <Badge className="mb-4" variant="secondary">AI-Powered</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Find Your Perfect <span className="gradient-text-primary">Internship Match</span>
              </h2>
              <p className="text-muted-foreground">
                Our AI analyzes your skills and interests to recommend the best internship programs for you
              </p>
            </div>
            <div className="max-w-3xl mx-auto">
              <InternshipRecommendations />
            </div>
          </div>
        </section>
      )}

      <CTA />
      <Footer />
    </div>
  );
};

export default InternshipsPage;
