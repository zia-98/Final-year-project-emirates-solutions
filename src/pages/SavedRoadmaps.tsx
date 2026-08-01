
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, FileText, Trash2, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { Roadmap } from "@/lib/RoadmapGenerator";
import RoadmapView from "@/components/RoadmapView";
import { toast } from "sonner";

interface SavedRoadmap {
    id: string;
    title: string;
    roadmap_data: Roadmap;
    created_at: string;
}

const SavedRoadmaps = () => {
    const { user } = useAuth();
    const [savedRoadmaps, setSavedRoadmaps] = useState<SavedRoadmap[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRoadmap, setSelectedRoadmap] = useState<{ data: Roadmap, title: string } | null>(null);
    const [showRoadmap, setShowRoadmap] = useState(false);

    useEffect(() => {
        fetchSavedRoadmaps();
    }, [user]);

    const fetchSavedRoadmaps = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from("saved_roadmaps")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setSavedRoadmaps(data || []);
        } catch (error) {
            console.error("Error fetching saved roadmaps:", error);
            toast.error("Failed to load saved roadmaps");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const { error } = await supabase
                .from("saved_roadmaps")
                .delete()
                .eq("id", id);

            if (error) throw error;
            setSavedRoadmaps(savedRoadmaps.filter(r => r.id !== id));
            toast.success("Roadmap deleted");
        } catch (error) {
            console.error("Error deleting roadmap:", error);
            toast.error("Failed to delete roadmap");
        }
    };

    const handleView = (roadmap: SavedRoadmap) => {
        setSelectedRoadmap({ data: roadmap.roadmap_data, title: roadmap.title });
        setShowRoadmap(true);
    };

    if (!user) return null;

    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1 py-12 bg-gray-50/50">
                <div className="container mx-auto px-4 max-w-5xl">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">Saved Roadmaps</h1>
                            <p className="text-muted-foreground">Access your personalized learning paths</p>
                        </div>
                        <Button asChild variant="outline">
                            <a href="/applications">Create New</a>
                        </Button>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map((i) => (
                                <Card key={i} className="animate-pulse h-48" />
                            ))}
                        </div>
                    ) : savedRoadmaps.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-xl border border-dashed">
                            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-slate-900">No saved roadmaps yet</h3>
                            <p className="text-slate-500 mb-6">Generate a detailed roadmap from your applications to see it here.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {savedRoadmaps.map((roadmap) => (
                                <Card key={roadmap.id} className="group hover:shadow-md transition-all cursor-pointer border-slate-200" onClick={() => handleView(roadmap)}>
                                    <CardHeader>
                                        <div className="flex justify-between items-start gap-2">
                                            <CardTitle className="text-lg font-bold line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                                                {roadmap.title}
                                            </CardTitle>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-400 hover:text-red-500 -mt-1 -mr-2"
                                                onClick={(e) => handleDelete(roadmap.id, e)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        <CardDescription className="flex items-center gap-2 text-xs">
                                            <Calendar className="w-3 h-3" />
                                            {format(new Date(roadmap.created_at), "MMM d, yyyy")}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="pt-2 flex items-center text-sm text-primary font-medium group-hover:translate-x-1 transition-transform">
                                            View Roadmap <ArrowRight className="w-4 h-4 ml-1" />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </main>
            <Footer />

            {selectedRoadmap && (
                <RoadmapView
                    open={showRoadmap}
                    onOpenChange={setShowRoadmap}
                    roadmap={selectedRoadmap.data}
                    title={selectedRoadmap.title}
                />
            )}
        </div>
    );
};

export default SavedRoadmaps;
