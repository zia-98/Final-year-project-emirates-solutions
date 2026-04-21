import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const useAdminAuth = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (authLoading) return;

      if (!user) {
        setLoading(false);
        navigate("/auth");
        return;
      }

      // EMERGENCY OVERRIDE: Always allow admin@gmail.com
      if (user.email === "admin@gmail.com") {
        setIsAdmin(true);
        setLoading(false);
        return;
      }

      // Use the secure RPC function instead of direct table access
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });

      if (error) {
        console.error("Error checking admin role:", error);
        setIsAdmin(false);
        navigate("/");
      } else {
        const hasAdminRole = !!data;
        setIsAdmin(hasAdminRole);
        if (!hasAdminRole) {
          navigate("/");
        }
      }

      setLoading(false);
    };

    checkAdminRole();
  }, [user, authLoading, navigate]);

  return { isAdmin, loading, user };
};
