import { useRef } from "react";
import { createPortal } from "react-dom";
import { FiAlertTriangle } from "react-icons/fi";
import "./ConfirmationModal.css";
import useDialogFocus from "../../hooks/useDialogFocus";

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
  const dialogRef = useRef(null);
  useDialogFocus({
    open: isOpen,
    containerRef: dialogRef,
    onClose,
    escapeEnabled: !isSubmitting,
  });

  if (!isOpen) return null;

  // Portal to document.body so position:fixed is never broken
  // by ancestor overflow/transform/filter CSS
  return createPortal(
    <div
      className="sec-modal-backdrop"
      onClick={() => {
        if (!isSubmitting) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="sec-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sec-modal-title"
        tabIndex="-1"
      >
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
