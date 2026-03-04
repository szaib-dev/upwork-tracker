"use client"
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase"; 

export function useProposals() {
  const [proposals, setProposals] = useState<any[]>([]); // Fixed TS Type
  const [loading, setLoading] = useState(true);

  const fetchProposals = useCallback(async () => {
    const { data, error } = await supabase
      .from("proposals")
      .select("*")
      .order("id", { ascending: false });
    
    if (error) {
      console.error("Supabase Fetch Error:", error.message);
    } else if (data) {
      setProposals(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProposals();

    // Set up Supabase Realtime subscription
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'proposals' },
        (payload) => {
          console.log("Realtime triggered!", payload);
          fetchProposals(); 
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchProposals]);

  const updateProposal = async (id: number, field: string, value: any) => {
    // Optimistic UI update
    setProposals((ps) => ps.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
    
    // DB update
    const { error } = await supabase.from("proposals").update({ [field]: value }).eq("id", id);
    if (error) console.error("Supabase Update Error:", error.message);
  };

  const addProposal = async (newProposal: any) => {
    console.log("Attempting to insert:", newProposal);
    
    const { data, error } = await supabase.from("proposals").insert([newProposal]).select();
    
    if (error) {
      console.error("Supabase Insert Error:", error.message);
    } else if (data) {
      console.log("Successfully inserted:", data[0]);
      setProposals((ps) => [data[0], ...ps]);
    }
  };

  return { proposals, loading, updateProposal, addProposal };
}