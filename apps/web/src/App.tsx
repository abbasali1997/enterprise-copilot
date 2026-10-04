import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HealthPage from "@/pages/health/HealthPage.tsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/health" Component={HealthPage} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
