import React from "react";
import { getImageUrl } from "../../utils/imageUrlHelper";
import { STORY_SECTION_TYPES, stripStoryHtml } from "../storySections";

const hasHtmlMarkup = (value = "") => /<[a-z][\s\S]*>/i.test(String(value));

const StoryBody = ({ body, className = "" }) => {
  if (!body) return null;
  if (hasHtmlMarkup(body)) {
    return <div className={`story-reader__body ${className}`.trim()} dangerouslySetInnerHTML={{ __html: body }} />;
  }

  return (
    <div className={`story-reader__body ${className}`.trim()}>
      {String(body).split(/\n{2,}/).filter(Boolean).map((paragraph, index) => (
        <p key={`${paragraph.slice(0, 24)}-${index}`}>{paragraph}</p>
      ))}
    </div>
  );
};

const StoryFigure = ({ section, eager = false, className = "" }) => {
  const source = getImageUrl(section.image);
  if (!source) return null;
  const portrait = section.imageSize === "portrait" || section._storyMediaStyle === "portrait";

  return (
    <figure className={`story-reader__figure story-reader__figure--${section.imageSize || "medium"} story-reader__figure--media-${section._storyMediaStyle || "supporting"} ${className}`.trim()}>
      <img
        src={source}
        alt={section.alt || ""}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        width={section.imageWidth || (portrait ? 600 : 800)}
        height={section.imageHeight || (portrait ? 800 : 600)}
      />
      {section.caption && <figcaption>{section.caption}</figcaption>}
    </figure>
  );
};

const StoryText = ({ section, headingLevel = 2 }) => {
  const Heading = `h${headingLevel}`;
  return (
    <div className="story-reader__text">
      {section.heading && <Heading className="story-reader__section-title">{section.heading}</Heading>}
      <StoryBody body={section.body} />
    </div>
  );
};

const SplitSection = ({ section, imageLeft = false, eager = false }) => {
  const media = <StoryFigure section={section} eager={eager} />;
  const text = <StoryText section={section} />;
  const chapterCompanionClass = Number.isInteger(section._storyChapterOwnerIndex) ? " story-reader__section--chapter-companion" : "";

  return (
    <section className={`story-reader__section story-reader__section--split story-reader__section--${imageLeft ? "image-left" : "image-right"}${chapterCompanionClass}${section._storyMediaMoment ? ` story-reader__section--media-moment-${section._storyMediaMoment}` : ""}`}>
      {imageLeft ? media : text}
      {imageLeft ? text : media}
    </section>
  );
};

const InlineMediaSection = ({ section, eager = false, bookCell = false }) => (
  <section className={`story-reader__section story-reader__section--prose story-reader__section--inline-media${bookCell ? " story-reader__section--book-cell" : ""}${section._storyMediaMoment ? ` story-reader__section--media-moment-${section._storyMediaMoment}` : ""}`}>
    <StoryText section={section} />
    <StoryFigure section={section} eager={eager} className="story-reader__figure--inline" />
  </section>
);

const ReflectionSection = ({ section, eager = false }) => {
  const placement = section._storyPlacement;
  const content = (
    <div className="story-reader__reflection-copy">
      {section.heading && <h2>{section.heading}</h2>}
      <StoryBody body={section.body} />
    </div>
  );
  if (section.image && ["right", "left"].includes(placement)) {
    const media = <StoryFigure section={section} eager={eager} />;
    return (
      <aside className={`story-reader__reflection story-reader__reflection--with-image story-reader__section--${placement === "left" ? "image-left" : "image-right"}${section._storyMediaMoment ? ` story-reader__section--media-moment-${section._storyMediaMoment}` : ""}`}>
        {placement === "left" ? media : content}
        {placement === "left" ? content : media}
      </aside>
    );
  }
  return (
    <aside className={`story-reader__reflection${section._storyMediaMoment ? ` story-reader__section--media-moment-${section._storyMediaMoment}` : ""}`}>
      {content}
      {section.image && placement === "inline" && <StoryFigure section={section} eager={eager} className="story-reader__figure--inline" />}
    </aside>
  );
};

