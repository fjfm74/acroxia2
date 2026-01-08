import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef, useEffect, useState } from "react";

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
  className?: string;
}

const FadeIn = ({ children, delay = 0, direction = "up", className }: FadeInProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });
  const prefersReducedMotion = useReducedMotion();
  const [forceVisible, setForceVisible] = useState(false);

  // Fallback: si después de 1s no se ha activado, forzar visibilidad
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isInView) {
        setForceVisible(true);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [isInView]);

  const shouldShow = isInView || forceVisible || prefersReducedMotion;

  const directions = {
    up: { y: 40, x: 0 },
    down: { y: -40, x: 0 },
    left: { x: 40, y: 0 },
    right: { x: -40, y: 0 },
  };

  // Si prefiere movimiento reducido, mostrar sin animación
  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...directions[direction] }}
      animate={shouldShow ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default FadeIn;
