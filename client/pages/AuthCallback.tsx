import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import MainLayout from "@/components/layouts/MainLayout";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is now authenticated
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      } else {
        // Give it a tiny bit of time in case the state listener is processing
        const timeout = setTimeout(() => {
          navigate("/auth");
        }, 1500);
        return () => clearTimeout(timeout);
      }
    };

    checkSession();
  }, [navigate]);

  return (
    <MainLayout>
      <div className="flex flex-col h-[50vh] items-center justify-center space-y-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-veda-sky border-t-transparent"></div>
        <p className="text-muted-foreground font-semibold animate-pulse">
          Completing authentication, please wait...
        </p>
      </div>
    </MainLayout>
  );
}
