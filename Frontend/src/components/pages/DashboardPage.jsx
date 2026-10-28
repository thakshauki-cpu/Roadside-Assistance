import DashboardSidebar from "../Dashboard/Sidebar.jsx";
import DashboardTopbar from "../Dashboard/Topbar.jsx";
import DashboardWelcome from "../Dashboard/Welcome.jsx";


import "../styles/DashboardPage.css";

function CustomerDashboard() {
  return (
    <div className="customer-dashboard">
      <DashboardSidebar />

      <main className="customer-dashboard-main">
        <DashboardTopbar />
        <DashboardWelcome/>
      </main>
    </div>
  );
}

export default CustomerDashboard;