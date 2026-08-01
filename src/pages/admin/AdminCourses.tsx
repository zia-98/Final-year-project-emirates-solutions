
import { useEffect, useState } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Course {
    id: string;
    title: string;
    description: string | null;
    price: number;
    duration: string | null;
    level: string | null;
    category: string | null;
    image_url: string | null;
    instructor: string | null;
    created_at?: string;
}

const AdminCourses = () => {
    const { isAdmin, loading: authLoading } = useAdminAuth();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);

    // Delete confirm state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [courseToDelete, setCourseToDelete] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        price: "",
        duration: "",
        level: "",
        category: "",
        instructor: "",
        image_url: "",
    });

    const fetchCourses = async () => {
        setLoading(true);
        // Casting 'courses' as any to avoid TS errors if table type definition is missing locally
        const { data, error } = await supabase
            .from("courses" as any)
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching courses:", error);
            toast.error("Failed to fetch courses");
        } else {
            setCourses(data as any || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (isAdmin) {
            fetchCourses();
        }
    }, [isAdmin]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const courseData = {
            title: formData.title,
            description: formData.description || null,
            price: parseFloat(formData.price) || 0,
            duration: formData.duration || null,
            level: formData.level || null,
            category: formData.category || null,
            instructor: formData.instructor || null,
            image_url: formData.image_url || null,
        };

        if (editingCourse) {
            const { error } = await supabase
                .from("courses" as any)
                .update(courseData)
                .eq("id", editingCourse.id);

            if (error) {
                toast.error("Failed to update course");
            } else {
                toast.success("Course updated successfully");
                fetchCourses();
            }
        } else {
            const { error } = await supabase
                .from("courses" as any)
                .insert([courseData]);

            if (error) {
                toast.error("Failed to create course");
            } else {
                toast.success("Course created successfully");
                fetchCourses();
            }
        }

        setDialogOpen(false);
        resetForm();
    };

    const handleEdit = (course: Course) => {
        setEditingCourse(course);
        setFormData({
            title: course.title,
            description: course.description || "",
            price: course.price.toString(),
            duration: course.duration || "",
            level: course.level || "",
            category: course.category || "",
            instructor: course.instructor || "",
            image_url: course.image_url || "",
        });
        setDialogOpen(true);
    };

    const confirmDelete = (id: string) => {
        setCourseToDelete(id);
        setDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!courseToDelete) return;

        const { error } = await supabase.from("courses" as any).delete().eq("id", courseToDelete);

        if (error) {
            toast.error("Failed to delete course");
        } else {
            toast.success("Course deleted successfully");
            fetchCourses();
        }
        setDeleteDialogOpen(false);
        setCourseToDelete(null);
    };

    const resetForm = () => {
        setEditingCourse(null);
        setFormData({
            title: "",
            description: "",
            price: "",
            duration: "",
            level: "",
            category: "",
            instructor: "",
            image_url: "",
        });
    };

    const filteredCourses = courses.filter(
        (course) =>
            course.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (authLoading) {
        return (
            <AdminLayout title="Courses">
                <Skeleton className="h-96 rounded-xl" />
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Courses">
            <Card className="border-2">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Course Management</CardTitle>
                    <Dialog open={dialogOpen} onOpenChange={(open) => {
                        setDialogOpen(open);
                        if (!open) resetForm();
                    }}>
                        <DialogTrigger asChild>
                            <Button className="gradient-primary">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Course
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>
                                    {editingCourse ? "Edit Course" : "Add New Course"}
                                </DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <Label htmlFor="title">Course Title</Label>
                                    <Input
                                        id="title"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="price">Price (₹)</Label>
                                        <Input
                                            id="price"
                                            type="number"
                                            step="0.01"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="duration">Duration</Label>
                                        <Input
                                            id="duration"
                                            placeholder="e.g. 10 Weeks"
                                            value={formData.duration}
                                            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="level">Level</Label>
                                        <Input
                                            id="level"
                                            placeholder="Beginner, Advanced..."
                                            value={formData.level}
                                            onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="category">Category</Label>
                                        <Input
                                            id="category"
                                            placeholder="Development, Design..."
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="instructor">Instructor</Label>
                                    <Input
                                        id="instructor"
                                        value={formData.instructor}
                                        onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="image_url">Image URL</Label>
                                    <Input
                                        id="image_url"
                                        value={formData.image_url}
                                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                    />
                                </div>

                                <Button type="submit" className="w-full gradient-primary">
                                    {editingCourse ? "Update Course" : "Create Course"}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    <div className="mb-4 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search courses..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {loading ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-16" />
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-lg border overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Duration</TableHead>
                                        <TableHead>Level</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredCourses.map((course) => (
                                        <TableRow key={course.id}>
                                            <TableCell className="font-medium">{course.title}</TableCell>
                                            <TableCell>₹{course.price}</TableCell>
                                            <TableCell>{course.duration}</TableCell>
                                            <TableCell>{course.level}</TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(course)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => confirmDelete(course.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {filteredCourses.length === 0 && !loading && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8">No courses found.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the course
                            and remove it from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AdminLayout>
    );
};

export default AdminCourses;
