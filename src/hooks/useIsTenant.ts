import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useIsTenant = () => {
  const { user } = useAuth();
  const [isTenant, setIsTenant] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkTenantRole = async () => {
      if (!user) {
        setIsTenant(false);
        setLoading(false);
        return;
      }

      try {
        // Check for tenant OR user role (user is the default/legacy role)
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .in("role", ["tenant", "user"])
          .limit(1);

        if (error) {
          console.error("Error checking tenant role:", error);
          setIsTenant(false);
        } else {
          setIsTenant(data && data.length > 0);
        }
      } catch (error) {
        console.error("Error checking tenant role:", error);
        setIsTenant(false);
      } finally {
        setLoading(false);
      }
    };

    checkTenantRole();
  }, [user]);

  return { isTenant, loading };
};

export const checkUserIsTenant = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["tenant", "user"])
      .limit(1);

    if (error) {
      console.error("Error checking tenant role:", error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error("Error checking tenant role:", error);
    return false;
  }
};
