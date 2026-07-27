import React from "react";
import { FiTwitter, FiLinkedin, FiFacebook } from "react-icons/fi";

const AuthorCard = ({ article }) => {
  return (
    <div className="author-card">
      <div className="author-card-header">
        <div className="avatar-letter">{article?.author ? article.author.charAt(0) : "A"}</div>
        <div>
          <h4>{article?.author || "Author"}</h4>
          <span>Writer & Storyteller</span>
        </div>
      </div>
      <p className="author-bio">
        Passionate developer, traveller, and compiler of meaningful stories on life, reflections, coding, and everything in between.
      </p>
      <div className="author-socials">
        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
          <FiTwitter />
        </a>
        <a href="https://www.linkedin.com/in/noblejohnsteeven/" target="_blank" rel="noopener noreferrer">
          <FiLinkedin />
        </a>
        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
          <FiFacebook />
        </a>
      </div>
    </div>
  );
};

export default AuthorCard;
