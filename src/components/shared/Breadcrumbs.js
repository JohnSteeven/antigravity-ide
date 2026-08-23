import { Link } from "react-router";

const Breadcrumbs = ({ items = [] }) => (
  <nav className="breadcrumbs" aria-label="Breadcrumb">
    <Link to="/">Home</Link>
    {items.map((item) => (
      <span key={item.label}>
        <span aria-hidden="true">/</span>
        {item.to ? <Link to={item.to}>{item.label}</Link> : <strong>{item.label}</strong>}
      </span>
    ))}
  </nav>
);

export default Breadcrumbs;