const ChapterSection = ({ section, eager = false, bookCell = false }) => {
  const placement = section._storyPlacement;
  const hasImage = placement !== "rail" && Boolean(section.image) && stripStoryHtml(section.body || "").length >= 20;
  const imageLeft = hasImage && (placement === "left" || (!placement && section.imageSide === "left"));
  const chapterText = (
    <div className="story-reader__text story-reader__chapter-text">
      {section.chapterNumber && <span className="story-reader__chapter-number">{section.chapterNumber}</span>}
      <h2 className="story-reader__chapter-title">{section.chapterTitle || section.heading}</h2>
      <StoryBody body={section.body} />
    </div>
  );

  const bookClass = bookCell ? " story-reader__section--book-cell" : "";
  const companionClass = section._storyHasCompanion ? " story-reader__chapter--has-companion" : "";

  if (!hasImage) {
    return <section id={section.id} className={`story-reader__section story-reader__section--prose story-reader__chapter${bookClass}${companionClass}`}>{chapterText}</section>;
  }

  if (placement === "inline") {
    return (
      <section id={section.id} className={`story-reader__section story-reader__section--prose story-reader__chapter story-reader__section--inline-media${bookClass}${section._storyMediaMoment ? ` story-reader__section--media-moment-${section._storyMediaMoment}` : ""}`}>
        {chapterText}
        <StoryFigure section={section} eager={eager} className="story-reader__figure--inline" />
      </section>
    );
  }

  const media = <StoryFigure section={section} eager={eager} />;
  return (
    <section id={section.id} className={`story-reader__section story-reader__section--split story-reader__chapter story-reader__section--${imageLeft ? "image-left" : "image-right"}${bookClass}${section._storyMediaMoment ? ` story-reader__section--media-moment-${section._storyMediaMoment}` : ""}`}>
      {imageLeft ? media : chapterText}
      {imageLeft ? chapterText : media}
    </section>
  );
};

export default function StorySectionRenderer({ section, index = 0, mode = "public", bookCell = false }) {
  const eager = mode === "public" && index === 0;
  const placement = section._storyPlacement;

  if (placement && [STORY_SECTION_TYPES.TEXT, STORY_SECTION_TYPES.TEXT_IMAGE_RIGHT, STORY_SECTION_TYPES.IMAGE_LEFT_TEXT].includes(section.type)) {
    if (section.image && placement === "right" && stripStoryHtml(section.body || "").length >= 20) return <SplitSection section={section} eager={eager} />;
    if (section.image && placement === "left" && stripStoryHtml(section.body || "").length >= 20) return <SplitSection section={section} imageLeft eager={eager} />;
    if (section.image && placement === "inline") return <InlineMediaSection section={section} eager={eager} bookCell={bookCell} />;
    return <section className={`story-reader__section story-reader__section--prose${bookCell ? " story-reader__section--book-cell" : ""}`}><StoryText section={section} /></section>;
  }

  if (placement && section.type === STORY_SECTION_TYPES.CHAPTER) {
    return <ChapterSection section={section} eager={eager} bookCell={bookCell} />;
  }

  if (placement && section.type === STORY_SECTION_TYPES.REFLECTION) {
    if (!section.body) return null;
    return <ReflectionSection section={section} eager={eager} />;
  }

  if (placement === "rail" && [STORY_SECTION_TYPES.IMAGE, STORY_SECTION_TYPES.WIDE_IMAGE].includes(section.type)) {
    return null;
  }

  switch (section.type) {
    case STORY_SECTION_TYPES.TEXT_IMAGE_RIGHT:
      if (!section.image || stripStoryHtml(section.body || "").length < 20) {
        return <section className="story-reader__section story-reader__section--prose"><StoryText section={section} /></section>;
      }
      return <SplitSection section={section} eager={eager} />;

    case STORY_SECTION_TYPES.IMAGE_LEFT_TEXT:
      if (!section.image || stripStoryHtml(section.body || "").length < 20) {
        return <section className="story-reader__section story-reader__section--prose"><StoryText section={section} /></section>;
      }
      return <SplitSection section={section} imageLeft eager={eager} />;

    case STORY_SECTION_TYPES.CHAPTER:
      return <ChapterSection section={section} eager={eager} bookCell={bookCell} />;

    case STORY_SECTION_TYPES.QUOTE:
      if (!section.quote) return null;
      return (
        <blockquote className="story-reader__quote">
          <p>{section.quote}</p>
          {section.attribution && <cite>{section.attribution}</cite>}
        </blockquote>
      );

    case STORY_SECTION_TYPES.REFLECTION:
      if (!section.body) return null;
      return <ReflectionSection section={section} eager={eager} />;

    case STORY_SECTION_TYPES.SCENE_BREAK:
      return <div className="story-reader__scene-break" role="separator" aria-label="Scene break">• • •</div>;

    case STORY_SECTION_TYPES.IMAGE:
    case STORY_SECTION_TYPES.WIDE_IMAGE:
      if (!section.image) return null;
      return (
        <section className="story-reader__section story-reader__section--legacy-image" aria-label="Story image">
          <StoryFigure section={{ ...section, imageSize: section.imageSize || "medium" }} eager={eager} />
        </section>
      );

    case STORY_SECTION_TYPES.TEXT:
    default:
      if (!section.heading && !section.body) return null;
      return (
        <section className={`story-reader__section story-reader__section--prose${bookCell ? " story-reader__section--book-cell" : ""}`}>
          <StoryText section={section} />
        </section>
      );
  }
}
