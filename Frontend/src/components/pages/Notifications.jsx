
import { useMemo, useState } from "react";
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
import "../styles/Notifications.css";

const initialNotifications = [
  {
    id: 1,
    type: "request",
    title: "Mechanic accepted your request",
    description:
      "Mike's Roadside Service accepted your flat tyre repair request for Toyota Corolla, TN 07 AB 1234, on OMR Road.",
    time: "2 mins ago",
    location: "OMR Expressway",
    status: "",
    unread: true,
    actions: ["Track Dispatch", "Call Mike"],
  },
  {
    id: 2,
    type: "quotation",
    title: "Quotation received",
    description:
      "Estimated cost ₹450 for roadside puncture patching and emergency air top-up provided by Mike's Roadside Service.",
    time: "8 mins ago",
    location: "",
    status: "Pending Approval",
    unread: true,
    actions: ["Review & Approve", "Decline Quote"],
  },
  {
    id: 3,
    type: "onway",
    title: "Mechanic is on the way",
    description:
      "Mike is en route in service van TN 09 BK 5521. Live ETA is ~6 mins (1.8 km away).",
    time: "15 mins ago",
    location: "",
    status: "En Route",
    unread: true,
    actions: ["Live GPS Map"],
  },
  {
    id: 4,
    type: "completed",
    title: "Service completed",
    description:
      "Battery jumpstart and diagnostic check completed successfully by Chennai Auto Care at Guindy.",
    time: "Yesterday, 4:20 PM",
    location: "Guindy Industrial Estate",
    status: "Closed",
    unread: false,
    actions: ["Report #RM-8924 generated", "View Summary"],
  },
  {
    id: 5,
    type: "payment",
    title: "Payment successful",
    description:
      "₹450 paid successfully via UPI to Karthik Quick Tow & Tyre Hub.",
    time: "1 day ago",
    location: "",
    status: "Settled",
    unread: false,
    actions: ["UPI/5129482103", "Download Receipt"],
  },
  {
    id: 6,
    type: "review",
    title: "Review reminder",
    description:
      "How was your experience with Mike's Roadside Service? Rate your technician to help maintain quality.",
    time: "3 days ago",
    location: "Request #REQ-7702",
    status: "",
    unread: false,
    actions: ["Rate Service"],
  },
];

const notificationIcons = {
  request: Wrench,
  quotation: ReceiptText,
  onway: Truck,
  completed: CircleCheck,
  payment: Wallet,
  review: Star,
};

function Notifications() {
  const [notifications, setNotifications] = useState(
    initialNotifications
  );
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState({
    requests: true,
    payments: true,
    serviceUpdates: true,
    reminders: true,
  });
  const [olderLoaded, setOlderLoaded] = useState(false);

  const unreadCount = notifications.filter(
    (notification) => notification.unread
  ).length;

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

  const markAllAsRead = () => {
    setNotifications((previous) =>
      previous.map((notification) => ({
        ...notification,
        unread: false,
      }))
    );
  };

  const markAsRead = (id) => {
    setNotifications((previous) =>
      previous.map((notification) =>
        notification.id === id
          ? { ...notification, unread: false }
          : notification
      )
    );
  };

  const handleAction = (notification, action) => {
    markAsRead(notification.id);

    if (action === "Call Mike") {
      window.location.assign("tel:07785858522");
      return;
    }

    const messages = {
      "Track Dispatch": "Dispatch tracking will be connected to your request API.",
      "Review & Approve": "Connect the quotation approval API to confirm this quote.",
      "Decline Quote": "Connect the quotation API to decline this quote.",
      "Live GPS Map": "Connect a map provider to show the mechanic's live location.",
      "View Summary": "The service summary page will be connected here.",
      "Download Receipt": "Connect the payment API to download the real receipt.",
      "Rate Service": "The mechanic review form will be connected here.",
      "Report #RM-8924 generated": "Service report reference: RM-8924.",
      "UPI/5129482103": "UPI transaction reference: 5129482103.",
    };

    alert(messages[action] || `${action} selected.`);
  };

  const getActionClass = (action) => {
    if (action === "Decline Quote") return "notification-btn danger";
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

            <div className="notification-list">
              {filteredNotifications.map((notification) => {
                const Icon = notificationIcons[notification.type];

                return (
                  <article
                    key={notification.id}
                    className={`notification-card ${
                      notification.unread ? "unread" : ""
                    }`}
                  >
                    <div className={`notification-icon ${notification.type}`}>
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

              {filteredNotifications.length === 0 && (
                <div className="notification-empty">
                  <BellRing size={27} />
                  <h3>No notifications found</h3>
                  <p>Try another search or select a different tab.</p>
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

            <div className="older-notifications">
              <span>
                Showing <strong>{filteredNotifications.length}</strong> of{" "}
                <strong>{olderLoaded ? 24 : notifications.length}</strong>{" "}
                historical alerts
              </span>

              <button
                type="button"
                onClick={() => setOlderLoaded(true)}
                disabled={olderLoaded}
              >
                {olderLoaded
                  ? "All sample notifications loaded"
                  : "Load older notifications"}
                <ChevronDown size={13} />
              </button>
            </div>
          </section>

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

                <a href="tel:07785858522" className="urgent-phone">
                  <Phone size={13} />
                  07785858522
                </a>
              </div>

              <div className="urgent-decoration" />
            </div>
          </aside>
        </div>
      </main>

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
                <h2 id="preferences-title">Notification Preferences</h2>
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
                description: "Request acceptance and dispatch updates",
              },
              {
                key: "payments",
                title: "Payments and receipts",
                description: "Payment confirmation and billing updates",
              },
              {
                key: "serviceUpdates",
                title: "Mechanic status",
                description: "Mechanic arrival and service completion",
              },
              {
                key: "reminders",
                title: "Reminders and reviews",
                description: "Service reviews and follow-up reminders",
              },
            ].map((item) => (
              <label className="preference-option" key={item.key}>
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
