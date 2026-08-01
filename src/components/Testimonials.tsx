import { useState } from "react";
import { ChevronLeft, ChevronRight, Star, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const testimonials = [
    {
      name: "Ahmed Al Mansoori",
      role: "CEO, Tech Innovations LLC",
      rating: 5,
      text: "Emirates Solutions transformed our IT infrastructure completely. Their AMC service has been exceptional, and the team is always responsive. Highly recommended!",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed"
    },
    {
      name: "Fatima Hassan",
      role: "Full Stack Developer",
      rating: 5,
      text: "The internship program gave me real-world experience that landed me my dream job. The mentors were incredibly supportive and knowledgeable.",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Fatima"
    },
    {
      name: "Mohammed Rahman",
      role: "Operations Manager, Retail Chain",
      rating: 5,
      text: "We purchased all our CCTV systems and networking equipment from Emirates Solutions. Professional service, competitive prices, and excellent after-sales support.",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mohammed"
    },
    {
      name: "Sara Abdullah",
      role: "Android Developer",
      rating: 5,
      text: "Best decision to join their Android internship! The hands-on projects and industry exposure prepared me perfectly for my career.",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sara"
    },
    {
      name: "Omar Khalid",
      role: "IT Manager, Construction Co.",
      rating: 5,
      text: "Their software licensing service saved us both time and money. Genuine products, transparent pricing, and smooth procurement process.",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Omar"
    },
  ];

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const current = testimonials[currentIndex];

  return (
    <section id="testimonials" className="py-24 bg-gradient-to-br from-muted/30 to-background relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-10 right-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 left-10 w-64 h-64 bg-secondary/10 rounded-full blur-3xl"></div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            What Our <span className="gradient-text-primary">Clients Say</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Don't just take our word for it - hear from our satisfied clients and successful interns
          </p>
        </div>

        {/* Testimonial Slider */}
        <div className="max-w-4xl mx-auto">
          <div className="glass p-8 md:p-12 rounded-3xl relative animate-scale-in">
            {/* Stars */}
            <div className="flex justify-center gap-1 mb-6">
              {[...Array(current.rating)].map((_, i) => (
                <Star key={i} className="w-6 h-6 fill-primary text-primary" />
              ))}
            </div>

            {/* Quote */}
            <blockquote className="text-xl md:text-2xl text-center mb-8 leading-relaxed text-foreground">
              "{current.text}"
            </blockquote>

            {/* Author Info */}
            <div className="flex items-center justify-center gap-4">
              <img 
                src={current.image} 
                alt={current.name}
                className="w-16 h-16 rounded-full border-4 border-primary/20"
              />
              <div className="text-left">
                <div className="font-semibold text-lg text-foreground">{current.name}</div>
                <div className="text-sm text-muted-foreground">{current.role}</div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <Button
                variant="outline"
                size="icon"
                onClick={prev}
                className="rounded-full"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              
              <div className="flex gap-2">
                {testimonials.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === currentIndex ? "bg-primary w-8" : "bg-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={next}
                className="rounded-full"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-8">
            <Button variant="outline" className="group" asChild>
              <a href="https://g.page/r/YOUR_GOOGLE_REVIEW_LINK/review" target="_blank" rel="noopener noreferrer">
                Leave Your Feedback
                <ExternalLink className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
