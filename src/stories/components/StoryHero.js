import React from "react";

export default function StoryHero() {
  return (
    <header className="story-hero" aria-label="Stories introduction">
      <span className="story-hero-kicker">STORIES</span>
      <h1 className="story-hero-title">A new story, every day.</h1>
      <p className="story-hero-subtitle">
        Moments, people, choices and experiences worth getting lost in for a few minutes.
      </p>
      <span className="story-hero-subnote">Come back tomorrow for something new.</span>
    </header>
  );
}
