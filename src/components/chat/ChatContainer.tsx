import { useLocation } from "react-router-dom";
import ChatAssistant from "./ChatAssistant";

// Routes where the chat assistant should appear
const PUBLIC_ROUTES = [
  "/",
  "/precios",
  "/faq",
  "/contacto",
  "/blog",
  "/clausulas-abusivas-alquiler",
  "/devolucion-fianza-alquiler",
  "/subida-alquiler-2026",
  "/aviso-legal",
  "/privacidad",
  "/terminos",
  "/cookies",
  "/transparencia-ia",
  "/desistimiento",
  "/accesibilidad",
];

// Routes where chat should NOT appear
const EXCLUDED_ROUTES = [
  "/dashboard",
  "/analizar",
  "/resultado",
  "/perfil",
  "/admin",
  "/login",
  "/registro",
  "/recuperar-contrasena",
  "/reset-password",
];

const ChatContainer = () => {
  const location = useLocation();
  const pathname = location.pathname;

  // Check if current route is excluded
  const isExcluded = EXCLUDED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isExcluded) {
    return null;
  }

  // Check if current route is in public routes or is a blog post
  const isPublicRoute =
    PUBLIC_ROUTES.includes(pathname) || pathname.startsWith("/blog/");

  if (!isPublicRoute) {
    return null;
  }

  return <ChatAssistant />;
};

export default ChatContainer;
