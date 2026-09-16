import React from "react";
import StoryFigure from "./StoryFigure";

export default function StoryWideMoment({
  image,
  alt,
  caption,
  figure,
  introText,
  eager = false,
  className = "",
  id,
}) {
  const mediaNode = figure || (
    <StoryFigure
      image={image}
      alt={alt}
      caption={caption}
      presentation="wide"
      eager={eager}
    />
  );

  return (
    <section id={id} className={`story-wide-moment ${className}`.trim()}>
      {introText && <div className="story-wide-moment__intro">{introText}</div>}
      <div className="story-wide-moment__frame">{mediaNode}</div>
    </section>
  );
}

