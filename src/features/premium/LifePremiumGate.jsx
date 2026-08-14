import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import LoadingScreen from "../../components/LoadingScreen";

export default function LifePremiumGate({ children }) {
  const { accessLoading, accessError, hasEntitlement } = useAuth();
  if (accessLoading) return <LoadingScreen message="Checking MyJourney Premium access..." />;
  if (hasEntitlement("life_access")) return children;

  return (
    <main className="premium-life-intro">
      <section aria-labelledby="life-premium-heading">
        <p className="premium-kicker">MyJourney Life</p>
        <h1 id="life-premium-heading">Make space for the life you are building.</h1>
        <p className="premium-life-intro__lead">Plan your day, build habits, work toward goals, understand routines, track health and money, and reflect on your journey.</p>
        <ul>
          <li>Plan your day with calm, practical focus</li>
          <li>Build habits and routines that remain yours</li>
          <li>Understand progress across health, money, and reflection</li>
        </ul>
        <p className="premium-life-intro__included">Included with MyJourney Premium.</p>
        {accessError && <p className="premium-status" role="status">Subscription status is currently unavailable. Protected Life data remains safely locked.</p>}
        <Link className="premium-primary-action" to="/premium">Explore MyJourney Premium</Link>
      </section>
    </main>
  );
}
