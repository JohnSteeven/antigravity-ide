const EmptyState = ({ title, message }) => (
  <div className="empty-state-block">
    <strong>{title}</strong>
    <p>{message}</p>
  </div>
);

export default EmptyState;
