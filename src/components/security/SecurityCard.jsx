const SecurityCard = ({ children, className = "", style = {} }) => {
  return (
    <div
      className={`sec-card-box ${className}`}
      style={{
        background: "var(--surface, #ffffff)",
        border: "1px solid var(--line, rgba(66, 108, 103, 0.22))",
        borderRadius: "8px",
        boxShadow: "var(--shadow, 0 2px 8px rgba(0, 0, 0, 0.04))",
        padding: "16px 20px",
        width: "100%",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export default SecurityCard;
