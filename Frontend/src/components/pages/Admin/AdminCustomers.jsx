
import { useEffect, useState } from "react";
import {
  Users,
  Ban,
  Search,
  RefreshCw,
  CircleCheck,
  TrendingUp,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import AdminLayout from "../../Admin/AdminLayout";
import { getInitials } from "../../Admin/adminSampleData";
import {
  getAdminCustomers,
  updateAdminCustomerStatus,
} from "../../../api/admin";

function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");

  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalActive, setTotalActive] = useState(0);
  const [totalBlocked, setTotalBlocked] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState("");

  const limit = 10;

  // Fetch customers from backend
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAdminCustomers({
        search,
        status,
        page: currentPage,
        limit,
      });

      setCustomers(data.customers || []);

      setTotalCustomers(data.totalCustomers || 0);
      setTotalActive(data.totalActive || 0);
      setTotalBlocked(data.totalBlocked || 0);

      setCurrentPage(data.currentPage || 1);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(err.message || "Failed to load customers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, status, currentPage]);

  // Reset filters
  const handleRefresh = () => {
    setSearch("");
    setStatus("All");
    setCurrentPage(1);
  };

  // Block or unblock customer
  const handleStatusChange = async (customer) => {
    const isCurrentlyActive = customer.isActive !== false;
    const newStatus = !isCurrentlyActive;

    const action = newStatus ? "unblock" : "block";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${customer.fullName}?`
    );

    if (!confirmed) return;

    try {
      setActionLoading(customer._id);

      await updateAdminCustomerStatus(customer._id, newStatus);

      await fetchCustomers();
    } catch (err) {
      setError(err.message || "Unable to update customer status.");
    } finally {
      setActionLoading("");
    }
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const stats = [
    {
      label: "TOTAL CUSTOMERS",
      value: totalCustomers,
      icon: Users,
      red: false,
    },
    {
      label: "ACTIVE",
      value: totalActive,
      icon: CircleCheck,
      red: false,
    },
    {
      label: "BLOCKED",
      value: totalBlocked,
      icon: Ban,
      red: true,
    },
    {
      label: "TOTAL PAGES",
      value: totalPages,
      icon: TrendingUp,
      red: false,
    },
  ];

  return (
    <AdminLayout activeItem="Customers">
      <div className="adm-title-row">
        <div>
          <h1 className="adm-title">Customers</h1>

          <p className="adm-subtitle">
            Manage and monitor registered drivers and roadside assistance
            customers.
          </p>
        </div>
      </div>

      {/* Statistics */}
      <div className="adm-stats">
        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <div key={item.label} className="adm-card adm-stat">
              <div className="adm-stat-top">
                <span>{item.label}</span>

                <span
                  className={
                    "adm-stat-icon " + (item.red ? "red" : "")
                  }
                >
                  <Icon size={17} />
                </span>
              </div>

              <div className="adm-stat-value">
                <strong className={item.red ? "adm-red-text" : ""}>
                  {item.value}
                </strong>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search and Filters */}
      <div className="adm-card adm-toolbar">
        <div className="adm-search wide">
          <Search size={16} />

          <input
            type="text"
            placeholder="Search by customer name, phone number or email"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <select
          className="adm-select"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="All">Status: All</option>
          <option value="Active">Status: Active</option>
          <option value="Blocked">Status: Blocked</option>
        </select>

        <button
          type="button"
          className="adm-icon-btn square"
          onClick={handleRefresh}
          aria-label="Reset filters"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Customer Table */}
      <section className="adm-card adm-table-card">
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>CUSTOMER</th>
                <th>PHONE</th>
                <th>EMAIL ADDRESS</th>
                <th>JOINED DATE</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="adm-empty">
                    Loading customers...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="6" className="adm-empty">
                    {error}
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="adm-empty">
                    No customers found.
                  </td>
                </tr>
              ) : (
                customers.map((customer) => {
                  const isActive = customer.isActive !== false;
                  const isProcessing =
                    actionLoading === customer._id;

                  return (
                    <tr
                      key={customer._id}
                      className={!isActive ? "adm-row-red" : ""}
                    >
                      <td>
                        <div className="adm-person">
                          <span className="adm-avatar big">
                            {getInitials(customer.fullName || "Customer")}
                          </span>

                          <div>
                            <strong>
                              {customer.fullName || "Unnamed Customer"}
                            </strong>

                            <small>
                              Customer ID: {customer._id.slice(-8)}
                            </small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <strong>{customer.mobile || "—"}</strong>
                      </td>

                      <td>
                        <strong>{customer.email || "—"}</strong>
                      </td>

                      <td>{formatDate(customer.createdAt)}</td>

                      <td>
                        <span
                          className={
                            "adm-badge " +
                            (isActive ? "blue" : "red")
                          }
                        >
                          ● {isActive ? "Active" : "Blocked"}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className={
                            isActive ? "adm-reject" : "adm-btn-light"
                          }
                          disabled={isProcessing}
                          onClick={() => handleStatusChange(customer)}
                        >
                          {isProcessing ? (
                            "Updating..."
                          ) : isActive ? (
                            <>
                              <UserX size={14} />
                              Block
                            </>
                          ) : (
                            <>
                              <UserCheck size={14} />
                              Unblock
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="adm-pagination">
          <span>
            Showing{" "}
            <b>
              {totalCustomers === 0
                ? 0
                : (currentPage - 1) * limit + 1}
            </b>{" "}
            to{" "}
            <b>
              {Math.min(currentPage * limit, totalCustomers)}
            </b>{" "}
            of <b>{totalCustomers}</b> customers
          </span>

          <div className="adm-pages">
            <button
              type="button"
              disabled={currentPage <= 1 || loading}
              onClick={() => setCurrentPage((prev) => prev - 1)}
            >
              <ChevronLeft size={14} />
            </button>

            <button type="button" className="active">
              {currentPage}
            </button>

            <button
              type="button"
              disabled={currentPage >= totalPages || loading}
              onClick={() => setCurrentPage((prev) => prev + 1)}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </section>
    </AdminLayout>
  );
}

export default AdminCustomers;
