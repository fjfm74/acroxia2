import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useIsLandlord = () => {
  const { user } = useAuth();
  const [isLandlord, setIsLandlord] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLandlordRole = async () => {
      if (!user) {
        setIsLandlord(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "landlord")
          .maybeSingle();

        if (error) {
          console.error("Error checking landlord role:", error);
          setIsLandlord(false);
        } else {
          setIsLandlord(!!data);
        }
      } catch (error) {
        console.error("Error checking landlord role:", error);
        setIsLandlord(false);
      } finally {
        setLoading(false);
      }
    };

    checkLandlordRole();
  }, [user]);

  return { isLandlord, loading };
};

export const checkUserIsLandlord = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "landlord")
      .maybeSingle();

    if (error) {
      console.error("Error checking landlord role:", error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error("Error checking landlord role:", error);
    return false;
  }
};
