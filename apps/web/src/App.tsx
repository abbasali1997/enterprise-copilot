import { BrowserRouter, Routes, Route } from "react-router-dom";
import HealthPage from "@/pages/health/HealthPage.tsx";
import Navbar from "@/components/navbar/Navbar.tsx";
import { AuthProvider } from "@/contexts/authContext.tsx";
import HomePage from "@/pages/home/HomePage.tsx";
import AuthPage from "@/pages/auth/AuthPage.tsx";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="grid grid-rows-[auto_1fr] min-h-screen">
          <div>
            <Navbar />
          </div>

          <div>
            <Routes>
              <Route path="/health" Component={HealthPage} />
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<AuthPage />} />
              {/*<Route element={<ProtectedAdminRoute />}>*/}
              {/*  <Route path="/admin" element={<Admin />} />*/}
              {/*</Route>*/}
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
