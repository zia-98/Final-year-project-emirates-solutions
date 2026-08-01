import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DebugAdmin = () => {
    const { user, loading: authLoading } = useAuth();
    const [roles, setRoles] = useState<any>(null);
    const [rpcResult, setRpcResult] = useState<any>(null);
    const [error, setError] = useState<any>(null);

    const checkStatus = async () => {
        if (!user) return;

        try {
            // Check 1: Direct table query
            const { data: roleData, error: roleError } = await supabase
                .from("user_roles")
                .select("*")
                .eq("user_id", user.id);

            setRoles(roleData || []);
            if (roleError) setError(prev => ({ ...prev, roleError }));

            // Check 2: RPC call
            const { data: rpcData, error: rpcError } = await supabase.rpc("has_role", {
                _user_id: user.id,
                _role: "admin",
            });

            setRpcResult(rpcData);
            if (rpcError) setError(prev => ({ ...prev, rpcError }));

        } catch (err) {
            setError(prev => ({ ...prev, general: err }));
        }
    };

    useEffect(() => {
        checkStatus();
    }, [user]);

    if (authLoading) return <div>Loading Auth...</div>;

    return (
        <div className="p-8 max-w-2xl mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Admin Debugger</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 bg-muted rounded-md">
                        <h3 className="font-bold mb-2">Auth User</h3>
                        {user ? (
                            <pre className="text-xs">{JSON.stringify({ id: user.id, email: user.email }, null, 2)}</pre>
                        ) : (
                            <p className="text-red-500">Not Logged In</p>
                        )}
                    </div>

                    <div className="p-4 bg-muted rounded-md">
                        <h3 className="font-bold mb-2">User Roles Table (public.user_roles)</h3>
                        <pre className="text-xs">{JSON.stringify(roles, null, 2)}</pre>
                    </div>

                    <div className="p-4 bg-muted rounded-md">
                        <h3 className="font-bold mb-2">RPC has_role Result</h3>
                        <pre className="text-xs">{JSON.stringify(rpcResult, null, 2)}</pre>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-100 text-red-800 rounded-md">
                            <h3 className="font-bold mb-2">Errors</h3>
                            <pre className="text-xs">{JSON.stringify(error, null, 2)}</pre>
                        </div>
                    )}

                    <Button onClick={checkStatus}>Refresh Diagnostics</Button>
                </CardContent>
            </Card>
        </div>
    );
};

export default DebugAdmin;
