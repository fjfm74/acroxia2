import { useEffect, Suspense, lazy } from "react";
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
import LandlordRoute from "./components/auth/LandlordRoute";
import { PaymentTestModeBanner } from "./components/PaymentTestModeBanner";

// Critical page - loaded eagerly (landing page)
import Index from "./pages/Index";

// Lazy loaded pages - split by route
const Pricing = lazy(() => import("./pages/Pricing"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Contacto = lazy(() => import("./pages/Contacto"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Profile = lazy(() => import("./pages/Profile"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const DashboardLandlord = lazy(() => import("./pages/DashboardLandlord"));
const DashboardPro = lazy(() => import("./pages/DashboardPro"));
const Analyze = lazy(() => import("./pages/Analyze"));
const AnalyzePublic = lazy(() => import("./pages/AnalyzePublic"));
const AnalysisResult = lazy(() => import("./pages/AnalysisResult"));
const FreeResultPreview = lazy(() => import("./pages/FreeResultPreview"));

// Landlord pages
const MyContractsPage = lazy(() => import("./pages/landlord/MyContractsPage"));
const CreateContractLandlordPage = lazy(() => import("./pages/landlord/CreateContractPage"));
const AnalyzeLandlordPage = lazy(() => import("./pages/landlord/AnalyzeLandlordPage"));

// Professional pages
const SettingsPage = lazy(() => import("./pages/pro/SettingsPage"));
const CreateContractPage = lazy(() => import("./pages/pro/CreateContractPage"));

// Admin pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminBlog = lazy(() => import("./pages/admin/AdminBlog"));
const AdminBlogNew = lazy(() => import("./pages/admin/AdminBlogNew"));
const AdminBlogEdit = lazy(() => import("./pages/admin/AdminBlogEdit"));
const AdminSocial = lazy(() => import("./pages/admin/AdminSocial"));
const AdminSocialNew = lazy(() => import("./pages/admin/AdminSocialNew"));
const AdminSocialEdit = lazy(() => import("./pages/admin/AdminSocialEdit"));
const AdminDocuments = lazy(() => import("./pages/admin/AdminDocuments"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminBOE = lazy(() => import("./pages/admin/AdminBOE"));
const AdminContactsCRM = lazy(() => import("./pages/admin/AdminContactsCRM"));

// Legal pages
const AvisoLegal = lazy(() => import("./pages/legal/AvisoLegal"));
const Privacidad = lazy(() => import("./pages/legal/Privacidad"));
const Terminos = lazy(() => import("./pages/legal/Terminos"));
const Cookies = lazy(() => import("./pages/legal/Cookies"));
const TransparenciaIA = lazy(() => import("./pages/legal/TransparenciaIA"));
const Desistimiento = lazy(() => import("./pages/legal/Desistimiento"));
const Accesibilidad = lazy(() => import("./pages/legal/Accesibilidad"));

// SEO pages
const Glosario = lazy(() => import("./pages/Glosario"));
const CalculadoraIRAV = lazy(() => import("./pages/CalculadoraIRAV"));
const ClausulasAbusivas = lazy(() => import("./pages/seo/ClausulasAbusivas"));
const DevolucionFianza = lazy(() => import("./pages/seo/DevolucionFianza"));
const SubidaAlquiler2026 = lazy(() => import("./pages/seo/SubidaAlquiler2026"));
const ContratoAlquilerPropietarios = lazy(() => import("./pages/seo/ContratoAlquilerPropietarios"));
const ImpagoAlquilerPropietarios = lazy(() => import("./pages/seo/ImpagoAlquilerPropietarios"));
const ZonasTensionadasPropietarios = lazy(() => import("./pages/seo/ZonasTensionadasPropietarios"));
const DepositoFianzaPropietarios = lazy(() => import("./pages/seo/DepositoFianzaPropietarios"));
const FinContratoAlquilerPropietarios = lazy(() => import("./pages/seo/FinContratoAlquilerPropietarios"));

// Professional landing pages
const Inmobiliarias = lazy(() => import("./pages/profesionales/Inmobiliarias"));
const Gestorias = lazy(() => import("./pages/profesionales/Gestorias"));
const Propietarios = lazy(() => import("./pages/Propietarios"));

// Utility pages
const AprobarPost = lazy(() => import("./pages/AprobarPost"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const ConfirmBlogSubscription = lazy(() => import("./pages/ConfirmBlogSubscription"));
const UnsubscribeBlog = lazy(() => import("./pages/UnsubscribeBlog"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Lazy loaded components (below the fold / non-critical)
const CookieBanner = lazy(() => import("./components/CookieBanner"));
const ChatContainer = lazy(() => import("./components/chat/ChatContainer"));

const queryClient = new QueryClient();

// Minimal page loader for Suspense fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin h-8 w-8 border-2 border-foreground border-t-transparent rounded-full" />
  </div>
);

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
            <PaymentTestModeBanner />
            <ScrollToTop />
            <PageViewTracker />
            <Routes>
              {/* Critical route - no suspense wrapper needed */}
              <Route path="/" element={<Index />} />
              
              {/* Public pages */}
              <Route path="/precios" element={<Suspense fallback={<PageLoader />}><Pricing /></Suspense>} />
              <Route path="/faq" element={<Suspense fallback={<PageLoader />}><FAQ /></Suspense>} />
              <Route path="/contacto" element={<Suspense fallback={<PageLoader />}><Contacto /></Suspense>} />
              <Route path="/blog" element={<Suspense fallback={<PageLoader />}><Blog /></Suspense>} />
              <Route path="/blog/:slug" element={<Suspense fallback={<PageLoader />}><BlogPost /></Suspense>} />
              
              {/* Auth pages */}
              <Route path="/login" element={<Suspense fallback={<PageLoader />}><Login /></Suspense>} />
              <Route path="/registro" element={<Suspense fallback={<PageLoader />}><Register /></Suspense>} />
              <Route path="/recuperar-contrasena" element={<Suspense fallback={<PageLoader />}><ForgotPassword /></Suspense>} />
              <Route path="/reset-password" element={<Suspense fallback={<PageLoader />}><ResetPassword /></Suspense>} />
              
              {/* Protected user routes */}
              <Route path="/dashboard" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><Dashboard /></Suspense></ProtectedRoute>} />
              <Route path="/inquilino" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><Dashboard /></Suspense></ProtectedRoute>} />
              <Route path="/perfil" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><Profile /></Suspense></ProtectedRoute>} />
              <Route path="/analizar" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><Analyze /></Suspense></ProtectedRoute>} />
              <Route path="/resultado/:id" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><AnalysisResult /></Suspense></ProtectedRoute>} />
              
              {/* Public analysis routes */}
              <Route path="/analizar-gratis" element={<Suspense fallback={<PageLoader />}><AnalyzePublic /></Suspense>} />
              <Route path="/resultado-previo/:id" element={<Suspense fallback={<PageLoader />}><FreeResultPreview /></Suspense>} />
              
              {/* Landlord Routes */}
              <Route path="/propietario" element={<LandlordRoute><Suspense fallback={<PageLoader />}><DashboardLandlord /></Suspense></LandlordRoute>} />
              <Route path="/propietario/analizar" element={<LandlordRoute><Suspense fallback={<PageLoader />}><AnalyzeLandlordPage /></Suspense></LandlordRoute>} />
              <Route path="/propietario/contratos" element={<LandlordRoute><Suspense fallback={<PageLoader />}><MyContractsPage /></Suspense></LandlordRoute>} />
              <Route path="/propietario/crear-contrato" element={<LandlordRoute><Suspense fallback={<PageLoader />}><CreateContractLandlordPage /></Suspense></LandlordRoute>} />
              
              {/* Professional Routes */}
              <Route path="/pro" element={<ProfessionalRoute><Suspense fallback={<PageLoader />}><DashboardPro /></Suspense></ProfessionalRoute>} />
              <Route path="/pro/configuracion" element={<ProfessionalRoute><Suspense fallback={<PageLoader />}><SettingsPage /></Suspense></ProfessionalRoute>} />
              <Route path="/pro/crear-contrato" element={<ProfessionalRoute><Suspense fallback={<PageLoader />}><CreateContractPage /></Suspense></ProfessionalRoute>} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminRoute><Suspense fallback={<PageLoader />}><AdminDashboard /></Suspense></AdminRoute>} />
              <Route path="/admin/blog" element={<AdminRoute><Suspense fallback={<PageLoader />}><AdminBlog /></Suspense></AdminRoute>} />
              <Route path="/admin/blog/nuevo" element={<AdminRoute><Suspense fallback={<PageLoader />}><AdminBlogNew /></Suspense></AdminRoute>} />
              <Route path="/admin/blog/editar/:id" element={<AdminRoute><Suspense fallback={<PageLoader />}><AdminBlogEdit /></Suspense></AdminRoute>} />
              <Route path="/admin/social" element={<AdminRoute><Suspense fallback={<PageLoader />}><AdminSocial /></Suspense></AdminRoute>} />
              <Route path="/admin/social/nuevo" element={<AdminRoute><Suspense fallback={<PageLoader />}><AdminSocialNew /></Suspense></AdminRoute>} />
              <Route path="/admin/social/editar/:id" element={<AdminRoute><Suspense fallback={<PageLoader />}><AdminSocialEdit /></Suspense></AdminRoute>} />
              <Route path="/admin/documentos" element={<AdminRoute><Suspense fallback={<PageLoader />}><AdminDocuments /></Suspense></AdminRoute>} />
              <Route path="/admin/usuarios" element={<AdminRoute><Suspense fallback={<PageLoader />}><AdminUsers /></Suspense></AdminRoute>} />
              <Route path="/admin/boe" element={<AdminRoute><Suspense fallback={<PageLoader />}><AdminBOE /></Suspense></AdminRoute>} />
              <Route path="/admin/marketing" element={<AdminRoute><Suspense fallback={<PageLoader />}><AdminContactsCRM /></Suspense></AdminRoute>} />
              
              {/* Legal pages */}
              <Route path="/aviso-legal" element={<Suspense fallback={<PageLoader />}><AvisoLegal /></Suspense>} />
              <Route path="/privacidad" element={<Suspense fallback={<PageLoader />}><Privacidad /></Suspense>} />
              <Route path="/terminos" element={<Suspense fallback={<PageLoader />}><Terminos /></Suspense>} />
              <Route path="/cookies" element={<Suspense fallback={<PageLoader />}><Cookies /></Suspense>} />
              <Route path="/transparencia-ia" element={<Suspense fallback={<PageLoader />}><TransparenciaIA /></Suspense>} />
              <Route path="/desistimiento" element={<Suspense fallback={<PageLoader />}><Desistimiento /></Suspense>} />
              <Route path="/accesibilidad" element={<Suspense fallback={<PageLoader />}><Accesibilidad /></Suspense>} />
              
              {/* SEO pages */}
              <Route path="/glosario" element={<Suspense fallback={<PageLoader />}><Glosario /></Suspense>} />
              <Route path="/calculadora-irav" element={<Suspense fallback={<PageLoader />}><CalculadoraIRAV /></Suspense>} />
              <Route path="/clausulas-abusivas-alquiler" element={<Suspense fallback={<PageLoader />}><ClausulasAbusivas /></Suspense>} />
              <Route path="/devolucion-fianza-alquiler" element={<Suspense fallback={<PageLoader />}><DevolucionFianza /></Suspense>} />
              <Route path="/subida-alquiler-2026" element={<Suspense fallback={<PageLoader />}><SubidaAlquiler2026 /></Suspense>} />
              <Route path="/contrato-alquiler-propietarios" element={<Suspense fallback={<PageLoader />}><ContratoAlquilerPropietarios /></Suspense>} />
              <Route path="/impago-alquiler-propietarios" element={<Suspense fallback={<PageLoader />}><ImpagoAlquilerPropietarios /></Suspense>} />
              <Route path="/zonas-tensionadas-propietarios" element={<Suspense fallback={<PageLoader />}><ZonasTensionadasPropietarios /></Suspense>} />
              <Route path="/deposito-fianza-propietarios" element={<Suspense fallback={<PageLoader />}><DepositoFianzaPropietarios /></Suspense>} />
              <Route path="/fin-contrato-alquiler-propietarios" element={<Suspense fallback={<PageLoader />}><FinContratoAlquilerPropietarios /></Suspense>} />
              
              {/* Professional landing pages */}
              <Route path="/profesionales/inmobiliarias" element={<Suspense fallback={<PageLoader />}><Inmobiliarias /></Suspense>} />
              <Route path="/profesionales/gestorias" element={<Suspense fallback={<PageLoader />}><Gestorias /></Suspense>} />
              <Route path="/propietarios" element={<Suspense fallback={<PageLoader />}><Propietarios /></Suspense>} />
              
              {/* Utility pages */}
              <Route path="/aprobar-post/:token" element={<Suspense fallback={<PageLoader />}><AprobarPost /></Suspense>} />
              <Route path="/unsubscribe" element={<Suspense fallback={<PageLoader />}><Unsubscribe /></Suspense>} />
              <Route path="/confirmar-blog" element={<Suspense fallback={<PageLoader />}><ConfirmBlogSubscription /></Suspense>} />
              <Route path="/blog/unsubscribe" element={<Suspense fallback={<PageLoader />}><UnsubscribeBlog /></Suspense>} />
              
              {/* 404 */}
              <Route path="*" element={<Suspense fallback={<PageLoader />}><NotFound /></Suspense>} />
            </Routes>
            
            {/* Non-critical components loaded after main content */}
            <Suspense fallback={null}>
              <CookieBanner />
            </Suspense>
            <Suspense fallback={null}>
              <ChatContainer />
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
