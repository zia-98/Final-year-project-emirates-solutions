import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { 
  Search, 
  Trash2, 
  ShieldCheck, 
  ShieldAlert, 
  Plus, 
  Mail, 
  Lock, 
  UserPlus,
  MoreHorizontal,
  User,
  Shield,
  CalendarDays,
  Phone,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  username: string | null;
  phone: string | null;
  created_at: string;
  roles?: string[];
}


const AdminUsers = () => {
  const { isAdmin, loading: authLoading } = useAdminAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", password: "", fullName: "", username: "" });
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);


  const fetchUsers = async () => {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profilesError) {
      toast.error("Failed to fetch users");
      setLoading(false);
      return;
    }

    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id, role");

    if (rolesError) {
      console.error("Error fetching roles:", rolesError);
    }

    const usersWithRoles = (profiles || []).map((profile) => ({
      ...profile,
      roles: roles?.filter((r) => r.user_id === profile.id).map((r) => r.role) || [],
    }));

    setUsers(usersWithRoles);
    setLoading(false);
  };

  useEffect(() => {
    if (!isAdmin) return;

    fetchUsers();

    // Subscribe to profiles changes
    const profileChannel = supabase
      .channel('admin-profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
        console.log('Real-time profile change:', payload);
        fetchUsers(); // Easier to re-fetch to keep user/roles sync simple
      })
      .subscribe();

    // Subscribe to user_roles changes
    const roleChannel = supabase
      .channel('admin-roles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, (payload) => {
        console.log('Real-time role change:', payload);
        fetchUsers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(roleChannel);
    };
  }, [isAdmin]);


  const filteredUsers = users.filter(
    (user) =>
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );


  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure? This will remove their database profile. Auth credentials remain in Supabase.")) return;
    
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (error) {
      toast.error("Deletion failed: " + error.message);
    } else {
      toast.success("User record removed");
      fetchUsers();
    }
    setLoading(false);
  };

  const handleToggleAdmin = async (userId: string, isCurrentlyAdmin: boolean) => {
    setLoading(true);
    if (isCurrentlyAdmin) {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", "admin");

      if (error) toast.error("Failed to revoke admin");
      else toast.success("Admin access revoked");
    } else {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: "admin" });

      if (error) toast.error("Failed to grant admin");
      else toast.success("Admin access granted");
    }
    fetchUsers();
    setLoading(false);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.email || !newUser.password) {
      toast.error("Details missing");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            full_name: newUser.fullName,
            username: newUser.username,
          }
        }

      });

      if (error) throw error;
      
      toast.success("User invited successfully!");
      setIsAddUserOpen(false);
      setNewUser({ email: "", password: "", fullName: "", username: "" });
      fetchUsers();

    } catch (error: any) {
      toast.error(error.message || "Failed to create user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: editingUser.full_name,
          username: editingUser.username,
        })
        .eq("id", editingUser.id);

      if (error) throw error;

      toast.success("User updated successfully!");
      setIsEditUserOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to update user");
    } finally {
      setIsSubmitting(false);
    }
  };


  const stats = {
    total: users.length,
    admins: users.filter(u => u.roles?.includes('admin')).length,
    newUsers: users.filter(u => {
      const joinDate = new Date(u.created_at);
      const today = new Date();
      return joinDate.toDateString() === today.toDateString();
    }).length
  };

  if (authLoading) {
    return (
      <AdminLayout title="Users">
        <Skeleton className="h-96 rounded-2xl" />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="User Directory">
      <div className="space-y-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-none shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Users</p>
                  <h3 className="text-2xl font-bold mt-1">{stats.total}</h3>
                </div>
                <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Administrators</p>
                  <h3 className="text-2xl font-bold mt-1 text-purple-600">{stats.admins}</h3>
                </div>
                <div className="h-12 w-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <ShieldCheck className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">New Today</p>
                  <h3 className="text-2xl font-bold mt-1 text-emerald-600">{stats.newUsers}</h3>
                </div>
                <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <UserPlus className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b py-6 px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold">Platform Personnel</CardTitle>
              <p className="text-sm text-slate-500 mt-1 font-medium italic">Manage user roles and accounts</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Filter users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 w-full sm:w-64 bg-white border shadow-sm rounded-xl focus:ring-primary/20"
                />
              </div>
              <Button onClick={() => setIsAddUserOpen(true)} className="h-10 px-6 rounded-xl gradient-primary shadow-lg shadow-primary/20 gap-2 font-bold">
                <Plus className="h-4 w-4" />
                Add User
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-20 text-center">
                <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium">No users match your current filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="hover:bg-transparent border-b">
                      <TableHead className="w-[300px] font-bold text-slate-600 py-4 px-8">User Profile</TableHead>
                      <TableHead className="font-bold text-slate-600">Contact</TableHead>
                      <TableHead className="font-bold text-slate-600">Roles</TableHead>
                      <TableHead className="font-bold text-slate-600">Registration</TableHead>
                      <TableHead className="text-right font-bold text-slate-600 px-8">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence mode="popLayout">
                      {filteredUsers.map((user, idx) => (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2, delay: idx * 0.05 }}
                          className="group hover:bg-slate-50/50 border-b last:border-0 transition-colors"
                        >
                          <TableCell className="py-5 px-8">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                                <AvatarFallback className="bg-slate-100 text-slate-600 font-bold text-xs uppercase">
                                  {user.full_name?.slice(0, 2) || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-900 leading-none">{user.full_name || "Unidentified User"}</span>
                                <span className="text-[11px] text-slate-500 mt-1 font-medium">@{user.username || "no-username"}</span>
                                <span className="text-[11px] text-slate-400 mt-1 uppercase tracking-wider font-bold">ID: {user.id.slice(0, 8)}</span>
                              </div>

                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                <Mail className="h-3 w-3 opacity-50" />
                                <span className="font-medium">{user.email || "—"}</span>
                              </div>
                              {user.phone && (
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-bold">
                                  <Phone className="h-3 w-3 opacity-50" />
                                  {user.phone}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1.5 flex-wrap">
                              {user.roles && user.roles.length > 0 ? (
                                user.roles.map((role) => (
                                  <Badge
                                    key={role}
                                    className={cn(
                                      "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-none border",
                                      role === "admin" 
                                        ? "bg-purple-50 text-purple-700 border-purple-200" 
                                        : "bg-blue-50 text-blue-700 border-blue-200"
                                    )}
                                  >
                                    <Shield className="h-2.5 w-2.5 mr-1" />
                                    {role}
                                  </Badge>
                                ))
                              ) : (
                                <Badge className="bg-slate-50 text-slate-500 border-slate-200 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-none border">
                                  User
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                                <CalendarDays className="h-3.5 w-3.5 opacity-50" />
                                {format(new Date(user.created_at), "MMM d, yyyy")}
                            </div>
                          </TableCell>
                          <TableCell className="text-right px-8">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56 p-2">
                                <DropdownMenuLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 pb-1">Elevate/Modify</DropdownMenuLabel>
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setEditingUser(user);
                                    setIsEditUserOpen(true);
                                  }}
                                  className="rounded-lg h-10 px-3 cursor-pointer"
                                >
                                  <User className="mr-2 h-4 w-4 text-blue-500" /> 
                                  Edit Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleToggleAdmin(user.id, user.roles?.includes("admin") || false)}

                                  className="rounded-lg h-10 px-3 cursor-pointer"
                                >
                                  {user.roles?.includes("admin") ? (
                                    <>
                                      <ShieldAlert className="mr-2 h-4 w-4 text-orange-500" /> 
                                      Revoke Admin
                                    </>
                                  ) : (
                                    <>
                                      <ShieldCheck className="mr-2 h-4 w-4 text-primary" /> 
                                      Make Admin
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="rounded-lg h-10 px-3 text-destructive focus:text-destructive cursor-pointer"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete Profile
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="rounded-2xl border-none shadow-2xl p-0 overflow-hidden max-w-md">
          <div className="gradient-primary p-6 text-white text-center">
            <UserPlus className="h-10 w-10 mx-auto mb-2 opacity-80" />
            <h2 className="text-2xl font-bold italic">Member Invitation</h2>
            <p className="text-xs text-white/70 font-medium uppercase tracking-widest mt-1">Onboard a new administrator or user</p>
          </div>
          <form onSubmit={handleCreateUser} className="p-8 space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Full Identity</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Johnathan Doe"
                  value={newUser.fullName}
                  onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                  className="pl-10 h-11 bg-slate-50 border-none shadow-inner"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Username</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="johndoe"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="pl-10 h-11 bg-slate-50 border-none shadow-inner"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Secure Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="email"
                  placeholder="name@emirates.com"
                  className="pl-10 h-11 bg-slate-50 border-none shadow-inner"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Access Protocol (Password)</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="password"
                  placeholder="Minimum 8 characters"
                  className="pl-10 h-11 bg-slate-50 border-none shadow-inner"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="pt-4 flex flex-col gap-3">
              <Button type="submit" disabled={isSubmitting} className="h-12 w-full rounded-xl gradient-primary shadow-lg shadow-primary/20 font-bold text-lg">
                {isSubmitting ? "Processing Request..." : "Issue Invitation"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setIsAddUserOpen(false)} className="h-10 text-slate-400 font-bold">
                Dismiss
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent className="rounded-2xl border-none shadow-2xl p-0 overflow-hidden max-w-md">
          <div className="gradient-primary p-6 text-white text-center">
            <User className="h-10 w-10 mx-auto mb-2 opacity-80" />
            <h2 className="text-2xl font-bold italic">Edit Profile</h2>
            <p className="text-xs text-white/70 font-medium uppercase tracking-widest mt-1">Modify user identification details</p>
          </div>
          {editingUser && (
            <form onSubmit={handleUpdateUser} className="p-8 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Full Identity</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Johnathan Doe"
                    value={editingUser.full_name || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                    className="pl-10 h-11 bg-slate-50 border-none shadow-inner"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Username</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="johndoe"
                    value={editingUser.username || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                    className="pl-10 h-11 bg-slate-50 border-none shadow-inner"
                  />
                </div>
              </div>
              <div className="pt-4 flex flex-col gap-3">
                <Button type="submit" disabled={isSubmitting} className="h-12 w-full rounded-xl gradient-primary shadow-lg shadow-primary/20 font-bold text-lg">
                  {isSubmitting ? "Saving Changes..." : "Save Changes"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setIsEditUserOpen(false)} className="h-10 text-slate-400 font-bold">
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>

  );
};

export default AdminUsers;
