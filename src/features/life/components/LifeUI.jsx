import React, { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { FiAlertCircle, FiX } from "react-icons/fi";

export const LifeLoading = ({ label = "Preparing your day…" }) => (
  <div className="life-loading" role="status" aria-live="polite"><span aria-hidden="true" /><p>{label}</p></div>
);

export const LifeError = ({ message, onRetry }) => (
  <div className="life-error" role="alert"><FiAlertCircle aria-hidden="true" /><div><strong>Something interrupted the flow.</strong><p>{message}</p>{onRetry && <button type="button" className="life-link-button" onClick={onRetry}>Try again</button>}</div></div>
);

export const LifeEmpty = ({ title, message, action }) => (
  <div className="life-empty"><span aria-hidden="true">○</span><h3>{title}</h3><p>{message}</p>{action}</div>
);

export const LifeNotice = ({ children, tone = "neutral" }) => children ? <div className={`life-notice life-notice--${tone}`} role="status">{children}</div> : null;

export const LifeDialog = ({ open, title, children, onClose, wide = false }) => {
  const titleId = useId();
  const panelRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    document.body.classList.add("life-dialog-open");
    window.setTimeout(() => panelRef.current?.querySelector("input, select, textarea, button")?.focus(), 0);
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const focusable = [...(panelRef.current?.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]') || [])];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("life-dialog-open");
      window.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="life-dialog-backdrop" onMouseDown={onClose}>
      <section ref={panelRef} className={`life-dialog${wide ? " life-dialog--wide" : ""}`} role="dialog" aria-modal="true" aria-labelledby={titleId} onMouseDown={(event) => event.stopPropagation()}>
        <header><h2 id={titleId}>{title}</h2><button type="button" className="life-icon-button" onClick={onClose} aria-label="Close dialog"><FiX /></button></header>
        {children}
      </section>
    </div>,
    document.body
  );
};

export const LifePageHeader = ({ eyebrow, title, description, actions }) => (
  <header className="life-page-header"><div><span>{eyebrow}</span><h1>{title}</h1>{description && <p>{description}</p>}</div>{actions && <div className="life-page-actions">{actions}</div>}</header>
);
