import { useCallback, useEffect, useRef, useState } from "react";
import { FiBell, FiCheck, FiCheckCircle } from "react-icons/fi";
import { useNavigate } from "react-router";
import { userApi } from "../services/apiService";

const formatTimestamp = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

export default function NotificationBell({ userId }) {
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadUnreadCount = useCallback(async () => {
    if (!userId) return;
    try {
      const response = await userApi.unreadNotificationCount();
      setUnreadCount(Math.max(0, Number(response?.data?.unreadCount || 0)));
    } catch {
      // Header status is supplementary; authenticated page content remains usable.
    }
  }, [userId]);

  const loadNotifications = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError("");
    try {
      const response = await userApi.notifications({ limit: 20 });
      setItems(Array.isArray(response?.data?.items) ? response.data.items : []);
      setUnreadCount(Math.max(0, Number(response?.data?.unreadCount || 0)));
    } catch (requestError) {
      setError(requestError.message || "Notifications are unavailable right now.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    setItems([]);
    setUnreadCount(0);
    setOpen(false);
    if (!userId) return undefined;

    loadUnreadCount();
    const refresh = () => {
      if (document.visibilityState === "visible") loadUnreadCount();
    };
    const interval = window.setInterval(refresh, 60_000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [loadUnreadCount, userId]);

  useEffect(() => {
    if (!open) return undefined;
    const closeOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("mousedown", closeOutside);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOutside);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const toggle = () => {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen) loadNotifications();
  };

  const markRead = async (notification) => {
    if (notification.read) return;
    const response = await userApi.markNotificationAsRead(notification.id);
    const updated = response?.data?.notification;
    setItems((current) => current.map((item) => (
      item.id === notification.id ? { ...item, ...updated, read: true, status: "read" } : item
    )));
    setUnreadCount((count) => Math.max(0, count - 1));
  };

  const openNotification = async (notification) => {
    try {
      await markRead(notification);
    } catch {
      // Navigation remains useful if the read-state update is temporarily unavailable.
    }
    if (notification.actionUrl) {
      setOpen(false);
      navigate(notification.actionUrl);
    }
  };

  const markAllRead = async () => {
    try {
      await userApi.markAllNotificationsAsRead();
      setItems((current) => current.map((item) => ({ ...item, read: true, status: "read" })));
      setUnreadCount(0);
    } catch (requestError) {
      setError(requestError.message || "Notifications could not be updated.");
    }
  };

  if (!userId) return null;

  return (
    <div className="header-notifications" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className={`notification-bell-button ${open ? "active" : ""}`}
        onClick={toggle}
        aria-expanded={open}
        aria-controls="header-notification-panel"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
      >
        <FiBell aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="notification-count" aria-hidden="true">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <section
          id="header-notification-panel"
          className="notification-panel"
          aria-label="Notifications"
          aria-live="polite"
        >
          <div className="notification-panel__header">
            <div>
              <span className="notification-panel__eyebrow">Your updates</span>
              <h2>Notifications</h2>
            </div>
            {unreadCount > 0 && (
              <button type="button" onClick={markAllRead} className="notification-mark-all">
                <FiCheckCircle aria-hidden="true" /> Mark all read
              </button>
            )}
          </div>

          {loading && <p className="notification-panel__state">Loading notifications…</p>}
          {!loading && error && <p className="notification-panel__state" role="alert">{error}</p>}
          {!loading && !error && items.length === 0 && (
            <p className="notification-panel__state">You’re all caught up.</p>
          )}
          {!loading && !error && items.length > 0 && (
            <ul className="notification-list">
              {items.map((notification) => (
                <li key={notification.id} className={notification.read ? "is-read" : "is-unread"}>
                  <button type="button" onClick={() => openNotification(notification)}>
                    <span className="notification-item__icon" aria-hidden="true">
                      {notification.read ? <FiCheck /> : <span />}
                    </span>
                    <span className="notification-item__content">
                      <strong>{notification.title}</strong>
                      <span>{notification.message}</span>
                      <time dateTime={notification.createdAt}>{formatTimestamp(notification.createdAt)}</time>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
