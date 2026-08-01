import { useEffect, useState } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, Eye, BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

interface Enrollment {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  course_id: string;
  course_name: string;
  status: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  completed: "bg-blue-100 text-blue-800",
};

const AdminEnrollments = () => {
  const { isAdmin, loading: authLoading } = useAdminAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState<string>("all");
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);

  const fetchEnrollments = async () => {
    const { data, error } = await supabase
      .from("course_enrollments")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch enrollments");
    } else {
      setEnrollments(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) {
      fetchEnrollments();
    }
  }, [isAdmin]);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from("course_enrollments")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update enrollment status");
    } else {
      toast.success("Enrollment status updated");
      fetchEnrollments();
    }
  };

  const uniqueCourses = [...new Set(enrollments.map((e) => e.course_name))];

  const filteredEnrollments = enrollments.filter((enrollment) => {
    const matchesSearch =
      enrollment.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      enrollment.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCourse = courseFilter === "all" || enrollment.course_name === courseFilter;
    return matchesSearch && matchesCourse;
  });

  // Course enrollment stats
  const courseStats = enrollments.reduce((acc, e) => {
    acc[e.course_name] = (acc[e.course_name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (authLoading) {
    return (
      <AdminLayout title="Course Enrollments">
        <Skeleton className="h-96 rounded-xl" />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Course Enrollments">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Object.entries(courseStats).slice(0, 4).map(([course, count]) => (
          <Card key={course}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground truncate">{course}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-2">
        <CardHeader>
          <CardTitle>Enrollment Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {uniqueCourses.map((course) => (
                  <SelectItem key={course} value={course}>
                    {course}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : filteredEnrollments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No enrollments found</p>
          ) : (
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEnrollments.map((enrollment) => (
                    <TableRow key={enrollment.id}>
                      <TableCell className="font-medium">{enrollment.full_name}</TableCell>
                      <TableCell>{enrollment.email}</TableCell>
                      <TableCell>{enrollment.course_name}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[enrollment.status] || ""}>
                          {enrollment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(enrollment.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedEnrollment(enrollment)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedEnrollment} onOpenChange={() => setSelectedEnrollment(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enrollment Details</DialogTitle>
          </DialogHeader>
          {selectedEnrollment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-medium">{selectedEnrollment.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedEnrollment.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedEnrollment.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Course</p>
                  <p className="font-medium">{selectedEnrollment.course_name}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">Update Status:</p>
                <Select
                  value={selectedEnrollment.status}
                  onValueChange={(value) => {
                    handleStatusUpdate(selectedEnrollment.id, value);
                    setSelectedEnrollment({ ...selectedEnrollment, status: value });
                  }}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminEnrollments;
