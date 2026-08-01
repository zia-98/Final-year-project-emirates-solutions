import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageSquare, 
  Star, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  X,
  ThumbsUp,
  Heart,
  Zap,
  HelpCircle,
  Smile,
  Truck,
  Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { sendAdminNewFeedback } from "@/lib/resend";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FeedbackQuestProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "welcome" | "rating" | "category" | "comment" | "nps" | "success";

const categories = [
  { id: "ui", label: "Platform Experience", icon: Zap },
  { id: "support", label: "Customer Support", icon: Heart },
  { id: "quality", label: "Hardware Quality", icon: Package },
  { id: "delivery", label: "Delivery Speed", icon: Truck },
  { id: "other", label: "Something Else", icon: HelpCircle },
];

const FeedbackQuest = ({ open, onOpenChange }: FeedbackQuestProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("welcome");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState("");
  const [comment, setComment] = useState("");
  const [nps, setNps] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setRating(0);
    setCategory("");
    setComment("");
    setNps(null);
    setStep("welcome");
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("feedbacks")
        .insert({
          user_id: user?.id || null,
          rating,
          category,
          comment,
          nps_score: nps,
        });

      if (error) throw error;
      
      // Notify Admin via Email
      await sendAdminNewFeedback({
        rating,
        category,
        comment,
        nps_score: nps,
        user_email: user?.email || "Guest User"
      });

      setStep("success");
      toast.success("Thank you for your feedback!");
    } catch (error) {
      console.error("Feedback error:", error);
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps: Record<Step, React.ReactNode> = {
    welcome: (
      <div className="space-y-6 text-center py-8">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 scale-up-center">
          <MessageSquare className="w-10 h-10 text-primary animate-pulse" />
        </div>
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
          We Value Your Opinion
        </h2>
        <p className="text-slate-500 max-w-sm mx-auto leading-relaxed">
          Help us build the best experience for you. This quick questionnaire will only take 60 seconds.
        </p>
        <Button 
          onClick={() => setStep("rating")}
          className="w-full h-12 rounded-xl text-lg font-bold gradient-primary shadow-glow hover:scale-[1.02] transition-transform"
        >
          Share Your Feedback
          <ChevronRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    ),
    rating: (
      <div className="space-y-8 py-4">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-slate-900">How's your experience?</h3>
          <p className="text-slate-500 mt-2">Rate your overall satisfaction with Emirates Solutions</p>
        </div>
        
        <div className="flex justify-center gap-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <motion.button
              key={star}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => {
                setRating(star);
                setTimeout(() => setStep("category"), 400);
              }}
              className="focus:outline-none"
            >
              <Star 
                className={cn(
                  "w-12 h-12 transition-colors duration-300",
                  (hoverRating || rating) >= star 
                    ? "fill-yellow-400 text-yellow-400 filter drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" 
                    : "text-slate-200"
                )} 
              />
            </motion.button>
          ))}
        </div>
        
        <div className="flex justify-between items-center pt-4">
           <Button variant="ghost" onClick={() => setStep("welcome")} className="text-slate-400">
             <ChevronLeft className="mr-2 h-4 w-4" /> Back
           </Button>
        </div>
      </div>
    ),
    category: (
      <div className="space-y-6 py-2">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-slate-900">What stands out?</h3>
          <p className="text-slate-500 mt-1">Which area are you giving feedback on today?</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setCategory(cat.id);
                setStep("comment");
              }}
              className={cn(
                "flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left group hover:scale-[1.02]",
                category === cat.id 
                  ? "border-primary bg-primary/5 shadow-md" 
                  : "border-slate-100 hover:border-primary/30 hover:bg-slate-50"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                category === cat.id ? "bg-primary text-white" : "bg-slate-100 text-slate-500 group-hover:bg-primary/10 group-hover:text-primary"
              )}>
                <cat.icon className="w-5 h-5" />
              </div>
              <span className="font-bold text-slate-700">{cat.label}</span>
            </button>
          ))}
        </div>

        <div className="flex justify-between pt-2">
           <Button variant="ghost" onClick={() => setStep("rating")} className="text-slate-400">
             <ChevronLeft className="mr-2 h-4 w-4" /> Back
           </Button>
        </div>
      </div>
    ),
    comment: (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-slate-900">Tell us more</h3>
          <p className="text-slate-500 mt-1">Optional: Share your thoughts or suggestions</p>
        </div>

        <Textarea 
          placeholder="What's on your mind? We read every piece of feedback..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="min-h-[150px] rounded-2xl border-2 focus-visible:ring-primary/20 resize-none p-4"
        />

        <div className="flex justify-between gap-4">
           <Button variant="outline" onClick={() => setStep("category")} className="flex-1 rounded-xl h-11">
             Back
           </Button>
           <Button 
             onClick={() => setStep("nps")}
             className="flex-1 rounded-xl h-11 gradient-primary font-bold"
           >
             Continue
             <ChevronRight className="ml-2 w-4 h-4" />
           </Button>
        </div>
      </div>
    ),
    nps: (
      <div className="space-y-8">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-slate-900">One last thing...</h3>
          <p className="text-slate-500 mt-2 leading-relaxed">
            How likely are you to recommend <span className="text-primary font-bold font-heading italic">Emirates Solutions</span> to a friend or colleague?
          </p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-11 gap-1">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <button
                key={num}
                onClick={() => setNps(num)}
                className={cn(
                  "aspect-square rounded-lg flex items-center justify-center font-bold text-sm transition-all",
                  nps === num 
                    ? "bg-primary text-white scale-110 shadow-lg" 
                    : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                )}
              >
                {num}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
            <span>Not Likely</span>
            <span>Highly Likely</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting || nps === null}
            className="w-full h-12 rounded-xl text-lg font-bold gradient-primary shadow-glow disabled:opacity-50"
          >
            {isSubmitting ? "Submitting..." : "Complete Feedback"}
          </Button>
          <Button variant="ghost" onClick={() => setStep("comment")} className="text-slate-400">
             Back
           </Button>
        </div>
      </div>
    ),
    success: (
      <div className="space-y-6 text-center py-10">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 scale-up-center">
          <CheckCircle2 className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900">Success!</h2>
        <p className="text-slate-500 leading-relaxed max-w-sm mx-auto">
          Your feedback has been received. Thank you for helping us grow and improve Emirates Solutions.
        </p>
        <Button 
          onClick={() => {
            onOpenChange(false);
            setTimeout(resetForm, 500);
          }}
          variant="outline"
          className="w-full h-12 rounded-xl text-lg font-bold border-2"
        >
          Close
        </Button>
      </div>
    )
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 lg:p-8"
            onClick={() => onOpenChange(false)}
          >
            {/* Modal */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-xl bg-white/95 rounded-[2.5rem] shadow-2xl relative overflow-hidden glass-morphism border border-white"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Progress Bar */}
              {["rating", "category", "comment", "nps"].includes(step) && (
                <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100">
                  <motion.div 
                    className="h-full bg-primary"
                    initial={{ width: "0%" }}
                    animate={{ 
                      width: step === "rating" ? "25%" : 
                             step === "category" ? "50%" : 
                             step === "comment" ? "75%" : "100%" 
                    }}
                  />
                </div>
              )}

              <button 
                onClick={() => onOpenChange(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <Card className="border-none bg-transparent shadow-none">
                <CardContent className="p-8 lg:p-12">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={step}
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: -20, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {steps[step]}
                    </motion.div>
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FeedbackQuest;
