import { Routes, Route } from "react-router-dom";


import HomePage from "./components/pages/HomePage";
import LoginPage from "./components/pages/LoginPage";
import RegisterPage from "./components/pages/RegisterPage";
import CustomerDashboard from "./components/pages/DashboardPage";



function App() {
  return(
    <>
    
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage/>}/>
         <Route path="/dashboard" element={<CustomerDashboard/>}/>
      </Routes>
   
    
    </>
   
  ) 
  
}

export default App;