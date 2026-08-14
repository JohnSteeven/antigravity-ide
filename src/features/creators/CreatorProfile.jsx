import React, { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { creatorApi } from "../../services/apiService";
import { useAuth } from "../../hooks/useAuth";
import "./creators.css";

const Shelf = ({ name, items }) => {
  if (!items?.length) return null;
  const route = { articles: "articles", stories: "stories", courses: "learn/courses", videos: "learn/videos", podcasts: "learn/podcasts", resources: "learn/resources" }[name];
  const routeFor = (item) => name === "featured" ? { article: "articles", story: "stories", course: "learn/courses", video: "learn/videos", podcast: "learn/podcasts", resource: "learn/resources" }[item.contentType] : route;
  return (
    <section className="creator-shelf" aria-labelledby={`creator-${name}`}>
      <div className="creator-section-heading"><h2 id={`creator-${name}`}>{name[0].toUpperCase() + name.slice(1)}</h2></div>
      <div className="creator-shelf__rail">{items.map((item) => <article key={item.id || item._id || item.slug}><p className="creator-kicker">{item.accessLevel === "premium" ? "Premium" : "Free"}</p><h3><Link to={`/${routeFor(item)}/${item.slug}`}>{item.title}</Link></h3><p>{item.subtitle || item.description}</p></article>)}</div>
    </section>
  );
};

export default function CreatorProfile() {
  const { slug } = useParams();
  const { isAuthenticated } = useAuth();
  const [creator, setCreator] = useState(null);
  const [state, setState] = useState({ loading: true, error: "", followBusy: false, followError: "" });
  const followRequestPending = useRef(false);
  useEffect(() => { creatorApi.get(slug).then((response) => { setCreator(response.data); setState((current) => ({ ...current, loading: false })); }).catch((error) => setState({ loading: false, error: error.message, followBusy: false, followError: "" })); }, [slug]);
  const updateFollow = async () => {
    if (followRequestPending.current) return;
    followRequestPending.current = true;
    setState((current) => ({ ...current, followBusy: true, followError: "" }));
    try {
      const response = creator.isFollowing ? await creatorApi.unfollow(slug) : await creatorApi.follow(slug);
      const following = Boolean(response.data?.following);
      setCreator((current) => {
        if (!current) return current;
        const currentCount = Math.max(0, Number(current.metrics?.followerCount) || 0);
        const serverCount = Number(response.data?.followerCount);
        const followerCount = Number.isFinite(serverCount) ? Math.max(0, serverCount) : Math.max(0, currentCount + (following ? 1 : -1));
        return { ...current, isFollowing: following, metrics: { ...(current.metrics || {}), followerCount } };
      });
    } catch (error) {
      setState((current) => ({ ...current, followError: error.message }));
    } finally {
      followRequestPending.current = false;
      setState((current) => ({ ...current, followBusy: false }));
    }
  };
  if (state.loading) return <main className="creator-page"><p className="creator-empty" role="status">Opening Creator profile…</p></main>;
  if (state.error || !creator) return <main className="creator-page"><div className="creator-empty" role="alert"><h1>Creator unavailable</h1><p>{state.error}</p><Link to="/creators">Back to Creators</Link></div></main>;
  const followerCount = Math.max(0, Number(creator.metrics?.followerCount) || 0);
  return (
    <main className="creator-page creator-profile">
      <header className="creator-profile__header">
        <div className="creator-profile__portrait">{creator.profileImage ? <img src={creator.profileImage} alt="" /> : <span aria-hidden="true">{creator.displayName?.slice(0, 1)}</span>}</div>
        <div><p className="creator-kicker">Verified Creator</p><h1>{creator.displayName}</h1><p className="creator-profile__headline">{creator.headline}</p><ul className="creator-chip-list">{(creator.specialties || []).map((item) => <li key={item}>{item}</li>)}</ul><p>{(creator.languages || []).join(" · ")}</p></div>
        <div className="creator-profile__actions">{isAuthenticated && !creator.isOwner ? <button type="button" className="creator-primary-action" aria-label={creator.isFollowing ? "Unfollow Creator" : "Follow Creator"} aria-pressed={Boolean(creator.isFollowing)} disabled={state.followBusy} onClick={updateFollow}>{state.followBusy ? "Updating…" : creator.isFollowing ? "Following" : "Follow Creator"}</button> : !isAuthenticated ? <Link className="creator-primary-action" to="/login">Sign in to follow</Link> : null}<span>{followerCount} {followerCount === 1 ? "follower" : "followers"}</span>{state.followError && <p className="creator-notice" role="alert">{state.followError}</p>}</div>
      </header>
      {(creator.modules || []).map((module) => module === "about" ? <section className="creator-about" key={module}><p className="creator-kicker">About</p><h2>Experience behind the work</h2><p>{creator.biography}</p></section> : <Shelf key={module} name={module} items={creator.shelves?.[module]} />)}
    </main>
  );
}
