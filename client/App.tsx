import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import ClassSelect from "./pages/ClassSelect";
import Practice from "./pages/Practice";
import Tutor from "./pages/Tutor";
import Gamification from "./pages/Gamification";
import AdaptiveTest from "./pages/AdaptiveTest";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import Assessment from "./pages/Assessment";
import Mistakes from "./pages/Mistakes";
import { ThemeProvider } from "@/components/ThemeProvider";
import { I18nProvider } from "@/lib/i18n";
import { AuthProvider } from "@/hooks/useAuth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nProvider>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/assessment" element={<Assessment />} />
                <Route path="/mistakes" element={<Mistakes />} />
                <Route path="/class" element={<ClassSelect />} />
                <Route path="/practice" element={<Practice />} />
                <Route path="/tutor" element={<Tutor />} />
                <Route path="/adaptive-test" element={<AdaptiveTest />} />
                <Route path="/gamification" element={<Gamification />} />
                <Route path="/settings" element={<Settings />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </I18nProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
