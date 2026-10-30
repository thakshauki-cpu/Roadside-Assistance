import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/DashboardProtected";

import HomePage from "./components/pages/HomePage";
import LoginPage from "./components/pages/LoginPage";
import RegisterPage from "./components/pages/RegisterPage";
import CustomerDashboard from "./components/pages/DashboardPage";
import FindMechanic from "./components/pages/FindMechanic";
import Notifications from "./components/pages/Notifications";

import Location from "./components/pages/getHelp/Location";
import VehicleType from "./components/pages/getHelp/VehicleType";
import Problem from "./components/pages/getHelp/Problem";
import MechanicFound from "./components/pages/getHelp/MechanicFound";
import Tracking from "./components/pages/getHelp/Tracking";
import Summary from "./components/pages/getHelp/Summary";

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

<Route
  path="/get-help/location"
  element={
    <ProtectedRoute>
      <Location />
    </ProtectedRoute>
  }
/>
<Route
  path="/get-help/vehicle"
  element={
    <ProtectedRoute>
      <VehicleType />
    </ProtectedRoute>
  }
/>

<Route
  path="/get-help/problem"
  element={
    <ProtectedRoute>
      <Problem />
    </ProtectedRoute>
  }
/>
<Route
  path="/get-help/mechanic-found"
  element={
    <ProtectedRoute>
      <MechanicFound />
    </ProtectedRoute>
  }
/>

{/* Step 5: Tracking (Mechanic is on the way) */}
<Route
  path="/get-help/tracking"
  element={
    <ProtectedRoute>
      <Tracking />
    </ProtectedRoute>
  }
/>

{/* Step 6: Summary (Service completed, payment and rating) */}
<Route
  path="/get-help/summary"
  element={
    <ProtectedRoute>
      <Summary />
    </ProtectedRoute>
  }
/>






      </Routes>
   
    
    </>
   
  ) 
  
}

export default App;