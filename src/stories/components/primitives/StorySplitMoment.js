import React from "react";
import StoryFigure from "./StoryFigure";

export default function StorySplitMoment({
  text,
  figure,
  image,
  alt,
  caption,
  imageSide = "right",
  proportion = "55-45",
  eager = false,
  className = "",
  id,
}) {
  const hasDirectImage = Boolean(image);
  const hasFigureElement = Boolean(figure);
  const hasMedia = hasDirectImage || hasFigureElement;

  if (!hasMedia) {
    return (
      <section id={id} className={`story-split-moment story-split-moment--prose-only ${className}`.trim()}>
        <div className="story-split-moment__text-content">
          {text}
        </div>
      </section>
    );
  }

  const mediaNode = figure || (
    <StoryFigure
      image={image}
      alt={alt}
      caption={caption}
      presentation="split"
      eager={eager}
    />
  );

  return (
    <section
      id={id}
      className={`story-split-moment story-split-moment--${imageSide} story-split-moment--ratio-${proportion} ${className}`.trim()}
    >
      {imageSide === "left" ? (
        <>
          <div className="story-split-moment__media-column">{mediaNode}</div>
          <div className="story-split-moment__text-column">{text}</div>
        </>
      ) : (
        <>
          <div className="story-split-moment__text-column">{text}</div>
          <div className="story-split-moment__media-column">{mediaNode}</div>
        </>
      )}
    </section>
  );
}

