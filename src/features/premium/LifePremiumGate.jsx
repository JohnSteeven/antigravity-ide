import React from "react";
import { Link } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import LoadingScreen from "../../components/LoadingScreen";
import { FiArrowRight, FiCalendar, FiHeart, FiLock, FiBookOpen, FiTarget, FiRepeat } from "react-icons/fi";
import "./lifeIntro.css";

export default function LifePremiumGate({ children }) {
  const { accessLoading, accessError, hasEntitlement } = useAuth();
  if (accessLoading) return <LoadingScreen message="Checking MyJourney Premium access..." />;
  if (hasEntitlement("life_access")) return children;

  return (
    <main className="premium-life-intro">
      <section aria-labelledby="life-premium-heading">
        <p className="premium-kicker"><FiHeart aria-hidden="true" /> MyJourney Life</p>
        <h1 id="life-premium-heading">Make space for the life you are building.</h1>
        <p className="premium-life-intro__lead">Plan your day, build habits, work toward goals, understand routines, track health and money, and reflect on your journey.</p>
        <p className="premium-life-intro__included">Included with MyJourney Premium.</p>
        {accessError && <p className="premium-status" role="status">Subscription status is currently unavailable. Protected Life data remains safely locked.</p>}
        <Link className="premium-primary-action" to="/premium">Explore MyJourney Premium <FiArrowRight aria-hidden="true" /></Link>
        <p className="life-intro-private"><FiLock aria-hidden="true" /> Your space. Private to your account.</p>
      </section>
      <aside className="life-intro-garden" aria-label="What you can do with Life">
        <p className="life-intro-eyebrow">A little more intention, every day</p>
        <h2>Small steps.<br /><em>A fuller life.</em></h2>
        <div className="life-intro-features">{[
          [FiCalendar, "Find your focus", "Bring tasks, plans, and routines into one day."],
          [FiRepeat, "Build a rhythm", "Create habits that fit the way you live."],
          [FiTarget, "Make room to grow", "Keep your goals and next steps in sight."],
          [FiBookOpen, "Pause and reflect", "Notice patterns in your health, money, and journal."],
        ].map(([Icon, title, copy]) => <div key={title}><Icon aria-hidden="true" /><div><h3>{title}</h3><p>{copy}</p></div></div>)}</div>
      </aside>
    </main>
  );
}
