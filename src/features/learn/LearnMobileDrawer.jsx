import React, { useRef } from "react";
import { FiX } from "react-icons/fi";
import useDialogFocus from "../../hooks/useDialogFocus";

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
  useDialogFocus({ open, containerRef: drawerRef, onClose });

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
        tabIndex="-1"
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
