import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
  useParams,
} from "react-router-dom";
import { LoginPage } from "../pages/Login";
import { RegisterPage } from "../pages/Register";
import { ForgotPasswordPage } from "../pages/ForgotPassword";
import { CollegeRegisterPage } from "../pages/CollegeRegister";
import { CollegeLoginPage } from "../pages/CollegeLogin";
import { AdminLoginPage } from "../pages/AdminLogin";
import { CollegeDashboard } from "../pages/CollegeDashboard";
import { PrivacyPolicy } from "../pages/PrivacyPolicy";
import { TermsOfService } from "../pages/TermsOfService";
import { AiDisclaimer } from "../pages/AiDisclaimer";
import { AboutPage } from "../pages/AboutPage";
import { FeaturesPage } from "../pages/FeaturesPage";
import { ContactPage } from "../pages/ContactPage";
import { FaqPage } from "../pages/FaqPage";
import { AdminCollegesPage } from "../pages/AdminColleges";
import { AuthResponse, logoutStudent } from "../services/auth";
import { ShieldAlert } from "lucide-react";

interface AppRoutesProps {
  user: any | null;
  onAuthSuccess: (authData: AuthResponse) => void;
  dashboardComponent:
    | React.ReactNode
    | ((navigate: (path: string, options?: any) => void) => React.ReactNode);
}

// Private Super Admin Portal with parameterized secret path (no secret exposed in client code)
const AdminPrivatePortal: React.FC<{
  user: any | null;
  onAuthSuccess: (authData: AuthResponse) => void;
}> = ({ user, onAuthSuccess }) => {
  const { secret } = useParams<{ secret: string }>();

  // If already logged in as non-admin (e.g. student or placement_officer)
  if (user && user.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#0F1012] flex items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md bg-[#16171A] border border-[#26282E] rounded-2xl p-8 shadow-2xl space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Access Denied</h1>
          <p className="text-xs text-[#A1A1AA] leading-relaxed">
            You are currently signed in as a <span className="font-semibold text-rose-300 capitalize">{user.role}</span> account. This console requires verified Super Administrator privileges.
          </p>
          <div className="pt-2">
            <button
              onClick={async () => {
                await logoutStudent();
                window.location.reload();
              }}
              className="w-full px-4 py-2.5 bg-[#FF6B00] hover:bg-[#e56000] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Sign Out & Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If unauthenticated, render AdminLoginPage
  if (!user) {
    return (
      <AdminLoginPage
        onSuccess={(authData) => {
          onAuthSuccess(authData);
        }}
        onNavigateToStudentLogin={() => {
          window.location.href = "/login";
        }}
      />
    );
  }

  // If authenticated as admin, render AdminCollegesPage
  return (
    <AdminCollegesPage
      user={user}
      onLogout={async () => {
        await logoutStudent();
        window.location.href = `/private-control/${secret || ""}`;
      }}
    />
  );
};

const RouteBridge: React.FC<AppRoutesProps> = ({
  user,
  onAuthSuccess,
  dashboardComponent,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location.pathname]);

  const handleLoginSuccess = (authData: AuthResponse) => {
    onAuthSuccess(authData);
    if (authData.user?.role === "admin") {
      if (!location.pathname.startsWith("/private-control/")) {
        navigate("/dashboard");
      }
    } else if (authData.user?.role === "placement_officer") {
      navigate("/college/dashboard");
    } else {
      navigate("/dashboard");
    }
  };

  const renderedDashboard =
    typeof dashboardComponent === "function"
      ? dashboardComponent(navigate)
      : dashboardComponent;

  const defaultUserHome =
    user?.role === "placement_officer"
      ? "/college/dashboard"
      : "/dashboard";

  return (
    <Routes>
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to={defaultUserHome} replace />
          ) : (
            <LoginPage
              onSuccess={handleLoginSuccess}
              onNavigateToRegister={() => navigate("/register")}
              onNavigateToForgotPassword={() => navigate("/forgot-password")}
            />
          )
        }
      />
      <Route
        path="/register"
        element={
          user ? (
            <Navigate to={defaultUserHome} replace />
          ) : (
            <RegisterPage
              onSuccess={handleLoginSuccess}
              onNavigateToLogin={() => navigate("/login")}
            />
          )
        }
      />
      <Route
        path="/college/register"
        element={
          user ? (
            <Navigate to={defaultUserHome} replace />
          ) : (
            <CollegeRegisterPage
              onSuccess={handleLoginSuccess}
              onNavigateToLogin={() => navigate("/login")}
              onNavigateToStudentRegister={() => navigate("/register")}
            />
          )
        }
      />
      <Route
        path="/college/login"
        element={
          user ? (
            <Navigate to={defaultUserHome} replace />
          ) : (
            <CollegeLoginPage
              onSuccess={handleLoginSuccess}
              onNavigateToLogin={() => navigate("/login")}
              onNavigateToCollegeRegister={() => navigate("/college/register")}
            />
          )
        }
      />
      <Route
        path="/forgot-password"
        element={
          <ForgotPasswordPage onNavigateToLogin={() => navigate("/login")} />
        }
      />
      <Route
        path="/dashboard"
        element={
          user ? (
            user.role === "placement_officer" ? (
              <Navigate to="/college/dashboard" replace />
            ) : (
              <>{renderedDashboard}</>
            )
          ) : (
            <Navigate to="/login" replace state={{ from: location }} />
          )
        }
      />
      <Route
        path="/student/dashboard"
        element={
          user ? (
            user.role === "placement_officer" ? (
              <Navigate to="/college/dashboard" replace />
            ) : (
              <>{renderedDashboard}</>
            )
          ) : (
            <Navigate to="/login" replace state={{ from: location }} />
          )
        }
      />
      <Route
        path="/college/dashboard"
        element={
          user ? (
            user.role === "placement_officer" || user.role === "admin" ? (
              <CollegeDashboard
                user={user}
                onLogout={async () => {
                  await logoutStudent();
                  window.location.href = "/login";
                }}
              />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          ) : (
            <Navigate to="/login" replace state={{ from: location }} />
          )
        }
      />

      {/* Secret Super Admin Private Entry Route (Parameterized, Zero Frontend Secret Storage) */}
      <Route
        path="/private-control/:secret/*"
        element={
          <AdminPrivatePortal
            user={user}
            onAuthSuccess={handleLoginSuccess}
          />
        }
      />
      <Route
        path="/private-control/:secret"
        element={
          <AdminPrivatePortal
            user={user}
            onAuthSuccess={handleLoginSuccess}
          />
        }
      />

      {/* Public Legal & Informational Pages */}
      <Route path="/privacy" element={<PrivacyPolicy user={user} />} />
      <Route path="/terms" element={<TermsOfService user={user} />} />
      <Route path="/ai-disclaimer" element={<AiDisclaimer user={user} />} />
      <Route path="/about" element={<AboutPage user={user} />} />
      <Route path="/features" element={<FeaturesPage user={user} />} />
      <Route path="/contact" element={<ContactPage user={user} />} />
      <Route path="/faq" element={<FaqPage user={user} />} />

      <Route
        path="*"
        element={
          user ? (
            <Navigate to={defaultUserHome} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
};

export const AppRoutes: React.FC<AppRoutesProps> = ({
  user,
  onAuthSuccess,
  dashboardComponent,
}) => {
  return (
    <BrowserRouter>
      <RouteBridge
        user={user}
        onAuthSuccess={onAuthSuccess}
        dashboardComponent={dashboardComponent}
      />
    </BrowserRouter>
  );
};
