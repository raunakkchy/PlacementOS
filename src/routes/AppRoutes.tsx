import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { LoginPage } from "../pages/Login";
import { RegisterPage } from "../pages/Register";
import { ForgotPasswordPage } from "../pages/ForgotPassword";
import { CollegeRegisterPage } from "../pages/CollegeRegister";
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

interface AppRoutesProps {
  user: any | null;
  onAuthSuccess: (authData: AuthResponse) => void;
  dashboardComponent:
    | React.ReactNode
    | ((navigate: (path: string, options?: any) => void) => React.ReactNode);
}

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
      navigate("/admin/colleges");
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
    user?.role === "admin"
      ? "/admin/colleges"
      : user?.role === "placement_officer"
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
      <Route
        path="/admin/colleges"
        element={
          user ? (
            user.role === "admin" ? (
              <AdminCollegesPage
                user={user}
                onLogout={async () => {
                  await logoutStudent();
                  window.location.href = "/login";
                }}
              />
            ) : (
              <Navigate to={defaultUserHome} replace />
            )
          ) : (
            <Navigate to="/login" replace state={{ from: location }} />
          )
        }
      />
      <Route
        path="/admin"
        element={<Navigate to="/admin/colleges" replace />}
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
