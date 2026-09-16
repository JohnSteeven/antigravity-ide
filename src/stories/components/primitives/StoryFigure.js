import React from "react";
import { getImageUrl } from "../../../utils/imageUrlHelper";

export const StoryCaption = ({ caption, className = "" }) => {
  if (!caption) return null;
  return (
    <figcaption className={`story-reader__caption ${className}`.trim()}>
      {caption}
    </figcaption>
  );
};

export default function StoryFigure({
  image,
  alt = "",
  caption = "",
  width,
  height,
  presentation = "split", // 'split' | 'wide' | 'hero' | 'bookplate' | 'inline' | 'rail'
  aspectRatio,
  objectPosition,
  eager = false,
  className = "",
}) {
  const source = getImageUrl(image);
  if (!source) return null;

  const style = {};
  if (aspectRatio) style.aspectRatio = aspectRatio;
  if (objectPosition) style.objectPosition = objectPosition;

  return (
    <figure
      className={`story-reader__figure story-reader__figure--${presentation} ${className}`.trim()}
    >
      <div className="story-reader__figure-frame">
        <img
          src={source}
          alt={alt || ""}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          width={width || 1200}
          height={height || 800}
          style={style}
        />
      </div>
      <StoryCaption caption={caption} />
    </figure>
  );
}

