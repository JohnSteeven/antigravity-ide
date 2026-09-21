import React, { useCallback, useRef } from "react";

/**
 * Reusable Draggable Splitter for Coding Workspace & Playground.
 * Supports pointer drag, touch, and full keyboard accessibility.
 */
export default function WorkspaceSplitter({
  orientation = "vertical", // "vertical" | "horizontal"
  currentPercent = 50,
  minPercent = 20,
  maxPercent = 80,
  onResize,
  onResizeEnd,
  onReset,
  containerRef,
  className = "",
  title = "Drag to resize panels",
}) {
  const isDraggingRef = useRef(false);

  const handlePointerDown = useCallback(
    (e) => {
      e.preventDefault();
      isDraggingRef.current = true;
      const target = e.currentTarget;
      const container = containerRef?.current || target.parentElement;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const startCoordinate = orientation === "vertical" ? e.clientX : e.clientY;
      const startPercent = currentPercent;
      const containerSize = orientation === "vertical" ? rect.width : rect.height;
      if (!containerSize) return;

      if (target.setPointerCapture) {
        target.setPointerCapture(e.pointerId);
      }

      target.classList.add("cd-workspace-splitter--dragging");

      document.body.style.userSelect = "none";
      document.body.style.cursor = orientation === "vertical" ? "col-resize" : "row-resize";

      const handlePointerMove = (moveEvent) => {
        if (!isDraggingRef.current) return;
        const coordinate = orientation === "vertical" ? moveEvent.clientX : moveEvent.clientY;
        const deltaPercent = ((coordinate - startCoordinate) / containerSize) * 100;
        const nextPercent = startPercent + deltaPercent;

        const clamped = Math.max(minPercent, Math.min(maxPercent, nextPercent));
        if (onResize) onResize(clamped);
      };

      const handlePointerUp = (upEvent) => {
        isDraggingRef.current = false;
        if (target.releasePointerCapture) {
          try {
            target.releasePointerCapture(upEvent.pointerId);
          } catch {
            // Safe fallback
          }
        }

        target.classList.remove("cd-workspace-splitter--dragging");
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
        window.removeEventListener("pointercancel", handlePointerUp);

        if (onResizeEnd) {
          const coordinate = orientation === "vertical" ? upEvent.clientX : upEvent.clientY;
          const finalPercent = startPercent + ((coordinate - startCoordinate) / containerSize) * 100;
          onResizeEnd(Math.max(minPercent, Math.min(maxPercent, finalPercent)));
        }
      };

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("pointercancel", handlePointerUp);
    },
    [containerRef, currentPercent, minPercent, maxPercent, onResize, onResizeEnd, orientation]
  );

  const handleKeyDown = useCallback(
    (e) => {
      let delta = 0;
      if (orientation === "vertical") {
        if (e.key === "ArrowLeft") delta = -2;
        else if (e.key === "ArrowRight") delta = 2;
      } else {
        if (e.key === "ArrowUp") delta = -2;
        else if (e.key === "ArrowDown") delta = 2;
      }

      if (e.key === "Home") {
        e.preventDefault();
        onResize?.(minPercent);
        onResizeEnd?.(minPercent);
        return;
      }
      if (e.key === "End") {
        e.preventDefault();
        onResize?.(maxPercent);
        onResizeEnd?.(maxPercent);
        return;
      }

      if (delta !== 0) {
        e.preventDefault();
        const next = Math.max(minPercent, Math.min(maxPercent, currentPercent + delta));
        onResize?.(next);
        onResizeEnd?.(next);
      }
    },
    [currentPercent, minPercent, maxPercent, onResize, onResizeEnd, orientation]
  );

  const isVertical = orientation === "vertical";

  return (
    <div
      role="separator"
      tabIndex={0}
      aria-orientation={orientation}
      aria-valuenow={Math.round(currentPercent)}
      aria-valuemin={Math.round(minPercent)}
      aria-valuemax={Math.round(maxPercent)}
      aria-label={isVertical ? "Resize left and right panels" : "Resize top and bottom panels"}
      title={title}
      className={`cd-workspace-splitter ${isVertical ? "cd-workspace-splitter--vertical" : "cd-workspace-splitter--horizontal"} ${className}`}
      onPointerDown={handlePointerDown}
      onDoubleClick={(event) => {
        event.preventDefault();
        onReset?.();
      }}
      onKeyDown={handleKeyDown}
    >
      <span className="cd-workspace-splitter__handle" aria-hidden="true" />
    </div>
  );
}
