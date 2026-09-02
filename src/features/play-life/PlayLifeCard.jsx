import { Link } from "react-router";
import { motion, useReducedMotion } from "framer-motion";
import { FiArrowRight, FiCompass } from "react-icons/fi";
import "./play-life.css";

const PlayLifeCard = () => {
  const reducedMotion = useReducedMotion();

  return (
    <motion.article
      className="play-life-project-card"
      initial={reducedMotion ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: reducedMotion ? 0 : 0.55 }}
    >
      <Link to="/play-life" className="play-life-card-link" aria-label="Start Play Life">
        <div className="play-life-card-art" aria-hidden="true">
          <span className="play-life-path-line" />
          <span className="play-life-path-point point-one" />
          <span className="play-life-path-point point-two" />
          <span className="play-life-path-point point-three" />
        </div>
        <div className="play-life-card-copy">
          <span className="play-life-card-label"><FiCompass /> Interactive project</span>
          <h3>Play Life</h3>
          <em>Your feelings. Your choices. Your story.</em>
          <p>An interactive experience about emotions, choices, motivation, life situations, and moving forward.</p>
          <strong>Start Your Journey <FiArrowRight /></strong>
        </div>
      </Link>
    </motion.article>
  );
};

export default PlayLifeCard;
