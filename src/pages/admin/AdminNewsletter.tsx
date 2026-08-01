import { useEffect, useState } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, Download, Mail } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

interface Subscription {
  id: string;
  email: string;
  is_active: boolean;
  subscribed_at: string;
  unsubscribed_at: string | null;
}

const AdminNewsletter = () => {
  const { isAdmin, loading: authLoading } = useAdminAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchSubscriptions = async () => {
    const { data, error } = await supabase
      .from("newsletter_subscriptions")
      .select("*")
      .order("subscribed_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch subscriptions");
    } else {
      setSubscriptions(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) {
      fetchSubscriptions();
    }
  }, [isAdmin]);

  const exportEmails = () => {
    const activeEmails = subscriptions
      .filter((sub) => sub.is_active)
      .map((sub) => sub.email)
      .join("\n");

    const blob = new Blob([activeEmails], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter-subscribers-${format(new Date(), "yyyy-MM-dd")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Subscribers exported successfully");
  };

  const filteredSubscriptions = subscriptions.filter((sub) =>
    sub.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = subscriptions.filter((sub) => sub.is_active).length;
  const totalCount = subscriptions.length;

  if (authLoading) {
    return (
      <AdminLayout title="Newsletter">
        <Skeleton className="h-96 rounded-xl" />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Newsletter">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Subscribers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalCount}</p>
          </CardContent>
        </Card>
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Subscribers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{activeCount}</p>
          </CardContent>
        </Card>
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unsubscribed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-muted-foreground">{totalCount - activeCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Subscribers</CardTitle>
          <Button onClick={exportEmails} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Active Emails
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email..."
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
          ) : filteredSubscriptions.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No subscribers found</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Subscribed</TableHead>
                    <TableHead>Unsubscribed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscriptions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">{sub.email}</TableCell>
                      <TableCell>
                        <Badge variant={sub.is_active ? "default" : "secondary"}>
                          {sub.is_active ? "Active" : "Unsubscribed"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(sub.subscribed_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        {sub.unsubscribed_at
                          ? format(new Date(sub.unsubscribed_at), "MMM d, yyyy")
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminNewsletter;
