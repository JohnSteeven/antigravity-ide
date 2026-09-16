import { Link } from "react-router";

const Breadcrumbs = ({ items = [] }) => (
  <nav className="breadcrumbs" aria-label="Breadcrumb">
    <ol className="breadcrumbs-list">
      <li className="breadcrumbs-item">
        <Link to="/">Home</Link>
      </li>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <li key={item.label || index} className="breadcrumbs-item">
            <span className="breadcrumbs-separator" aria-hidden="true">/</span>
            {item.to && !isLast ? (
              <Link to={item.to}>{item.label}</Link>
            ) : (
              <span className="breadcrumbs-current" aria-current={isLast ? "page" : undefined}>
                {item.label}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  </nav>
);

export default Breadcrumbs;
