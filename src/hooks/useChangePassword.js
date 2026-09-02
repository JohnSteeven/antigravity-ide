import { useState } from "react";
import { useAuth } from "./useAuth";

export const useChangePassword = () => {
  const { changePassword } = useAuth();
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const [errorMessage, setErrorMessage] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (errorMessage) setErrorMessage("");
  };

  const hasUnsavedChanges = Boolean(
    form.currentPassword || form.newPassword || form.confirmPassword
  );

  const resetForm = () => {
    setForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setStatus("idle");
    setErrorMessage("");
    setShowConfirmModal(false);
  };

  const requestConfirmation = (event) => {
    if (event) event.preventDefault();
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      setErrorMessage("Please fill in all password fields.");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }
    setErrorMessage("");
    setShowConfirmModal(true);
  };

  const executeChangePassword = async () => {
    setShowConfirmModal(false);
    setStatus("submitting");
    setErrorMessage("");

    try {
      await changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      });
      setStatus("success");
    } catch (err) {
      setStatus("error");
      const msg = err.message || "Failed to update password. Please check your credentials and try again.";
      setErrorMessage(msg);
    }
  };

  return {
    form,
    updateField,
    status,
    errorMessage,
    showConfirmModal,
    setShowConfirmModal,
    hasUnsavedChanges,
    resetForm,
    requestConfirmation,
    executeChangePassword,
  };
};
