import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Roadmap, RoadmapWeek } from "@/lib/RoadmapGenerator";
import { CheckCircle2, Circle, ExternalLink, PlayCircle, FileText, GraduationCap, Download, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import jsPDF from "jspdf";

interface RoadmapViewProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    roadmap: Roadmap;
    title: string;
}

const RoadmapView = ({ open, onOpenChange, roadmap, title }: RoadmapViewProps) => {
    const [progress, setProgress] = useState<Record<number, boolean>>({});
    const [isSaving, setIsSaving] = useState(false);

    // Load progress from local storage
    useEffect(() => {
        const saved = localStorage.getItem(`roadmap_progress_${title}`);
        if (saved) {
            setProgress(JSON.parse(saved));
        }
    }, [title]);

    const toggleWeek = (week: number) => {
        const newProgress = { ...progress, [week]: !progress[week] };
        setProgress(newProgress);
        localStorage.setItem(`roadmap_progress_${title}`, JSON.stringify(newProgress));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not authenticated");

            const { error } = await supabase
                .from('saved_roadmaps')
                .insert({
                    user_id: user.id,
                    title: title,
                    roadmap_data: roadmap
                });

            if (error) throw error;
            toast.success("Roadmap saved successfully!");
        } catch (error) {
            console.error("Error saving roadmap:", error);
            toast.error("Failed to save roadmap");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDownloadPDF = () => {
        const doc = new jsPDF();

        // Add title
        doc.setFontSize(20);
        doc.setTextColor(41, 128, 185);
        doc.text(`${title} Roadmap`, 14, 22);

        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 30);

        let yPos = 40;

        roadmap.forEach((week) => {
            // Check page break
            if (yPos > 270) {
                doc.addPage();
                yPos = 20;
            }

            // Week Header
            doc.setFontSize(14);
            doc.setTextColor(44, 62, 80);
            doc.text(`Week ${week.week}: ${week.title}`, 14, yPos);
            yPos += 8;

            // Goals
            doc.setFontSize(10);
            doc.setTextColor(0);
            doc.text("Goals:", 14, yPos);
            yPos += 5;
            week.goals.forEach(goal => {
                doc.text(`• ${goal}`, 20, yPos);
                yPos += 5;
            });

            // Project
            yPos += 2;
            doc.setFontSize(10);
            doc.setTextColor(39, 174, 96); // Green
            doc.text(`Project: ${week.project}`, 14, yPos);
            yPos += 10;
        });

        doc.save(`${title.replace(/\s+/g, '_')}_Roadmap.pdf`);
        toast.success("Roadmap downloaded as PDF");
    };

    const completedCount = Object.values(progress).filter(Boolean).length;
    const progressPercentage = Math.round((completedCount / roadmap.length) * 100);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2">
                    <div className="flex items-center justify-between mr-8">
                        <div>
                            <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
                                {title} Roadmap
                            </DialogTitle>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-sm font-medium">{progressPercentage}% Complete</span>
                                <div className="w-24 h-2 bg-secondary/20 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary transition-all duration-500"
                                        style={{ width: `${progressPercentage}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving}>
                                {isSaving ? "Saving..." : "Save Roadmap"}
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                                Download PDF
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1 p-6 pt-2">
                    <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-1 before:bg-gradient-to-b before:from-transparent before:via-slate-400 before:to-transparent">
                        {roadmap.map((week, index) => {
                            const isCompleted = progress[week.week];
                            return (
                                <div key={week.week} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">

                                    {/* Icon */}
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors duration-300 cursor-pointer"
                                        onClick={() => toggleWeek(week.week)}
                                    >
                                        {isCompleted ? (
                                            <CheckCircle2 className="w-6 h-6 text-green-500 fill-green-100" />
                                        ) : (
                                            <Circle className="w-5 h-5 text-slate-400" />
                                        )}
                                    </div>

                                    {/* Content Card */}
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center justify-between mb-2">
                                            <Badge variant={isCompleted ? "default" : "secondary"} className="mb-1">
                                                Week {week.week}
                                            </Badge>
                                            <div className="flex items-center space-x-2">
                                                <label
                                                    htmlFor={`week-${week.week}`}
                                                    className="text-xs text-muted-foreground cursor-pointer select-none"
                                                >
                                                    Mark as done
                                                </label>
                                                <Checkbox
                                                    id={`week-${week.week}`}
                                                    checked={isCompleted}
                                                    onCheckedChange={() => toggleWeek(week.week)}
                                                />
                                            </div>
                                        </div>
                                        <h3 className="font-bold text-lg mb-2 text-slate-800">{week.title}</h3>

                                        {/* Goals */}
                                        <div className="mb-4">
                                            <h4 className="text-sm font-semibold text-slate-600 mb-1 uppercase tracking-wider">Goals</h4>
                                            <ul className="list-disc pl-4 space-y-1">
                                                {week.goals.map((goal, i) => (
                                                    <li key={i} className="text-sm text-slate-600">{goal}</li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* Project */}
                                        <div className="mb-4 bg-primary/5 p-3 rounded-lg border border-primary/10">
                                            <h4 className="text-sm font-semibold text-primary mb-1 flex items-center gap-2">
                                                <GraduationCap className="w-4 h-4" />
                                                Practical Project
                                            </h4>
                                            <p className="text-sm text-slate-700 font-medium">{week.project}</p>
                                        </div>

                                        {/* Resources */}
                                        <div>
                                            <h4 className="text-sm font-semibold text-slate-600 mb-2 uppercase tracking-wider">Recommended Resources</h4>
                                            <div className="space-y-2">
                                                {week.resources.map((res, i) => (
                                                    <a
                                                        key={i}
                                                        href={res.url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="flex items-center gap-2 text-sm text-slate-600 hover:text-primary transition-colors p-2 rounded-md hover:bg-slate-50 group/link"
                                                    >
                                                        {res.type === 'video' && <PlayCircle className="w-4 h-4 text-red-500" />}
                                                        {res.type === 'article' && <FileText className="w-4 h-4 text-blue-500" />}
                                                        {res.type === 'course' && <GraduationCap className="w-4 h-4 text-purple-500" />}
                                                        <span className="flex-1 truncate">{res.title}</span>
                                                        <ExternalLink className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <div className="mt-12 p-6 bg-slate-50 rounded-xl border text-center">
                        <h3 className="text-lg font-semibold mb-2">Keep Learning!</h3>
                        <p className="text-muted-foreground text-sm">
                            Consistently following this roadmap will prepare you for your internship.
                            Don't forget to document your journey!
                        </p>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};

export default RoadmapView;
