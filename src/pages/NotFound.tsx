import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();
  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: "#080F0D" }}>
      <div className="text-center">
        <div className="text-8xl font-heading font-extrabold mb-4" style={{ color: "rgba(61,190,181,0.3)" }}>404</div>
        <h1 className="text-2xl font-heading font-bold text-white mb-2">Page not found</h1>
        <p className="mb-6" style={{ color: "rgba(255,255,255,0.4)" }}>Oops! The page you're looking for doesn't exist.</p>
        <Link to="/" className="inline-block px-6 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90" style={{ background: "#3DBEB5" }}>
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
