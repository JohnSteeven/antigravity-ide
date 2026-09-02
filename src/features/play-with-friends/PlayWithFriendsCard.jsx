import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router";
import { FiArrowRight, FiUsers } from "react-icons/fi";
import "./play-with-friends-card.css";

const PlayWithFriendsCard = () => {
  const reducedMotion = useReducedMotion();
  return (
    <motion.article
      className="pwf-project-card"
      initial={reducedMotion ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: reducedMotion ? 0 : 0.55, delay: 0.08 }}
    >
      <Link to="/play-with-friends" className="pwf-card-link" aria-label="Play With Friends">
        <div className="pwf-card-art" aria-hidden="true" />
        <div className="pwf-card-copy">
          <span className="pwf-card-label"><FiUsers /> Social game</span>
          <h3>Play With Friends</h3>
          <em>How well do your friends really know you?</em>
          <p>Share a room, answer in real time, and discover who knows you best.</p>
          <strong>Play Together <FiArrowRight /></strong>
        </div>
      </Link>
    </motion.article>
  );
};

export default PlayWithFriendsCard;
