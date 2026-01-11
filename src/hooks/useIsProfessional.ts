import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Organization {
  id: string;
  name: string;
  logo_url: string | null;
  business_type: string;
  primary_color: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
}

export const useIsProfessional = () => {
  const { user } = useAuth();
  const [isProfessional, setIsProfessional] = useState(false);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkProfessionalStatus = async () => {
      if (!user) {
        setIsProfessional(false);
        setOrganization(null);
        setLoading(false);
        return;
      }

      try {
        // Check if user has professional or admin role (may return multiple rows)
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .in("role", ["professional", "admin"]);

        // Check if user has an organization (get the most recent one if multiple exist)
        const { data: orgData } = await supabase
          .from("organizations")
          .select("*")
          .eq("owner_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1);

        const hasProfessionalRole = roleData && roleData.length > 0;
        const hasOrganization = orgData && orgData.length > 0;
        const activeOrganization = hasOrganization ? orgData[0] : null;

        setIsProfessional(hasProfessionalRole || hasOrganization);
        setOrganization(activeOrganization as Organization | null);
      } catch (error) {
        console.error("Error checking professional status:", error);
        setIsProfessional(false);
        setOrganization(null);
      } finally {
        setLoading(false);
      }
    };

    checkProfessionalStatus();
  }, [user]);

  return { isProfessional, organization, loading };
};
