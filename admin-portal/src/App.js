import { useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminLogin from "./pages/AdminLogin";
import Approval from "./pages/Approval";
import Entry from "./pages/Entry";
import RestLogin from "./pages/RestLogin";
import RestPanel from "./pages/RestPanel";

function useFoodBackgroundMotion() {
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let offset = 0;
    let frame = null;

    const syncBackgroundMotion = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY;

      offset += delta * 0.18;
      offset = Math.max(-180, Math.min(180, offset));

      document.body.style.setProperty("--food-scroll-y", `${offset.toFixed(1)}px`);
      lastScrollY = currentScrollY;
      frame = null;
    };

    const handleScroll = () => {
      if (frame !== null) return;
      frame = window.requestAnimationFrame(syncBackgroundMotion);
    };

    document.body.style.setProperty("--food-scroll-y", "0px");
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      if (frame !== null) {
        window.cancelAnimationFrame(frame);
      }
      window.removeEventListener("scroll", handleScroll);
      document.body.style.setProperty("--food-scroll-y", "0px");
    };
  }, []);
}

function RequireAuth({ children }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return null;
  if (!isSignedIn) return <Navigate to="/" replace />;
  return children;
}

function RequireAdmin({ children }) {
  const token = localStorage.getItem("admin_token");
  if (!token) return <Navigate to="/admin-login" replace />;
  return children;
}

export default function App() {
  useFoodBackgroundMotion();

  return (
    <Routes>
      <Route path="/" element={<Entry />} />

      <Route path="/admin-login" element={<AdminLogin />} />
      <Route
        path="/approval"
        element={
          <RequireAdmin>
            <Approval />
          </RequireAdmin>
        }
      />
      <Route path="/login" element={<RestLogin />} />

      <Route
        path="/panel"
        element={
          <RequireAuth>
            <RestPanel />
          </RequireAuth>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
