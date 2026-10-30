import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/DashboardProtected";

import HomePage from "./components/pages/HomePage";
import LoginPage from "./components/pages/LoginPage";
import RegisterPage from "./components/pages/RegisterPage";
import CustomerDashboard from "./components/pages/DashboardPage";
import FindMechanic from "./components/pages/FindMechanic";
import Notifications from "./components/pages/Notifications";



function App() {
  return(
    <>
    
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage/>}/>
        <Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <CustomerDashboard />
    </ProtectedRoute>
  }
/>
<Route
  path="/find-mechanic"
  element={
    <ProtectedRoute>
      <FindMechanic />
    </ProtectedRoute>
  }
/>
<Route
  path="/notifications"
  element={
    <ProtectedRoute>
      <Notifications />
    </ProtectedRoute>
  }
/>
      </Routes>
   
    
    </>
   
  ) 
  
}

export default App;