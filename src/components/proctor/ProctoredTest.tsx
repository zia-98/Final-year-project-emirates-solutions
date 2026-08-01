import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Monitor, 
  Video, 
  X, 
  Play, 
  Timer,
  AlertCircle,
  Zap,
  Lock,
  Unlock,
  Sparkles
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface Question {
  id: string;
  category: string;
  question: string;
  options: string[];
  correct_option_index: number;
}

interface ProctoredTestProps {
  category: string;
  onComplete?: (score: number, level: string) => void;
  onClose: () => void;
}

export const ProctoredTest = ({ category, onComplete, onClose }: ProctoredTestProps) => {
  const [step, setStep] = useState<"intro" | "test" | "result">("intro");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [violations, setViolations] = useState(0);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes for 10 questions
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [calculatedLevel, setCalculatedLevel] = useState("Beginner");
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Map category to profile column
  const getProfileColumn = (cat: string) => {
    const normalCat = cat.toLowerCase();
    if (normalCat.includes("python")) return "python_level";
    if (normalCat.includes("java")) return "java_level";
    if (normalCat.includes("sql")) return "sql_level";
    return null;
  };

  // Fetch Questions
  useEffect(() => {
    const fetchQuestions = async () => {
      // Try to find exact match or partial match for Python/SQL/Java
      let queryCat = category;
      if (category.toLowerCase().includes("python")) queryCat = "Python";
      else if (category.toLowerCase().includes("sql")) queryCat = "SQL";
      else if (category.toLowerCase().includes("java")) queryCat = "Java";

      const { data, error } = await supabase
        .from("assessment_templates")
        .select("*")
        .eq("category", queryCat)
        .order('id', { ascending: false })
        .limit(10);

      if (error || !data || data.length === 0) {
        toast.error(`No assessment found for ${category}. Generating default...`);
        // Fallback to Python if specific not found
        const { data: fallbackData } = await supabase
          .from("assessment_templates")
          .select("*")
          .limit(10);
        setQuestions(fallbackData || []);
      } else {
        setQuestions(data);
      }
      setLoading(false);
    };

    fetchQuestions();
  }, [category]);

  // Fullscreen Request
  const enterFullscreen = () => {
    if (containerRef.current?.requestFullscreen) {
      containerRef.current.requestFullscreen();
    }
  };

  // Anti-Cheating Monitor
  useEffect(() => {
    if (step !== "test") return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation("Tab switching detected");
      }
    };

    const handleBlur = () => {
      handleViolation("Window focus lost");
    };

    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      if (!isFull && step === "test") {
        handleViolation("Security Breach: Fullscreen exited");
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && (e.key === "c" || e.key === "v" || e.key === "i" || e.key === "j")) ||
        e.key === "F12"
      ) {
        e.preventDefault();
        handleViolation("Unauthorized shortcut blocked");
      }
    };

    const handleContextMenu = (e: MouseEvent) => e.preventDefault();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [step]);

  // Webcam Start
  useEffect(() => {
    if (step === "test") {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          setVideoStream(stream);
          if (videoRef.current) videoRef.current.srcObject = stream;
        })
        .catch(() => toast.warning("Camera access required for proctoring"));
    }

    return () => {
      videoStream?.getTracks().forEach(track => track.stop());
    };
  }, [step]);

  // Timer
  useEffect(() => {
    if (step !== "test" || timeLeft <= 0) return;
    const interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [step, timeLeft]);

  const handleViolation = (reason: string) => {
    setViolations(prev => {
      const newCount = prev + 1;
      toast.error(`Security Violation! ${reason}`, {
        description: `Warning ${newCount}/3. Test will invalidate at 3.`,
      });
      if (newCount >= 3) {
        submitAttempt(0, "invalidated");
      }
      return newCount;
    });
  };

  const handleNext = () => {
    const isCorrect = selectedOption === questions[currentIdx].correct_option_index;
    const currentScore = score + (isCorrect ? 1 : 0);
    
    if (isCorrect) setScore(currentScore);

    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setSelectedOption(null);
    } else {
      submitAttempt(currentScore);
    }
  };

  const submitAttempt = async (finalScore: number, status: string = "completed") => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Calculate level
      const percentage = (finalScore / questions.length) * 100;
      let level = "Beginner";
      if (percentage >= 75) level = "Advanced";
      else if (percentage >= 40) level = "Intermediate";
      
      setCalculatedLevel(level);

      // Save Attempt
      await supabase.from("assessment_attempts").insert({
        user_id: user.id,
        category,
        score: finalScore,
        total_questions: questions.length,
        violations_count: violations,
        status,
        proctoring_logs: [{ event: "test_end", timestamp: new Date().toISOString() }]
      });

      // Update Profile adaptive skill level
      const column = getProfileColumn(category);
      if (column && status === "completed") {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ [column]: level })
          .eq("id", user.id);
        
        if (updateError) console.error("Error updating profile skill:", updateError);
        else toast.success(`Profile updated: ${category} Level is now ${level}!`);
      }

      setStep("result");
      if (onComplete) onComplete(finalScore, level);
      
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
    } catch (error) {
      toast.error("Failed to save result");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) return null;

  return (
    <div 
      ref={containerRef}
      className={cn(
        "fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4",
        step === "test" && "bg-slate-950"
      )}
    >
      <AnimatePresence mode="wait">
        {step === "intro" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-lg"
          >
            <Card className="border-slate-800 bg-slate-900 text-white overflow-hidden shadow-2xl">
              <CardHeader className="text-center pb-2 relative">
                <div className="mx-auto bg-primary/20 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                  <ShieldAlert className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold tracking-tight">Adaptive Skill Placement</CardTitle>
                <CardDescription className="text-slate-400">
                  Assess your proficiency in <span className="text-primary font-bold">{category}</span> and optimize your internship matches.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-4">
                <div className="space-y-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                  <h4 className="font-semibold text-sm uppercase tracking-wider text-slate-500">Assessment Info</h4>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-3">
                      <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <span><strong>Dynamic Profiling</strong>: Your score will automatically update your profile level (Beginner/Intermediate/Advanced).</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Monitor className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>The test must be taken in <strong>Fullscreen mode</strong>.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <span>Tab-switching or minimizing the window will trigger violations.</span>
                    </li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 border-slate-700 text-black hover:text-white hover:bg-slate-800 h-12" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1 bg-primary hover:bg-primary/90 h-12 font-semibold" 
                    onClick={() => {
                      enterFullscreen();
                      setStep("test");
                    }}
                  >
                    <Play className="w-4 h-4 mr-2 fill-current" /> Start Assessment
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === "test" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full h-full flex flex-col bg-slate-950 text-white"
          >
            {/* Proctor Header */}
            <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full border border-slate-700">
                  <div className="w-2 h-2 rounded-full animate-pulse bg-red-500" />
                  <span className="text-xs font-medium uppercase tracking-widest text-slate-300">
                    Live Proctoring
                  </span>
                </div>
                {violations > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full border border-amber-500/30 text-xs font-bold">
                    Violations: {violations}/3
                  </div>
                )}
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 font-mono text-xl">
                  <Timer className="w-5 h-5 text-primary" />
                  {formatTime(timeLeft)}
                </div>
                <div className="w-32 h-24 rounded-lg bg-slate-800 border-2 border-primary/30 overflow-hidden relative">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover grayscale opacity-50" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent flex items-end p-1">
                    <span className="text-[8px] uppercase font-bold text-slate-400 tracking-tighter">Candidate Feed</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Test Area */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
              <div className="w-full max-w-3xl space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400 font-medium">Question {currentIdx + 1} of {questions.length}</span>
                    <span className="text-primary font-bold">{Math.round(((currentIdx) / questions.length) * 100)}% Complete</span>
                  </div>
                  <Progress value={((currentIdx) / questions.length) * 100} className="h-2 bg-slate-800" />
                </div>

                <div className="space-y-8">
                  <h2 className="text-3xl font-bold leading-tight tracking-tight text-slate-100">
                    {questions[currentIdx]?.question}
                  </h2>

                  <div className="grid gap-4">
                    {questions[currentIdx]?.options.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedOption(idx)}
                        className={cn(
                          "w-full p-6 text-left rounded-2xl border-2 transition-all duration-300 group relative overflow-hidden",
                          selectedOption === idx 
                            ? "bg-primary/10 border-primary shadow-[0_0_20px_rgba(59,130,246,0.15)]" 
                            : "bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
                        )}
                      >
                        <div className="flex items-center gap-4 relative z-10">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center border-2 text-sm font-bold transition-colors",
                            selectedOption === idx ? "bg-primary border-primary text-white" : "border-slate-700 text-slate-500"
                          )}>
                            {String.fromCharCode(65 + idx)}
                          </div>
                          <span className={cn(
                            "text-lg font-medium",
                            selectedOption === idx ? "text-white" : "text-slate-200"
                          )}>
                            {option}
                          </span>
                        </div>
                        {selectedOption === idx && (
                          <motion.div 
                            layoutId="selected-indicator"
                            className="absolute left-0 top-0 bottom-0 w-1 bg-primary" 
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-8">
                  <Button 
                    disabled={selectedOption === null}
                    onClick={handleNext}
                    className="h-14 px-12 rounded-2xl bg-primary hover:bg-primary/90 text-lg font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
                  >
                    {currentIdx === questions.length - 1 ? "Submit Assessment" : "Next Question"}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === "result" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg"
          >
            <Card className="border-slate-800 bg-slate-900 text-white overflow-hidden shadow-2xl">
              <CardContent className="pt-10 pb-10 text-center space-y-6">
                <div className="mx-auto bg-green-500/20 w-24 h-24 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tight">Assessment Completed!</h2>
                  <p className="text-slate-400">
                    {violations >= 3 
                      ? "Your attempt was invalidated due to security violations." 
                      : `You have successfully verified your ${category} skills.`}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800">
                    <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block mb-1">New Skill Level</span>
                    <span className="text-2xl font-black text-primary uppercase">{calculatedLevel}</span>
                  </div>
                  <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800">
                    <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block mb-1">Total Score</span>
                    <span className="text-3xl font-black text-white">{score}/{questions.length}</span>
                  </div>
                </div>

                <div className="bg-primary/10 p-4 rounded-xl border border-primary/20 flex items-center gap-3 text-left">
                  <div className="bg-primary/20 p-2 rounded-lg">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-primary">Adaptive Matching</h4>
                    <p className="text-[11px] text-slate-400">Your internship recommendations will now be automatically refreshed based on your new <span className="text-white font-bold">{calculatedLevel}</span> status.</p>
                  </div>
                </div>

                <Button className="w-full h-14 bg-white text-slate-950 hover:bg-slate-200 font-bold text-lg rounded-2xl mt-4" onClick={onClose}>
                  Refresh My Matches
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
