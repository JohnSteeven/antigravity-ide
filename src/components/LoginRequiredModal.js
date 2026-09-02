import { useRef } from "react";
import { FiLogIn, FiX } from "react-icons/fi";
import { useNavigate } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import useDialogFocus from "../hooks/useDialogFocus";

const LoginRequiredModal = ({ open, onClose, returnTo }) => {
  const navigate = useNavigate();
  const dialogRef = useRef(null);

  useDialogFocus({ open, containerRef: dialogRef, onClose });

  const handleLogin = () => {
    onClose();
    navigate("/login", { state: { from: returnTo } });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          animate={{ opacity: 1 }}
          className="modal-backdrop"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          role="presentation"
        >
          <motion.div
            ref={dialogRef}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            aria-labelledby="login-required-title"
            aria-modal="true"
            className="login-required-modal"
            exit={{ opacity: 0, scale: 0.97, y: 12 }}
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            role="dialog"
            tabIndex="-1"
            transition={{ duration: 0.2 }}
          >
            <button
              aria-label="Close login required dialog"
              className="modal-close-btn"
              type="button"
              onClick={onClose}
            >
              <FiX />
            </button>
            <span className="auth-icon">
              <FiLogIn />
            </span>
            <h2 id="login-required-title">Login Required</h2>
            <p>Please sign in to continue.</p>
            <div className="modal-actions">
              <button className="primary-btn" type="button" onClick={handleLogin}>
                <FiLogIn /> Login
              </button>
              <button className="secondary-btn" type="button" onClick={onClose}>
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoginRequiredModal;
