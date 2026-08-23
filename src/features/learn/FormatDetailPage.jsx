import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { learnApi } from "../../services/apiService";
import ContentReportForm from "./ContentReportForm.jsx";
import "./learn.css";

const CONFIG = {
  video: { load: learnApi.video, label: "Video", purpose: "playback" },
  podcast: { load: learnApi.podcast, label: "Podcast", purpose: "playback" },
  resource: { load: learnApi.resource, label: "Resource", purpose: "download" },
};

export default function FormatDetailPage({ format }) {
  const { slug } = useParams();
  const config = CONFIG[format];
  const [item, setItem] = useState(null);
  const [state, setState] = useState({ loading: true, busy: false, error: "", providerMessage: "" });
  const transcript = useMemo(() => String(item?.transcript || item?.showNotes || "").split(/\n{2,}/).filter(Boolean), [item]);

  useEffect(() => {
    let active = true;
    config.load(slug).then((response) => { if (active) { setItem(response.data); setState({ loading: false, busy: false, error: "", providerMessage: "" }); } }).catch((error) => active && setState({ loading: false, busy: false, error: error.message, providerMessage: "" }));
    return () => { active = false; };
  }, [config, slug]);

  const accessMedia = async () => {
    const assetId = item?.mediaAssetId || item?.assetId;
    if (!assetId && format === "resource" && item?.externalUrl) { window.location.assign(item.externalUrl); return; }
    if (!assetId) { setState((current) => ({ ...current, providerMessage: "No secure media asset is attached to this published item." })); return; }
    setState((current) => ({ ...current, busy: true, providerMessage: "" }));
    try {
      const response = await learnApi.mediaAccess(assetId, config.purpose);
      if (response.data?.url) window.location.assign(response.data.url);
      else setState((current) => ({ ...current, busy: false, providerMessage: "Secure delivery is not configured yet." }));
    } catch (error) { setState((current) => ({ ...current, busy: false, providerMessage: error.message })); }
  };

  if (state.loading) return <main className="learn-page"><p className="learn-state" role="status">Opening {config.label}…</p></main>;
  if (!item) return <main className="learn-page"><section className="learn-lock" role="alert"><p className="learn-kicker">{config.label} access</p><h1>{state.error?.toLowerCase().includes("premium") ? `This ${config.label} is part of MyJourney Premium.` : `${config.label} unavailable`}</h1><p>{state.error}</p><div><Link className="learn-primary-action" to="/premium">Explore Premium</Link><Link to="/learn">Back to Learn</Link></div></section></main>;

  return (
    <main className="learn-page learn-format-detail">
      <nav className="learn-breadcrumbs" aria-label="Breadcrumb"><Link to="/learn">Learn</Link><span>/</span><Link to={`/learn/${format}s`}>{config.label}s</Link></nav>
      <header><p className="learn-kicker">{item.accessLevel === "premium" ? "MyJourney Premium" : "Free"} · {config.label}</p><h1>{item.title}</h1><p>{item.description}</p>{item.creator && <p>By <Link to={`/creators/${item.creator.slug}`}>{item.creator.displayName}</Link></p>}</header>
      <section className="learn-player" aria-label={`${config.label} access`}><div><p className="learn-kicker">Secure {config.purpose}</p><h2>{format === "resource" ? "Open this Resource" : `${config.label} player`}</h2><p>Access is checked by the server before delivery. MyJourney does not expose protected asset keys in public metadata.</p><button className="learn-primary-action" type="button" onClick={accessMedia} disabled={state.busy}>{state.busy ? "Checking access…" : format === "resource" ? "Open Resource" : `Play ${config.label}`}</button>{state.providerMessage && <p className="learn-notice" role="status">{state.providerMessage}</p>}</div></section>
      {!!transcript.length && <section className="learn-transcript"><p className="learn-kicker">{format === "podcast" ? "Show notes and transcript" : "Transcript"}</p><h2>Follow along</h2><div className="learn-prose">{transcript.map((paragraph, index) => <p key={`${index}-${paragraph.slice(0, 18)}`}>{paragraph}</p>)}</div></section>}
      <ContentReportForm targetType={format} targetId={item.id} />
    </main>
  );
}
