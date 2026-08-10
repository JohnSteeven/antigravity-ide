import { motion } from "framer-motion";
import { FiArrowUpRight } from "react-icons/fi";

const ChoiceField = ({ choices, onChoose, reducedMotion = false }) => {
  if (!choices?.length) return null;

  return (
    <div
      className={`pl-choice-field ${choices.length > 6 ? "is-many" : ""}`}
      role="group"
      aria-label="Choose what happens next"
    >
      {choices.map((choice, index) => (
        <motion.button
          type="button"
          className="pl-choice"
          key={choice.id}
          onClick={() => onChoose(choice.id)}
          initial={reducedMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.35, delay: reducedMotion ? 0 : index * 0.035 }}
          whileHover={reducedMotion ? undefined : { x: 4 }}
          whileTap={reducedMotion ? undefined : { scale: 0.98 }}
        >
          <span>{choice.label}</span>
          <FiArrowUpRight aria-hidden="true" />
        </motion.button>
      ))}
    </div>
  );
};

export default ChoiceField;
