import { useEffect } from "react";
import { createPortal } from "react-dom";
import { FiAlertTriangle } from "react-icons/fi";
import "./ConfirmationModal.css";

const ConfirmationModal = ({
  isOpen,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDanger = true,
  isSubmitting = false,
  onConfirm,
  onClose,
}) => {
  // Prevent body scroll while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Portal to document.body so position:fixed is never broken
  // by ancestor overflow/transform/filter CSS
  return createPortal(
    <div
      className="sec-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sec-modal-title"
    >
      <div className="sec-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="sec-modal-header">
          <div className="sec-modal-icon-badge">
            <FiAlertTriangle />
          </div>
          <h3 className="sec-modal-title" id="sec-modal-title">{title}</h3>
        </div>

        <div className="sec-modal-body">{message}</div>

        <div className="sec-modal-actions">
          <button className="secondary-btn" disabled={isSubmitting} type="button" onClick={onClose}>
            {cancelText}
          </button>
          <button
            className={isDanger ? "danger-btn" : "primary-btn"}
            disabled={isSubmitting}
            type="button"
            onClick={onConfirm}
          >
            {isSubmitting ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmationModal;
