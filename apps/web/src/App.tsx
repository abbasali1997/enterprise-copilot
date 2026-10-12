import { BrowserRouter, Routes, Route } from "react-router-dom";
import HealthPage from "@/pages/health/HealthPage.tsx";
import { AuthProvider } from "@/contexts/authContext.tsx";
import HomePage from "@/pages/home/HomePage.tsx";
import AuthPage from "@/pages/auth/AuthPage.tsx";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen">
          <Routes>
            <Route path="/health" Component={HealthPage} />
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<AuthPage />} />
            {/*<Route element={<ProtectedAdminRoute />}>*/}
            {/*  <Route path="/admin" element={<Admin />} />*/}
            {/*</Route>*/}
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
