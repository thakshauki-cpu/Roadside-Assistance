
import { useEffect, useState } from "react";
import {
  UserRound,
  Camera,
  ShieldCheck,
  Pencil,
  Download,
  Power,
  CarFront,
  Plus,
  Bike,
  X,
  Check,
  Trash2,
} from "lucide-react";

import DashboardSidebar from "../Dashboard/Sidebar";
import DashboardTopbar from "../Dashboard/Topbar";

import "../styles/ProfilePage.css";
import {
  createCustomerVehicle,
  deleteCustomerVehicle,
  getCustomerProfile,
  getCustomerVehicles,
  updateCustomerProfile,
} from "../../api/customer";

function ProfilePage() {
  const [user, setUser] = useState(null);
  const [savedUser, setSavedUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [vehicleMessage, setVehicleMessage] = useState("");
  const [vehicleError, setVehicleError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingVehicle, setSavingVehicle] = useState(false);
  const [deletingVehicleId, setDeletingVehicleId] = useState(null);
  const [editing, setEditing] = useState(false);
  const [showAddVehicle, setShowAddVehicle] = useState(false);

  const [newVehicle, setNewVehicle] = useState({
    vehicleType: "",
    vehicleModel: "",
    vehicleNumber: "",
  });

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        const [profileData, vehicleData] = await Promise.all([
          getCustomerProfile(),
          getCustomerVehicles(),
        ]);
        if (!active) return;

        const profile = {
          fullName: profileData.profile.fullName || "",
          email: profileData.profile.email || "",
          phone: profileData.profile.mobile || "",
          location: profileData.profile.location || "",
          language: profileData.profile.preferredLanguage || "English",
        };
        setUser(profile);
        setSavedUser(profile);
        setVehicles(vehicleData.vehicles);
      } catch (error) {
        if (active) setPageError(error.message);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadProfile();
    return () => {
      active = false;
    };
  }, []);

  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((word) => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "JD";

  const handleProfileChange = (e) => {
    setUser({
      ...user,
      [e.target.name]: e.target.value,
    });
  };

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);
      setPageError("");
      setProfileMessage("");
      const result = await updateCustomerProfile({
        fullName: user.fullName,
        email: user.email,
        mobile: user.phone,
        location: user.location,
        preferredLanguage: user.language,
      });
      const updatedProfile = {
        fullName: result.profile.fullName,
        email: result.profile.email,
        phone: result.profile.mobile,
        location: result.profile.location || "",
        language: result.profile.preferredLanguage || "English",
      };
      setUser(updatedProfile);
      setSavedUser(updatedProfile);
      setEditing(false);
      setProfileMessage(result.message);
    } catch (error) {
      setPageError(error.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    try {
      setSavingVehicle(true);
      setVehicleError("");
      setVehicleMessage("");
      const result = await createCustomerVehicle({
        vehicleType: newVehicle.vehicleType,
        vehicleModel: newVehicle.vehicleModel.trim(),
        vehicleNumber: newVehicle.vehicleNumber.trim(),
      });
      setVehicles((previous) => [result.vehicle, ...previous]);
      setNewVehicle({
        vehicleType: "",
        vehicleModel: "",
        vehicleNumber: "",
      });
      setShowAddVehicle(false);
      setVehicleMessage(result.message);
    } catch (error) {
      setVehicleError(error.message);
    } finally {
      setSavingVehicle(false);
    }
  };

  const handleDeleteVehicle = async (id) => {
    try {
      setDeletingVehicleId(id);
      setVehicleError("");
      setVehicleMessage("");
      const result = await deleteCustomerVehicle(id);
      setVehicles((previous) =>
        previous.filter((vehicle) => vehicle.id !== result.vehicleId)
      );
      setVehicleMessage(result.message);
    } catch (error) {
      setVehicleError(error.message);
    } finally {
      setDeletingVehicleId(null);
    }
  };

  const handleDownloadData = () => {
    const data = {
      profile: user,
      vehicles: vehicles,
    };

    const file = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(file);
    const link = document.createElement("a");

    link.href = url;
    link.download = "roadmate-profile-data.json";
    link.click();

    URL.revokeObjectURL(url);
  };

  const handleLogoutDevices = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div className="customer-profile-layout">
        <DashboardSidebar activeItem="Profile" />
        <main className="customer-profile-main">
          <DashboardTopbar />
          <p className="profile-message" role="status">Loading your profile...</p>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="customer-profile-layout">
        <DashboardSidebar activeItem="Profile" />
        <main className="customer-profile-main">
          <DashboardTopbar />
          <p className="profile-message error" role="alert">{pageError}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="customer-profile-layout">
      <DashboardSidebar activeItem="Profile" />

      <main className="customer-profile-main">
        <DashboardTopbar />

        <section className="profile-content">
          {pageError && <p className="profile-message error" role="alert">{pageError}</p>}
          {profileMessage && <p className="profile-message success" role="status">{profileMessage}</p>}
          {vehicleMessage && <p className="profile-message success" role="status">{vehicleMessage}</p>}

          {/* Page Heading */}
          <div className="profile-heading">
            <div>
              

              <h1>Profile &amp; Account Settings</h1>

              <p>
                Manage your personal details, registered vehicles, and
                roadside security preferences.
              </p>
            </div>

            <div className="profile-heading-actions">
              <button
                className="profile-outline-btn"
                onClick={handleDownloadData}
              >
                <Download size={15} />
                Download Data
              </button>

              <button
                className="profile-logout-btn"
                onClick={handleLogoutDevices}
              >
                <Power size={15} />
                Log Out of Devices
              </button>
            </div>
          </div>

          {/* Main Profile Grid */}
          <div className="profile-grid">

            {/* Left Column */}
            <div className="profile-left-column">

              {/* User Profile Card */}
              <section className="profile-user-card">
                <div className="profile-avatar-wrapper">
                  <div className="profile-avatar">
                    {initials}
                  </div>

                
                </div>

                <h2>{user.fullName || "Customer Name"}</h2>

                <p className="profile-user-location">
                  {user.location || "Add your location"}
                </p>

                <div className="profile-verified">
                  <ShieldCheck size={12} />
                  Verified Roadside Member
                </div>
              </section>

              {/* Account Details */}
              <section className="profile-details-card">
                <div className="profile-card-heading">
                  <div>
                    <h3>Account Details</h3>
                    <p>
                      Personal identifiers used during emergency dispatches.
                    </p>
                  </div>

                  <UserRound size={19} />
                </div>

                {editing ? (
                  <div className="profile-edit-form">

                    <label>
                      Legal Full Name
                      <input
                        name="fullName"
                        value={user.fullName}
                        onChange={handleProfileChange}
                        placeholder="Enter your full name"
                      />
                    </label>

                    <label>
                      Email Address
                      <input
                        type="email"
                        name="email"
                        value={user.email}
                        onChange={handleProfileChange}
                        placeholder="Enter your email"
                      />
                    </label>

                    <label>
                      Phone Number
                      <input
                        name="phone"
                        value={user.phone}
                        onChange={handleProfileChange}
                        placeholder="Enter your phone number"
                      />
                    </label>

                    <label>
                      Location
                      <input
                        name="location"
                        value={user.location}
                        onChange={handleProfileChange}
                        placeholder="Enter your location"
                      />
                    </label>

                    <label>
                      Preferred Language
                      <select
                        name="language"
                        value={user.language}
                        onChange={handleProfileChange}
                      >
                        <option value="English">English</option>
                        <option value="Tamil">Tamil</option>
                        <option value="Sinhala">Sinhala</option>
                      </select>
                    </label>

                    <div className="profile-edit-actions">
                      <button
                        type="button"
                        className="profile-cancel-btn"
                        onClick={() => {
                          setUser({ ...savedUser });
                          setEditing(false);
                          setPageError("");
                        }}
                        disabled={savingProfile}
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        className="profile-save-btn"
                        onClick={handleSaveProfile}
                        disabled={savingProfile}
                      >
                        <Check size={15} />
                        {savingProfile ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="profile-detail-item">
                      <span>Legal Full Name</span>
                      <strong>
                        {user.fullName || "Not provided"}
                      </strong>
                    </div>

                    <div className="profile-detail-item">
                      <span>Email Address</span>
                      <strong className="profile-email-row">
                        {user.email || "Not provided"}

                        {user.email && (
                          <small>
                            <ShieldCheck size={12} />
                            Verified
                          </small>
                        )}
                      </strong>
                    </div>

                    <div className="profile-detail-item">
                      <span>Phone Number</span>
                      <strong>
                        {user.phone || "Not provided"}
                      </strong>
                    </div>

                    <div className="profile-detail-item">
                      <span>Preferred Language</span>
                      <strong>{user.language}</strong>
                    </div>

                    <div className="profile-detail-item">
                      <span>Default Base Hub</span>
                      <strong>
                        {user.location || "Not provided"}
                      </strong>
                    </div>

                    <button
                      className="profile-edit-btn"
                      onClick={() => setEditing(true)}
                    >
                      <Pencil size={14} />
                      Edit Profile Information
                    </button>
                  </>
                )}
              </section>
            </div>

            {/* Right Column - Saved Vehicles */}
            <section className="profile-vehicles-card">

              <div className="profile-vehicles-heading">
                <div>
                  <h3>
                    <CarFront size={18} />
                    Saved Vehicles
                  </h3>

                  <p>
                    Manage your registered vehicles for roadside assistance
                    and service requests.
                  </p>
                </div>

                <button
                  className="profile-add-vehicle-btn"
                  onClick={() => setShowAddVehicle(true)}
                  disabled={savingVehicle}
                >
                  <Plus size={16} />
                  Add Vehicle
                </button>
              </div>

              {vehicleError && <p className="profile-message error" role="alert">{vehicleError}</p>}

              {/* Add Vehicle Form */}
              {showAddVehicle && (
                <form
                  className="profile-add-vehicle-form"
                  onSubmit={handleAddVehicle}
                >
                  <div className="profile-form-heading">
                    <h4>Register a Vehicle</h4>

                    <button
                      type="button"
                      onClick={() => {
                        setShowAddVehicle(false);
                        setVehicleError("");
                      }}
                      disabled={savingVehicle}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <label>
                    Vehicle Type
                    <select
                      value={newVehicle.vehicleType}
                      onChange={(e) =>
                        setNewVehicle({
                          ...newVehicle,
                          vehicleType: e.target.value,
                        })
                      }
                      required
                    >
                      <option value="">Select Vehicle Type</option>
                      <option value="Car">Car</option>
                      <option value="Bike">Bike</option>
                      <option value="Van">Van</option>
                      <option value="Three Wheeler">Three Wheeler</option>
                      <option value="Truck">Truck</option>
                    </select>
                  </label>

                  <label>
                    Vehicle Model
                    <input
                      type="text"
                      placeholder="e.g. Toyota Corolla Altis"
                      value={newVehicle.vehicleModel}
                      onChange={(e) =>
                        setNewVehicle({
                          ...newVehicle,
                          vehicleModel: e.target.value,
                        })
                      }
                      required
                      maxLength={120}
                    />
                  </label>

                  <label>
                    Vehicle Number
                    <input
                      type="text"
                      placeholder="e.g. WP CAB-1234"
                      value={newVehicle.vehicleNumber}
                      onChange={(e) =>
                        setNewVehicle({
                          ...newVehicle,
                          vehicleNumber: e.target.value,
                        })
                      }
                      required
                      maxLength={32}
                    />
                  </label>

                  <div className="profile-add-form-actions">
                    <button
                      type="button"
                      className="profile-cancel-btn"
                      onClick={() => {
                        setShowAddVehicle(false);
                        setVehicleError("");
                      }}
                      disabled={savingVehicle}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="profile-save-btn"
                      disabled={savingVehicle}
                    >
                      <Plus size={15} />
                      {savingVehicle ? "Saving..." : "Save Vehicle"}
                    </button>
                  </div>
                </form>
              )}

              {/* Display Saved Vehicles */}
              <div className="profile-vehicle-list">
                {vehicles.length === 0 ? (
                  <div className="profile-empty-vehicles">
                    <CarFront size={35} />
                    <h4>No Vehicles Registered</h4>
                    <p>
                      Add your vehicle to manage your roadside assistance
                      requests.
                    </p>
                  </div>
                ) : (
                  vehicles.map((vehicle) => (
                    <article
                      className="profile-vehicle-item"
                      key={vehicle.id}
                    >
                      <div className="profile-vehicle-title">
                        <div className="profile-vehicle-icon">
                          {vehicle.vehicleType === "Bike" ? (
                            <Bike size={24} />
                          ) : (
                            <CarFront size={24} />
                          )}
                        </div>

                        <div className="profile-vehicle-name">
                          <h2>{vehicle.vehicleModel}</h2>
                          <p>{vehicle.vehicleType}</p>
                        </div>

                        <button
                          className="profile-vehicle-menu"
                          type="button"
                          aria-label="Delete vehicle"
                          disabled={deletingVehicleId === vehicle.id}
                          onClick={() =>
                            handleDeleteVehicle(vehicle.id)
                          }
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>

                      <div className="profile-vehicle-number">
                        <span>Vehicle Number</span>
                        <strong>{vehicle.vehicleNumber}</strong>
                      </div>
                    </article>
                  ))
                )}
              </div>

              {/* Secondary Vehicle Banner */}
              <div className="profile-secondary-vehicle">
                <div className="profile-secondary-icon">
                  <Bike size={22} />
                </div>

                <div className="profile-secondary-content">
                  <h4>Own a secondary vehicle or two-wheeler?</h4>

                  <p>
                    Register another vehicle under your RoadMate account
                    for roadside assistance.
                  </p>

                  <button
                    onClick={() => setShowAddVehicle(true)}
                  >
                    <Plus size={14} />
                    Register Another
                  </button>
                </div>
              </div>
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}

export default ProfilePage;
