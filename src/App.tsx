import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Terms from "./pages/Terms";
import BadgePreview from "./pages/BadgePreview";
import CinematicPreview from "./pages/CinematicPreview";
import Profile from "./pages/Profile";
import ResetPassword from "./pages/ResetPassword";
import Leaderboard from "./pages/Leaderboard";
import Shop from "./pages/Shop";
import NotFound from "./pages/NotFound";
 import AllBadges from "./pages/AllBadges";
import AdminTest from "./pages/AdminTest";

// Mökki pages pull in three.js, so they are split into their own chunks
const Mokki = lazy(() => import("./pages/Mokki"));
const MokkiScenePreview = lazy(() => import("./pages/MokkiScenePreview"));
const VedotPreview = lazy(() => import("./pages/VedotPreview"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/badge-preview" element={<BadgePreview />} />
          <Route path="/cinematic-preview" element={<CinematicPreview />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/shop" element={<Shop />} />
           <Route path="/badges" element={<AllBadges />} />
          <Route path="/admin-test" element={<AdminTest />} />
          <Route path="/mokki" element={<Suspense fallback={null}><Mokki /></Suspense>} />
          <Route path="/mokki/:userId" element={<Suspense fallback={null}><Mokki /></Suspense>} />
          {import.meta.env.DEV && (
            <Route path="/mokki-preview" element={<Suspense fallback={null}><MokkiScenePreview /></Suspense>} />
          )}
          {import.meta.env.DEV && (
            <Route path="/vedot-preview" element={<Suspense fallback={null}><VedotPreview /></Suspense>} />
          )}
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
