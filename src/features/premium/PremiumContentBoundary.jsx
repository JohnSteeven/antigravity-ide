import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { getImageUrl } from "../../utils/imageUrlHelper";

export default function PremiumContentBoundary({ content, kind = "Article" }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const image = content?.coverImage ? getImageUrl(content.coverImage) : "";

  return (
    <main className={`premium-boundary premium-boundary--${kind.toLowerCase()}`} data-story-layout={content?.storyLayout || undefined}>
      <article className="premium-boundary__editorial">
        <Link className="premium-boundary__back" to={kind === "Story" ? "/stories" : "/articles"}>← Back to {kind === "Story" ? "Stories" : "Articles"}</Link>
        <p className="premium-kicker">Premium {kind}</p>
        <h1>{content?.title}</h1>
        {content?.description && <p className="premium-boundary__subtitle">{content.description}</p>}
        <div className="premium-boundary__meta">
          <span>{content?.author || "MyJourney"}</span>
          {content?.readingTime && <span>{content.readingTime}</span>}
        </div>
        {image && <img src={image} alt={content?.coverImageAlt || ""} />}
        {content?.excerpt && <p className="premium-boundary__excerpt">{content.excerpt}</p>}
      </article>

      <section className="premium-boundary__membership" aria-labelledby="premium-content-heading">
        <p className="premium-kicker">Continue with MyJourney Premium</p>
        <h2 id="premium-content-heading">One membership for more of your journey.</h2>
        <p>Unlock Premium Articles, Premium Stories, MyJourney Life, and other included Premium experiences.</p>
        <div className="premium-actions">
          <Link className="premium-primary-action" to="/premium">Explore MyJourney Premium</Link>
          {!isAuthenticated && <Link className="premium-text-action" to="/login" state={{ from: location }}>Already Premium? Sign in</Link>}
        </div>
      </section>
    </main>
  );
}
