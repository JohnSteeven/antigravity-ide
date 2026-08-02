import React from "react";

const SectionShell = ({ kicker, title, action, children, className = "" }) => (
  <section className={`section-shell ${className}`.trim()}>
    <div className="section-heading-row">
      <div>
        {kicker && <span className="section-kicker">{kicker}</span>}
        {title && <h2>{title}</h2>}
      </div>
      {action}
    </div>
    {children}
  </section>
);

export default SectionShell;
