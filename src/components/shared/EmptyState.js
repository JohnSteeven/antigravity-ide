import React from "react";

const EmptyState = ({
  title,
  message,
  description,
  icon,
  action,
  className = "",
  compact = false,
  role = "status",
}) => {
  const desc = message || description;

  return (
    <div
      className={`empty-state empty-state-block ${compact ? "compact" : ""} ${className}`.trim()}
      role={role}
    >
      {icon ? (
        <div className="empty-state__icon" aria-hidden="true">{icon}</div>
      ) : (
        <svg
          className="empty-state__icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      )}
      {title && <strong className="empty-state__title">{title}</strong>}
      {desc && <p className="empty-state__desc">{desc}</p>}
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  );
};

export default EmptyState;
