import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

const useDialogFocus = ({
  open,
  containerRef,
  onClose,
  escapeEnabled = true,
  lockBody = true,
}) => {
  const previousFocusRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const escapeEnabledRef = useRef(escapeEnabled);

  useEffect(() => {
    onCloseRef.current = onClose;
    escapeEnabledRef.current = escapeEnabled;
  }, [escapeEnabled, onClose]);

  useEffect(() => {
    if (!open) return undefined;

    const container = containerRef.current;
    if (!container) return undefined;

    previousFocusRef.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    if (lockBody) document.body.style.overflow = "hidden";

    const focusableElements = () => Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR))
      .filter((element) => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true");

    const frame = window.requestAnimationFrame(() => {
      const first = focusableElements()[0];
      (first || container).focus();
    });

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && escapeEnabledRef.current) {
        event.preventDefault();
        onCloseRef.current?.();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = focusableElements();
      if (!focusable.length) {
        event.preventDefault();
        container.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !container.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !container.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handleKeyDown);
      if (lockBody) document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus?.();
    };
  }, [containerRef, lockBody, open]);
};

export default useDialogFocus;
