import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Internship } from "@/components/Internships";

export const useInternships = () => {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const fetchInternships = async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from("internships")
          .select("*")
          .order("created_at", { ascending: false });

        if (fetchError) throw fetchError;
        setInternships(data as any || []);
      } catch (err) {
        console.error("Error fetching internships:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchInternships();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('internships-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'internships'
        },
        (payload) => {
          console.log('Real-time update received:', payload);
          if (payload.eventType === 'INSERT') {
            setInternships((prev) => [payload.new as Internship, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setInternships((prev) =>
              prev.map((item) => (item.id === payload.new.id ? (payload.new as Internship) : item))
            );
          } else if (payload.eventType === 'DELETE') {
            setInternships((prev) => prev.filter((item) => item.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);


  return { internships, loading, error };
};
