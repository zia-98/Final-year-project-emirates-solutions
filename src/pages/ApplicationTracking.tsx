
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Internship } from "@/components/Internships";
import { useInternships } from "@/hooks/useInternships";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Briefcase, FileText, Award, BookOpen, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { generateRoadmap, Roadmap } from "@/lib/RoadmapGenerator";
import RoadmapView from "@/components/RoadmapView";

type ApplicationStatus = "pending" | "reviewing" | "accepted" | "rejected";

interface Application {
    id: string;
    program_id: string;
    status: ApplicationStatus;
    created_at: string;
}

const ApplicationTracking = () => {
    const { user } = useAuth();
    const [applications, setApplications] = useState<Application[]>([]);
    const { internships, loading: loadingInternships } = useInternships();
    const [loading, setLoading] = useState(true);
    const [showRoadmap, setShowRoadmap] = useState(false);
    const [selectedRoadmap, setSelectedRoadmap] = useState<{ data: Roadmap, title: string } | null>(null);
    const [userRoadmaps, setUserRoadmaps] = useState<any[]>([]);
    const [generatingByProgram, setGeneratingByProgram] = useState<Record<string, boolean>>({});

    const fetchUserRoadmaps = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from("saved_roadmaps")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setUserRoadmaps(data || []);
        } catch (error) {
            console.error("Error fetching user roadmap:", error);
        }
    };


    const handleRoadmapAction = async (programId: string) => {
        const program = internships.find(i => i.id === programId);
        if (!program || !user || generatingByProgram[programId]) return;

        const roadmapTitle = `${program.title} Roadmap | ${programId}`;
        const existingRoadmap = userRoadmaps.find((r) => r.title === roadmapTitle);

        // If roadmap for this program already exists, just view it
        if (existingRoadmap) {
            setSelectedRoadmap({ data: existingRoadmap.roadmap_data, title: `${program.title} Roadmap` });
            setShowRoadmap(true);
            return;
        }

        setGeneratingByProgram((prev) => ({ ...prev, [programId]: true }));

        // Generate new roadmap
        const loadingToast = toast.loading("Performing Deep Research & Curriculum Design... This may take up to 60 seconds.");
        try {
            const roadmap = await generateRoadmap(program.title, program.duration || "8 weeks");
            
            if (roadmap) {
                const { data: savedData, error: saveError } = await supabase
                    .from("saved_roadmaps")
                    .insert({
                        user_id: user.id,
                        title: roadmapTitle,
                        roadmap_data: roadmap
                    })
                    .select()
                    .single();

                if (saveError) throw saveError;
                
                setUserRoadmaps((prev) => [savedData, ...prev]);
                setSelectedRoadmap({ data: roadmap, title: `${program.title} Roadmap` });
                setShowRoadmap(true);
                toast.success("Personalized roadmap generated and stored!");
            }
            toast.dismiss(loadingToast);
        } catch (error) {
            toast.dismiss(loadingToast);
            toast.error("Failed to generate roadmap.");
            console.error(error);
        } finally {
            setGeneratingByProgram((prev) => ({ ...prev, [programId]: false }));
        }
    };

    useEffect(() => {
        const fetchApplications = async () => {
            if (!user) return;

            try {
                const { data, error } = await supabase
                    .from("internship_applications")
                    .select("*")
                    .eq("user_id", user.id)
                    .order("created_at", { ascending: false });

                if (error) throw error;
                setApplications(data || []);
            } catch (error) {
                console.error("Error fetching applications:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchApplications();
        fetchUserRoadmaps();
    }, [user]);

    const getProgramDetails = (programId: string): Internship | undefined => {
        return internships.find((i) => i.id === programId);
    };

    const getStatusBadge = (status: ApplicationStatus) => {
        switch (status) {
            case "pending":
                return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-200">Pending</Badge>;
            case "reviewing":
                return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-200">Under Review</Badge>;
            case "accepted":
                return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">Accepted</Badge>;
            case "rejected":
                return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-200">Rejected</Badge>;
            default:
                return <Badge variant="outline">Unknown</Badge>;
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen flex flex-col">
                <Header />
                <div className="flex-1 flex flex-col items-center justify-center p-4">
                    <div className="text-center space-y-4">
                        <h2 className="text-2xl font-bold">Please Sign In</h2>
                        <p className="text-muted-foreground">You need to be signed in to view your applications.</p>
                        <Button asChild>
                            <Link to="/auth">Sign In</Link>
                        </Button>
                    </div>
                </div>
                <Footer />
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1 py-12 bg-gray-50/50">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold mb-2">My Applications</h1>
                        <p className="text-muted-foreground">Track the status of your internship applications</p>
                    </div>

                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2].map((i) => (
                                <Card key={i} className="animate-pulse">
                                    <CardHeader className="h-24 bg-gray-100 dark:bg-gray-800" />
                                    <CardContent className="h-32" />
                                </Card>
                            ))}
                        </div>
                    ) : applications.length === 0 ? (
                        <Card className="text-center py-12">
                            <CardContent>
                                <div className="flex flex-col items-center gap-4">
                                    <div className="p-4 rounded-full bg-primary/10">
                                        <FileText className="w-8 h-8 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-semibold">No Applications Found</h3>
                                    <p className="text-muted-foreground max-w-sm mx-auto">
                                        You haven't applied to any internships yet. Explore our available programs and apply today!
                                    </p>
                                    <Button asChild className="mt-4">
                                        <Link to="/internships">Browse Internships</Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {applications.map((app) => {
                                const program = getProgramDetails(app.program_id);
                                const roadmapTitle = program ? `${program.title} Roadmap | ${app.program_id}` : "";
                                const programRoadmap = program ? userRoadmaps.find((r) => r.title === roadmapTitle) : null;
                                const generating = !!generatingByProgram[app.program_id];
                                return (
                                    <Card key={app.id} className="overflow-hidden hover:shadow-md transition-shadow">
                                        <CardHeader className="border-b bg-gray-50/50 pb-4">
                                            <div className="flex justify-between items-start gap-4">
                                                <div>
                                                    <CardTitle className="text-xl mb-1">
                                                        {program ? program.title : "Unknown Program"}
                                                    </CardTitle>
                                                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                                                        <Calendar className="w-3 h-3" />
                                                        Applied on {format(new Date(app.created_at), "MMM d, yyyy")}
                                                    </div>
                                                </div>
                                                {getStatusBadge(app.status)}
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-6">
                                            <div className="grid sm:grid-cols-2 gap-6">
                                                {program && (
                                                    <>
                                                        <div className="space-y-1">
                                                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Program Details</div>
                                                            <div className="flex items-center gap-2 text-sm">
                                                                <Briefcase className="w-4 h-4 text-primary" />
                                                                <span>{program.type} Internship</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-sm">
                                                                <Clock className="w-4 h-4 text-primary" />
                                                                <span>{program.duration}</span>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Level</div>
                                                            <div className="flex items-center gap-2 text-sm">
                                                                <Award className="w-4 h-4 text-primary" />
                                                                <span>{program.level}</span>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}

                                            </div>

                                            <div className="mt-6 pt-4 border-t flex flex-wrap items-center justify-between gap-4">
                                                {programRoadmap ? (
                                                    <div className="text-sm text-primary font-medium flex items-center gap-2">
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        <span>Note: A roadmap already exists for this application.</span>
                                                    </div>
                                                ) : (
                                                    <div className="text-sm text-muted-foreground">
                                                        <span>No roadmap generated yet.</span>
                                                    </div>
                                                )}
                                                
                                                <div className="flex gap-2">
                                                    <Button 
                                                        variant={programRoadmap ? "outline" : "default"} 
                                                        size="sm" 
                                                        onClick={() => handleRoadmapAction(app.program_id)} 
                                                        className="gap-2 shadow-sm"
                                                        disabled={generating}
                                                    >
                                                        <BookOpen className="w-4 h-4" />
                                                        {generating ? "Generating..." : programRoadmap ? "View Roadmap" : "Generate Roadmap"}
                                                    </Button>
                                                    <Button variant="ghost" size="sm" asChild>
                                                        <Link to={`/applications/${app.id}`}>
                                                            View Details
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main >
            <Footer />

            {
                selectedRoadmap && selectedRoadmap.data && Array.isArray(selectedRoadmap.data) && (
                    <RoadmapView
                        open={showRoadmap}
                        onOpenChange={setShowRoadmap}
                        roadmap={selectedRoadmap.data}
                        title={selectedRoadmap.title}
                    />
                )
            }
        </div >
    );
};

export default ApplicationTracking;
