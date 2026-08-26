import React, { useEffect, useRef } from "react";
import { FiX } from "react-icons/fi";

/**
 * LearnMobileDrawer
 *
 * Accessible slide-in drawer for mobile / tablet topic discovery.
 * Appears at ≤1024px (controlled by CSS — the trigger button and drawer are
 * hidden on desktop via CSS, not by React conditional rendering, so that
 * focus management always has a DOM node to work with).
 *
 * Props
 * ─────
 * open     – boolean — whether drawer is open
 * onClose  – () => void — close callback
 * children – drawer content (sidebar inner content)
 */
export default function LearnMobileDrawer({ open, onClose, children }) {
  const drawerRef = useRef(null);
  const previousFocusRef = useRef(null);

  // Body scroll lock + focus management
  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement;
      document.body.style.overflow = "hidden";
      // Move focus into the drawer after animation frame
      const frame = requestAnimationFrame(() => {
        const firstFocusable = drawerRef.current?.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        firstFocusable?.focus();
      });
      return () => cancelAnimationFrame(frame);
    } else {
      document.body.style.overflow = "";
      // Restore focus to the element that opened the drawer
      previousFocusRef.current?.focus();
    }
  }, [open]);

  // Escape key closes the drawer
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Focus trap: keep focus within the drawer while open
  useEffect(() => {
    if (!open) return;
    const drawer = drawerRef.current;
    if (!drawer) return;

    const handleFocusTrap = (e) => {
      if (e.key !== "Tab") return;
      const focusable = Array.from(
        drawer.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.disabled);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    drawer.addEventListener("keydown", handleFocusTrap);
    return () => drawer.removeEventListener("keydown", handleFocusTrap);
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`learn-drawer-backdrop${open ? " is-open" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        id="learn-mobile-drawer"
        className={`learn-mobile-explore-drawer${open ? " is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Explore Topics"
        hidden={!open}
      >
        {/* Drawer header */}
        <div className="learn-drawer-header">
          <span className="learn-drawer-title">Explore Topics</span>
          <button
            type="button"
            className="learn-drawer-close"
            onClick={onClose}
            aria-label="Close topic explorer"
          >
            <FiX aria-hidden="true" />
          </button>
        </div>

        {/* Drawer body — receives the sidebar content */}
        <div className="learn-drawer-body">{children}</div>
      </div>
    </>
  );
}
