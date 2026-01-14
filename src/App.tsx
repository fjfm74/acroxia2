import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "./contexts/AuthContext";
import { trackPageView } from "@/lib/analytics";
import ScrollToTop from "./components/ScrollToTop";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminRoute from "./components/auth/AdminRoute";
import ProfessionalRoute from "./components/auth/ProfessionalRoute";
import DashboardPro from "./pages/DashboardPro";
import SettingsPage from "./pages/pro/SettingsPage";
import CreateContractPage from "./pages/pro/CreateContractPage";
import Index from "./pages/Index";
import Pricing from "./pages/Pricing";
import Profile from "./pages/Profile";
import FAQ from "./pages/FAQ";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Analyze from "./pages/Analyze";
import AnalyzePublic from "./pages/AnalyzePublic";
import AnalysisResult from "./pages/AnalysisResult";
import FreeResultPreview from "./pages/FreeResultPreview";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminBlog from "./pages/admin/AdminBlog";
import AdminBlogNew from "./pages/admin/AdminBlogNew";
import AdminBlogEdit from "./pages/admin/AdminBlogEdit";
import AdminSocial from "./pages/admin/AdminSocial";
import AdminSocialNew from "./pages/admin/AdminSocialNew";
import AdminSocialEdit from "./pages/admin/AdminSocialEdit";
import AdminDocuments from "./pages/admin/AdminDocuments";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminBOE from "./pages/admin/AdminBOE";
import NotFound from "./pages/NotFound";
import AvisoLegal from "./pages/legal/AvisoLegal";
import Privacidad from "./pages/legal/Privacidad";
import Terminos from "./pages/legal/Terminos";
import Cookies from "./pages/legal/Cookies";
import TransparenciaIA from "./pages/legal/TransparenciaIA";
import Desistimiento from "./pages/legal/Desistimiento";
import Accesibilidad from "./pages/legal/Accesibilidad";
import ClausulasAbusivas from "./pages/seo/ClausulasAbusivas";
import DevolucionFianza from "./pages/seo/DevolucionFianza";
import SubidaAlquiler2026 from "./pages/seo/SubidaAlquiler2026";
import Contacto from "./pages/Contacto";
import Inmobiliarias from "./pages/profesionales/Inmobiliarias";
import Gestorias from "./pages/profesionales/Gestorias";
import Propietarios from "./pages/Propietarios";
import CookieBanner from "./components/CookieBanner";
import ChatContainer from "./components/chat/ChatContainer";
import AprobarPost from "./pages/AprobarPost";
import Unsubscribe from "./pages/Unsubscribe";

const queryClient = new QueryClient();

// SPA Page View Tracker Component
const PageViewTracker = () => {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location]);

  return null;
};

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <PageViewTracker />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/precios" element={<Pricing />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/contacto" element={<Contacto />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/login" element={<Login />} />
              <Route path="/registro" element={<Register />} />
              <Route path="/recuperar-contrasena" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/perfil" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/analizar" element={<ProtectedRoute><Analyze /></ProtectedRoute>} />
              <Route path="/resultado/:id" element={<ProtectedRoute><AnalysisResult /></ProtectedRoute>} />
              <Route path="/analizar-gratis" element={<AnalyzePublic />} />
              <Route path="/resultado-previo/:id" element={<FreeResultPreview />} />
              <Route path="/pro" element={<ProfessionalRoute><DashboardPro /></ProfessionalRoute>} />
              <Route path="/pro/configuracion" element={<ProfessionalRoute><SettingsPage /></ProfessionalRoute>} />
              <Route path="/pro/crear-contrato" element={<ProfessionalRoute><CreateContractPage /></ProfessionalRoute>} />
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin/blog" element={<AdminRoute><AdminBlog /></AdminRoute>} />
              <Route path="/admin/blog/nuevo" element={<AdminRoute><AdminBlogNew /></AdminRoute>} />
              <Route path="/admin/blog/editar/:id" element={<AdminRoute><AdminBlogEdit /></AdminRoute>} />
              <Route path="/admin/social" element={<AdminRoute><AdminSocial /></AdminRoute>} />
              <Route path="/admin/social/nuevo" element={<AdminRoute><AdminSocialNew /></AdminRoute>} />
              <Route path="/admin/social/editar/:id" element={<AdminRoute><AdminSocialEdit /></AdminRoute>} />
              <Route path="/admin/documentos" element={<AdminRoute><AdminDocuments /></AdminRoute>} />
              <Route path="/admin/usuarios" element={<AdminRoute><AdminUsers /></AdminRoute>} />
              <Route path="/admin/boe" element={<AdminRoute><AdminBOE /></AdminRoute>} />
              <Route path="/aviso-legal" element={<AvisoLegal />} />
              <Route path="/privacidad" element={<Privacidad />} />
              <Route path="/terminos" element={<Terminos />} />
              <Route path="/cookies" element={<Cookies />} />
              <Route path="/transparencia-ia" element={<TransparenciaIA />} />
              <Route path="/desistimiento" element={<Desistimiento />} />
              <Route path="/accesibilidad" element={<Accesibilidad />} />
              <Route path="/clausulas-abusivas-alquiler" element={<ClausulasAbusivas />} />
              <Route path="/devolucion-fianza-alquiler" element={<DevolucionFianza />} />
              <Route path="/subida-alquiler-2026" element={<SubidaAlquiler2026 />} />
              <Route path="/profesionales/inmobiliarias" element={<Inmobiliarias />} />
              <Route path="/profesionales/gestorias" element={<Gestorias />} />
              <Route path="/propietarios" element={<Propietarios />} />
              <Route path="/aprobar-post/:token" element={<AprobarPost />} />
              <Route path="/unsubscribe" element={<Unsubscribe />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <CookieBanner />
            <ChatContainer />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
