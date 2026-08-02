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
  if (!isOpen) return null;

  return (
    <div className="sec-modal-backdrop" onClick={onClose}>
      <div className="sec-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="sec-modal-header">
          <div className="sec-modal-icon-badge">
            <FiAlertTriangle />
          </div>
          <h3 className="sec-modal-title">{title}</h3>
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
    </div>
  );
};

export default ConfirmationModal;
