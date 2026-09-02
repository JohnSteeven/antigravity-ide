import { useState } from "react";
import { motion } from "framer-motion";
import { FiPlus, FiX } from "react-icons/fi";
import catalogs from "../content/catalogs";

const { moods } = catalogs;

const MoodChooser = ({ onSelect, compact = false, onClose, reducedMotion = false }) => {
  const [expanded, setExpanded] = useState(compact);
  const visibleMoods = expanded ? moods : moods.filter((mood) => mood.primary);

  return (
    <div className={`pl-mood-chooser ${compact ? "is-compact" : ""}`}>
      {compact && (
        <div className="pl-drawer-heading">
          <div>
            <span>Something changed?</span>
            <strong>Choose what is here now.</strong>
          </div>
          <button type="button" className="pl-icon-button" onClick={onClose} aria-label="Close mood picker" title="Close mood picker">
            <FiX />
          </button>
        </div>
      )}

      <div className="pl-mood-field" role="group" aria-label="Current feeling">
        {visibleMoods.map((mood, index) => (
          <motion.button
            type="button"
            className={`pl-mood-choice mood-${mood.id}`}
            key={mood.id}
            onClick={() => onSelect(mood.id)}
            initial={reducedMotion ? false : { opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: reducedMotion ? 0 : 0.3, delay: reducedMotion ? 0 : index * 0.025 }}
            whileHover={reducedMotion ? undefined : { y: -4 }}
            whileTap={reducedMotion ? undefined : { scale: 0.96 }}
          >
            {mood.emoji && <span aria-hidden="true">{mood.emoji}</span>}
            <strong>{mood.label}</strong>
          </motion.button>
        ))}
      </div>

      {!compact && !expanded && (
        <button type="button" className="pl-more-moods" onClick={() => setExpanded(true)}>
          <FiPlus /> More feelings
        </button>
      )}
    </div>
  );
};

export default MoodChooser;
