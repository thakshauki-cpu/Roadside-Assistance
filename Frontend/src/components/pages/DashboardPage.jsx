
import DashboardSidebar from "../components/Dashboard/DashboardSidebar";
import DashboardTopbar from "../components/Dashboard/DashboardTopbar";
import AssistanceBanner from "../components/Dashboard/AssistanceBanner";
import VehicleCard from "../components/Dashboard/VehicleCard";
import RecentRequest from "../components/Dashboard/RecentRequest";
import NearbyMechanics from "../components/Dashboard/NearbyMechanics";
import RecentAlerts from "../components/Dashboard/RecentAlerts";

import "./DashboardPage.css";

function DashboardPage() {
  return (
    <div className="customer-dashboard">
      <DashboardSidebar />

      <div className="dashboard-main">
        <DashboardTopbar />

        <main className="dashboard-content">
          <h1 className="dashboard-welcome">
            Good Morning,
            <br />
            John!
          </h1>

          <div className="dashboard-feature-grid">
            <AssistanceBanner />
            <VehicleCard />
          </div>

          <div className="dashboard-bottom-grid">
            <RecentRequest />
            <NearbyMechanics />
            <RecentAlerts />
          </div>
        </main>
      </div>
    </div>
  );
}

export default DashboardPage;
