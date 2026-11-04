import { Navigate, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/DashboardProtected";

import HomePage from "./components/pages/HomePage";
import LoginPage from "./components/pages/LoginPage";
import RegisterPage from "./components/pages/RegisterPage";
import CustomerDashboard from "./components/pages/DashboardPage";
import FindMechanic from "./components/pages/FindMechanic";
import Notifications from "./components/pages/Notifications";
import ProfilePage from "./components/pages/ProfilePage";



import Location from "./components/pages/getHelp/Location";
import VehicleType from "./components/pages/getHelp/VehicleType";
import Problem from "./components/pages/getHelp/Problem";
import MechanicFound from "./components/pages/getHelp/MechanicFound";
import Tracking from "./components/pages/getHelp/Tracking";
import Summary from "./components/pages/getHelp/Summary";




import MechanicRegisterPage from "./components/pages/Mechanic/MechanicRegisterPage";
import MechanicDashboard from "./components/pages/Mechanic/MechanicDashboard";
import ServiceRequests from "./components/pages/Mechanic/ServiceRequests";
import MechanicProtectedRoute from "./components/Mechanic/MechanicProtectedRoute";

import AdminProtectedRoute from "./components/Admin/AdminProtectedRoute";
import AdminLogin from "./components/pages/Admin/AdminLogin";
import AdminDashboard from "./components/pages/Admin/AdminDashboard";
import AdminCustomers from "./components/pages/Admin/AdminCustomers";
import AdminReviews from "./components/pages/Admin/AdminReviews";
import AdminMechanics from "./components/pages/Admin/AdminMechanics";
import AdminVerification from "./components/pages/Admin/AdminVerification";

function App() {
  return(
    <>
    
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage/>}/>
        <Route  path="/mechanic-register" element={<MechanicRegisterPage />} />
 
  




        <Route path="/dashboard"    element={ <ProtectedRoute> <CustomerDashboard />  </ProtectedRoute>  }/>
          
       
           <Route
  path="/profile"
  element={
    <ProtectedRoute>
      <ProfilePage />
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

{/*  Tracking (Mechanic is on the way) */}
<Route
  path="/get-help/tracking"
  element={
    <ProtectedRoute>
      <Tracking />
    </ProtectedRoute>
  }
/>

{/* Summary (Service completed, payment and rating) */}
<Route
  path="/get-help/summary"
  element={
    <ProtectedRoute>
      <Summary />
    </ProtectedRoute>
  }
/>



{/* Mechanic Dashboard */}
<Route path="/mechanic/dashboard" element={<MechanicProtectedRoute><MechanicDashboard /></MechanicProtectedRoute>} />
<Route path="/mechanic/requests" element={<MechanicProtectedRoute><ServiceRequests /></MechanicProtectedRoute>} />



{/* Admin Routes */}
<Route path="/admin" element={<Navigate to="/admin/login" />} />
<Route path="/admin/login" element={<AdminLogin />} />

<Route path="/admin/dashboard" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
<Route path="/admin/customers" element={<AdminProtectedRoute><AdminCustomers /></AdminProtectedRoute>} />
<Route path="/admin/reviews" element={<AdminProtectedRoute><AdminReviews /></AdminProtectedRoute>} />
<Route path="/admin/mechanics" element={<AdminProtectedRoute><AdminMechanics /></AdminProtectedRoute>} />
<Route path="/admin/verification" element={<AdminProtectedRoute><AdminVerification /></AdminProtectedRoute>} />

</Routes>
   
    
    </>
   
  ) 
  
}

export default App;