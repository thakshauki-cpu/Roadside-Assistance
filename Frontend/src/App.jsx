import { Routes, Route } from "react-router-dom";


import HomePage from "./components/pages/HomePage";
import LoginPage from "./components/pages/LoginPage";
import RegisterPage from "./components/pages/RegisterPage";
import DashboardPage from "./components/pages/DashboardPage";


function App() {
  return(
    <>
    {/* <dashboard></dashboard> */}    
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage/>}/>
      <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
   
    
    </>
   
  ) 
  
}

export default App;