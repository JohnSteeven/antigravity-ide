import { FiShieldOff } from "react-icons/fi";

const SecurityEmptyState = ({ title = "No data found", description = "There are no security records to display at this time." }) => {
  return (
    <div
      style={{
        padding: "24px 20px",
        textAlign: "center",
        background: "rgba(248, 250, 252, 0.6)",
        border: "1px dashed #cbd5e1",
        borderRadius: "8px",
        color: "#64748b",
      }}
    >
      <FiShieldOff style={{ fontSize: "1.8rem", color: "#94a3b8", marginBottom: "8px" }} />
      <h5 style={{ fontSize: "0.92rem", fontWeight: 700, margin: "0 0 4px", color: "#334155" }}>
        {title}
      </h5>
      <p style={{ fontSize: "0.8rem", margin: 0 }}>{description}</p>
    </div>
  );
};

export default SecurityEmptyState;
