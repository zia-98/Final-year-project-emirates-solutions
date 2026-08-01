
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Internship } from "@/components/Internships";
import { useInternships } from "@/hooks/useInternships";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, FileText, MapPin, Briefcase, Clock, Award, User, Mail, Phone, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface Application {
    id: string;
    program_id: string;
    status: "pending" | "reviewing" | "accepted" | "rejected";
    created_at: string;
    full_name: string;
    email: string;
    phone: string;
    education: string;
    experience: string;
    preferred_type: string;
    motivation: string;
    availability: string;
    linkedin_url: string;
    resume_url: string;
}

const ApplicationDetails = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const { internships, loading: loadingInternships } = useInternships();
    const navigate = useNavigate();
    const [application, setApplication] = useState<Application | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchApplication = async () => {
            if (!user || !id) return;

            try {
                const { data, error } = await supabase
                    .from("internship_applications")
                    .select("*")
                    .eq("id", id)
                    .single();

                if (error) throw error;

                // Security check - ensure the application belongs to the user
                if (data.user_id !== user.id) {
                    navigate("/applications");
                    return;
                }

                setApplication(data);
            } catch (error) {
                console.error("Error fetching application:", error);
                navigate("/applications");
            } finally {
                setLoading(false);
            }
        };

        fetchApplication();
    }, [user, id, navigate]);

    if (loading || loadingInternships) {
        return (
            <div className="min-h-screen flex flex-col">
                <Header />
                <div className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
                    <div className="space-y-4">
                        <Skeleton className="h-8 w-1/3" />
                        <Skeleton className="h-64 w-full" />
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    if (!application) return null;

    const program = internships.find(i => i.id === application.program_id);

    const getStatusBadge = (status: string) => {
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

    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1 py-12 bg-gray-50/50">
                <div className="container mx-auto px-4 max-w-4xl">
                    <Button variant="ghost" className="mb-6 pl-0 hover:pl-2 transition-all" asChild>
                        <Link to="/applications">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Applications
                        </Link>
                    </Button>

                    <div className="grid gap-6">
                        {/* Header Card */}
                        <Card>
                            <CardHeader className="pb-4">
                                <div className="flex justify-between items-start gap-4 flex-wrap">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <h1 className="text-2xl font-bold">
                                                {program ? program.title : "Unknown Program"}
                                            </h1>
                                            {getStatusBadge(application.status)}
                                        </div>
                                        <div className="text-muted-foreground flex items-center gap-2 text-sm">
                                            <Calendar className="w-4 h-4" />
                                            Applied on {format(new Date(application.created_at), "PPP")}
                                        </div>
                                    </div>
                                    {program && (
                                        <Badge variant="secondary" className="px-3 py-1 text-sm bg-primary/10 text-primary hover:bg-primary/20">
                                            {program.type}
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>
                        </Card>

                        <div className="grid md:grid-cols-3 gap-6">
                            {/* Main Details */}
                            <div className="md:col-span-2 space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Program Information</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {program ? (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Duration</span>
                                                    <div className="flex items-center gap-2 font-medium">
                                                        <Clock className="w-4 h-4 text-primary" />
                                                        {program.duration}
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Level</span>
                                                    <div className="flex items-center gap-2 font-medium">
                                                        <Award className="w-4 h-4 text-primary" />
                                                        {program.level}
                                                    </div>
                                                </div>
                                                <div className="col-span-2 space-y-1">
                                                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Topics</span>
                                                    <div className="flex flex-wrap gap-2">
                                                        {program.topics?.map((topic, i) => (
                                                            <Badge key={i} variant="secondary" className="font-normal">
                                                                {topic}
                                                            </Badge>
                                                        ))}
                                                        {(!program.topics || program.topics.length === 0) && (
                                                            <span className="text-sm text-muted-foreground">No topics listed</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-muted-foreground">Program details not available</p>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">My Submission</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="space-y-2">
                                            <h4 className="font-semibold text-sm">Motivation</h4>
                                            <p className="text-sm text-muted-foreground leading-relaxed bg-muted/50 p-4 rounded-lg">
                                                {application.motivation}
                                            </p>
                                        </div>

                                        {application.experience && (
                                            <div className="space-y-2">
                                                <h4 className="font-semibold text-sm">Experience</h4>
                                                <p className="text-sm text-muted-foreground leading-relaxed bg-muted/50 p-4 rounded-lg">
                                                    {application.experience}
                                                </p>
                                            </div>
                                        )}

                                        <Separator />

                                        <div className="grid sm:grid-cols-2 gap-4">
                                            <div>
                                                <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Education</span>
                                                <p className="font-medium capitalize">{application.education}</p>
                                            </div>
                                            <div>
                                                <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Availability</span>
                                                <p className="font-medium">{application.availability}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Sidebar Info */}
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Applicant Details</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="text-xs text-muted-foreground">Name</p>
                                                <p className="font-medium truncate" title={application.full_name}>{application.full_name}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                <Mail className="w-4 h-4" />
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="text-xs text-muted-foreground">Email</p>
                                                <p className="font-medium truncate" title={application.email}>{application.email}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                <Phone className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Phone</p>
                                                <p className="font-medium">{application.phone}</p>
                                            </div>
                                        </div>

                                        {(application.linkedin_url || application.resume_url) && (
                                            <>
                                                <Separator />
                                                <div className="space-y-3 pt-2">
                                                    {application.linkedin_url && (
                                                        <Button variant="outline" className="w-full justify-start" asChild>
                                                            <a href={application.linkedin_url} target="_blank" rel="noopener noreferrer">
                                                                <ExternalLink className="w-4 h-4 mr-2" />
                                                                LinkedIn Profile
                                                            </a>
                                                        </Button>
                                                    )}
                                                    {application.resume_url && (
                                                        <Button variant="outline" className="w-full justify-start" asChild>
                                                            <a href={application.resume_url} target="_blank" rel="noopener noreferrer">
                                                                <FileText className="w-4 h-4 mr-2" />
                                                                View Resume
                                                            </a>
                                                        </Button>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default ApplicationDetails;
