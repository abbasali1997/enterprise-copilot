import ChangeWorkspacePage from "@/pages/workspace/ChangeWorkspacePage.tsx";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import HealthPage from "@/pages/health/HealthPage.tsx";
import { AuthContext, AuthProvider } from "@/contexts/authContext.tsx";
import HomePage from "@/pages/home/HomePage.tsx";
import AuthPage from "@/pages/auth/AuthPage.tsx";
import { useContext } from "react";
import WorkspacePage from "@/pages/workspace/WorkspacePage.tsx";
import { can, PERMISSIONS } from "@enterprise/auth/permissions";
import InvitationReply from "@/pages/invitation/InvitationReply.tsx";

const ProtectedRoute = () => {
  const value = useContext(AuthContext);
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  if (value?.isLoading) {
    return (
      <div
        role="status"
        className="flex min-h-screen items-center justify-center text-gray-500"
      >
        Checking your session...
      </div>
    );
  }

  if (!value || !value.user) return <Navigate to={from} replace />;

  return <Outlet />;
};

const ProtectedAdminRoute = () => {
  const value = useContext(AuthContext);
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  if (value?.isLoading) {
    return (
      <div
        role="status"
        className="flex min-h-screen items-center justify-center text-gray-500"
      >
        Checking your session...
      </div>
    );
  }

  if (!value || !value.user)
    return <Navigate to="/login" state={{ from: location }} replace />;

  const isAllowed = can(
    value.user.organization.role,
    PERMISSIONS.ORGANIZATION_VIEW,
  );

  if (!isAllowed) return <Navigate to={from} replace />;

  return <Outlet />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen">
          <Routes>
            <Route path="/health" Component={HealthPage} />
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/invitation/:token" element={<InvitationReply />} />
            <Route element={<ProtectedRoute />}>
              <Route
                path="/workspaces/change"
                element={<ChangeWorkspacePage />}
              />
            </Route>
            <Route element={<ProtectedAdminRoute />}>
              <Route path="/workspace" element={<WorkspacePage />} />
            </Route>
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
