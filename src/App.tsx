import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { toast } from "sonner";
import { StudentAuthProvider } from "@/context/StudentAuthContext";
import { AcademicYearProvider } from "@/context/AcademicYearContext";
import { DateFilterProvider } from "@/context/DateFilterContext";
import { DeletedItemsProvider } from "@/context/DeletedItemsContext";
import PWAInstallBanner from "@/components/PWAInstallBanner";
import LoginPage from "./pages/LoginPage";
import StudentLayout from "./components/StudentLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import StudentDashboard from "./pages/StudentDashboard";
import HomeworkPage from "./pages/HomeworkPage";
import ResultsPage from "./pages/ResultsPage";
import ComplaintsPage from "./pages/ComplaintsPage";
import AnnouncementsPage from "./pages/AnnouncementsPage";
import AcademicPerformancePage from "./pages/AcademicPerformancePage";
import AIInsightPage from "./pages/AIInsightPage";
import FeesPage from "./pages/FeesPage";
import BinPage from "./pages/BinPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function usePWAUpdateToast() {
  useEffect(() => {
    const handler = (e: Event) => {
      const { updateSW } = (e as CustomEvent).detail;
      toast.success("EDULinker update ho gaya! Reload ho raha hai...", {
        duration: 3000,
      });
      setTimeout(() => updateSW(true), 3000);
    };
    window.addEventListener("pwa-update-available", handler);
    return () => window.removeEventListener("pwa-update-available", handler);
  }, []);
}

const AppContent = () => {
  usePWAUpdateToast();

  return (
    <BrowserRouter>
      <StudentAuthProvider>
        <AcademicYearProvider>
          <DateFilterProvider>
            <DeletedItemsProvider>
              <PWAInstallBanner />
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route
                  element={
                    <ProtectedRoute>
                      <StudentLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/student-dashboard" element={<StudentDashboard />} />
                  <Route path="/homework" element={<HomeworkPage />} />
                  <Route path="/results" element={<ResultsPage />} />
                  <Route path="/complaints" element={<ComplaintsPage />} />
                  <Route path="/announcements" element={<AnnouncementsPage />} />
                  <Route path="/academic-performance" element={<AcademicPerformancePage />} />
                  <Route path="/ai-insight" element={<AIInsightPage />} />
                  <Route path="/fees" element={<FeesPage />} />
                  <Route path="/bin" element={<BinPage />} />
                </Route>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </DeletedItemsProvider>
          </DateFilterProvider>
        </AcademicYearProvider>
      </StudentAuthProvider>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppContent />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
