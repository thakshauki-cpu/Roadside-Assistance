
import { useEffect, useMemo, useState } from "react";

import {
  BellRing,
  CheckCheck,
  SlidersHorizontal,
  Search,
  Wrench,
  ReceiptText,
  Truck,
  CircleCheck,
  Wallet,
  Star,
  Phone,
  MapPin,
  Navigation,
  FileText,
  Eye,
  ChevronDown,
  X,
} from "lucide-react";

import DashboardSidebar from "../Dashboard/Sidebar";
import DashboardTopbar from "../Dashboard/Topbar";
import { getNotifications } from "../../api/notifications";
import "../styles/Notifications.css";

const notificationIcons = {
  request: Wrench,
  quotation: ReceiptText,
  onway: Truck,
  completed: CircleCheck,
  payment: Wallet,
  review: Star,
};

function Notifications() {
  const [notifications, setNotifications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [showPreferences, setShowPreferences] = useState(false);

  const [preferences, setPreferences] = useState({
    requests: true,
    payments: true,
    serviceUpdates: true,
    reminders: true,
  });

  // Fetch notifications from backend
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getNotifications();

        const formattedNotifications = data.notifications.map(
          (notification) => ({
            id: notification._id,

            // Convert backend notification types to frontend types
            type:
              notification.type === "assigned"
                ? "request"
                : notification.type === "on_the_way"
                ? "onway"
                : notification.type,

            title: notification.title,
            description: notification.message,

            time: notification.createdAt
              ? new Date(notification.createdAt).toLocaleString()
              : "Recently",

            location: "",
            status: "",
            unread: !notification.isRead,

            // Current backend mock data does not provide actions
            actions: [],
          })
        );

        setNotifications(formattedNotifications);
      } catch (err) {
        console.error("Notification fetching error:", err);
        setError(err.message || "Unable to load notifications.");
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  // Count unread notifications
  const unreadCount = notifications.filter(
    (notification) => notification.unread
  ).length;

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      const matchesTab =
        activeTab === "All" ||
        (activeTab === "Unread" && notification.unread) ||
        (activeTab === "Read" && !notification.unread);

      const query = search.toLowerCase().trim();

      const matchesSearch =
        notification.title.toLowerCase().includes(query) ||
        notification.description.toLowerCase().includes(query) ||
        notification.type.toLowerCase().includes(query);

      return matchesTab && matchesSearch;
    });
  }, [notifications, activeTab, search]);

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications((previous) =>
      previous.map((notification) => ({
        ...notification,
        unread: false,
      }))
    );
  };

  // Mark one notification as read
  const markAsRead = (id) => {
    setNotifications((previous) =>
      previous.map((notification) =>
        notification.id === id
          ? { ...notification, unread: false }
          : notification
      )
    );
  };

  // Handle notification actions
  const handleAction = (notification, action) => {
    markAsRead(notification.id);

    if (action === "Call Mike") {
      window.location.assign("tel:07785858522");
      return;
    }

    const messages = {
      "Track Dispatch":
        "Dispatch tracking will be connected to your request API.",

      "Review & Approve":
        "Connect the quotation approval API to confirm this quote.",

      "Decline Quote":
        "Connect the quotation API to decline this quote.",

      "Live GPS Map":
        "Connect a map provider to show the mechanic's live location.",

      "View Summary":
        "The service summary page will be connected here.",

      "Download Receipt":
        "Connect the payment API to download the real receipt.",

      "Rate Service":
        "The mechanic review form will be connected here.",

      "Report #RM-8924 generated":
        "Service report reference: RM-8924.",

      "UPI/5129482103":
        "UPI transaction reference: 5129482103.",
    };

    alert(messages[action] || `${action} selected.`);
  };

  // Button styles
  const getActionClass = (action) => {
    if (action === "Decline Quote") {
      return "notification-btn danger";
    }

    if (
      action === "Track Dispatch" ||
      action === "Review & Approve" ||
      action === "Rate Service"
    ) {
      return "notification-btn primary";
    }

    return "notification-btn secondary";
  };

  return (
    <div className="notifications-page">
      <DashboardSidebar activeItem="Notifications" />

      <main className="notifications-main">
        <DashboardTopbar />

        {/* Notification Heading */}
        <section className="notifications-heading">
          <div className="notifications-heading-title">
            <h1>Notifications</h1>

            <span className="new-count">
              <span />
              {unreadCount} New
            </span>
          </div>

          <p>
            Stay updated on your roadside assistance requests, mechanic
            status, and payment receipts.
          </p>

          <div className="heading-actions">
            <button
              type="button"
              className="heading-btn mark-read-btn"
              onClick={markAllAsRead}
            >
              <CheckCheck size={13} />
              Mark all as read
            </button>

            <button
              type="button"
              className="heading-btn"
              onClick={() => setShowPreferences(true)}
            >
              <SlidersHorizontal size={13} />
              Notification Preferences
            </button>
          </div>
        </section>

        <div className="notifications-layout">
          <section className="notifications-feed">
            {/* Notification Filters */}
            <div className="notification-filter-bar">
              <div className="notification-tabs">
                {[
                  { label: "All", count: notifications.length },
                  { label: "Unread", count: unreadCount },
                  {
                    label: "Read",
                    count: notifications.length - unreadCount,
                  },
                ].map((tab) => (
                  <button
                    type="button"
                    key={tab.label}
                    onClick={() => setActiveTab(tab.label)}
                    className={
                      activeTab === tab.label ? "active" : ""
                    }
                  >
                    {tab.label}
                    <span>{tab.count}</span>
                  </button>
                ))}
              </div>

              <label className="notification-search">
                <Search size={15} />

                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search notifications..."
                />
              </label>
            </div>

            {/* Notification List */}
            <div className="notification-list">

              {loading && (
                <p>Loading notifications...</p>
              )}

              {error && (
                <div className="notification-empty">
                  <BellRing size={27} />
                  <h3>Unable to load notifications</h3>
                  <p>{error}</p>
                </div>
              )}

              {!loading &&
                !error &&
                filteredNotifications.map((notification) => {
                  const Icon =
                    notificationIcons[notification.type] || BellRing;

                  return (
                    <article
                      key={notification.id}
                      className={`notification-card ${
                        notification.unread ? "unread" : ""
                      }`}
                    >
                      <div
                        className={`notification-icon ${notification.type}`}
                      >
                        <Icon size={17} />

                        {notification.unread && (
                          <span className="unread-dot" />
                        )}
                      </div>

                      <div className="notification-body">
                        <div className="notification-title-row">
                          <h2>{notification.title}</h2>

                          {notification.unread && (
                            <span className="title-unread-dot" />
                          )}
                        </div>

                        <p className="notification-description">
                          {notification.description}
                        </p>

                        {notification.actions.length > 0 && (
                          <div className="notification-actions">
                            {notification.actions.map((action) => (
                              <button
                                type="button"
                                key={action}
                                className={getActionClass(action)}
                                onClick={() =>
                                  handleAction(notification, action)
                                }
                              >
                                {action === "Track Dispatch" && (
                                  <Navigation size={12} />
                                )}

                                {action === "Call Mike" && (
                                  <Phone size={12} />
                                )}

                                {action === "Review & Approve" && (
                                  <CheckCheck size={12} />
                                )}

                                {action === "Decline Quote" && (
                                  <X size={12} />
                                )}

                                {action === "Live GPS Map" && (
                                  <MapPin size={12} />
                                )}

                                {action === "Download Receipt" && (
                                  <FileText size={12} />
                                )}

                                {action === "View Summary" && (
                                  <Eye size={12} />
                                )}

                                {action === "Rate Service" && (
                                  <Star size={12} />
                                )}

                                {action === "Report #RM-8924 generated" && (
                                  <FileText size={12} />
                                )}

                                {action === "UPI/5129482103" && (
                                  <ReceiptText size={12} />
                                )}

                                {action}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="notification-right">
                        <span className="notification-time">
                          {notification.time}
                        </span>

                        {notification.status && (
                          <span
                            className={`notification-status ${notification.type}`}
                          >
                            {notification.status}
                          </span>
                        )}

                        {notification.location && (
                          <span className="notification-location">
                            {notification.location}
                          </span>
                        )}

                        {notification.unread ? (
                          <button
                            type="button"
                            className="mark-single-read"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <CheckCheck size={11} />
                            Mark read
                          </button>
                        ) : (
                          <span className="read-indicator">
                            <CheckCheck size={11} />
                            Read
                          </span>
                        )}
                      </div>
                    </article>
                  );
                })}

              {!loading &&
                !error &&
                filteredNotifications.length === 0 && (
                  <div className="notification-empty">
                    <BellRing size={27} />
                    <h3>No notifications found</h3>
                    <p>
                      Try another search or select a different tab.
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        setSearch("");
                        setActiveTab("All");
                      }}
                    >
                      Show all notifications
                    </button>
                  </div>
                )}
            </div>

            {/* Notification Count */}
            <div className="older-notifications">
              <span>
                Showing{" "}
                <strong>{filteredNotifications.length}</strong> of{" "}
                <strong>{notifications.length}</strong> notifications
              </span>
            </div>
          </section>

          {/* Emergency Help */}
          <aside className="notification-aside">
            <div className="urgent-help-card">
              <div className="urgent-icon">
                <Wrench size={17} />
              </div>

              <div className="urgent-help-content">
                <h2>Need Urgent Road Help?</h2>

                <p>
                  24/7 dedicated safe highway emergency team ready for
                  immediate towing &amp; medical assistance.
                </p>

                <a
                  href="tel:07785858522"
                  className="urgent-phone"
                >
                  <Phone size={13} />
                  07785858522
                </a>
              </div>

              <div className="urgent-decoration" />
            </div>
          </aside>
        </div>
      </main>

      {/* Notification Preferences Modal */}
      {showPreferences && (
        <div
          className="preferences-overlay"
          onClick={() => setShowPreferences(false)}
        >
          <section
            className="preferences-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="preferences-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="preferences-header">
              <div>
                <h2 id="preferences-title">
                  Notification Preferences
                </h2>

                <p>Choose which updates you want to see.</p>
              </div>

              <button
                type="button"
                onClick={() => setShowPreferences(false)}
                aria-label="Close preferences"
              >
                <X size={18} />
              </button>
            </div>

            {[
              {
                key: "requests",
                title: "Service requests",
                description:
                  "Request acceptance and dispatch updates",
              },
              {
                key: "payments",
                title: "Payments and receipts",
                description:
                  "Payment confirmation and billing updates",
              },
              {
                key: "serviceUpdates",
                title: "Mechanic status",
                description:
                  "Mechanic arrival and service completion",
              },
              {
                key: "reminders",
                title: "Reminders and reviews",
                description:
                  "Service reviews and follow-up reminders",
              },
            ].map((item) => (
              <label
                className="preference-option"
                key={item.key}
              >
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.description}</small>
                </span>

                <input
                  type="checkbox"
                  checked={preferences[item.key]}
                  onChange={(event) =>
                    setPreferences((previous) => ({
                      ...previous,
                      [item.key]: event.target.checked,
                    }))
                  }
                />
              </label>
            ))}

            <button
              type="button"
              className="save-preferences-btn"
              onClick={() => setShowPreferences(false)}
            >
              Save Preferences
            </button>
          </section>
        </div>
      )}
    </div>
  );
}

export default Notifications;
