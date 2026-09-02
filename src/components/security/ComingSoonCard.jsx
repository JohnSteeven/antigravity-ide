import { FiShield } from "react-icons/fi";

const ComingSoonCard = ({ icon: Icon = FiShield, title, description }) => {
  return (
    <div
      style={{
        padding: "16px 20px",
        background: "rgba(255, 255, 255, 0.7)",
        border: "1px solid rgba(226, 232, 240, 0.7)",
        borderRadius: "10px",
        marginBottom: "12px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "12px",
        opacity: 0.88,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            background: "rgba(100, 116, 139, 0.08)",
            color: "#64748b",
            display: "grid",
            placeItems: "center",
            fontSize: "1.1rem",
            flexShrink: 0,
          }}
        >
          <Icon />
        </div>
        <div>
          <h4 style={{ fontSize: "0.94rem", fontWeight: 700, color: "#334155", margin: "0 0 2px" }}>
            {title}
          </h4>
          <p style={{ fontSize: "0.8rem", color: "#64748b", margin: 0 }}>
            {description}
          </p>
        </div>
      </div>

      <span
        style={{
          fontSize: "0.72rem",
          fontWeight: 700,
          color: "#475569",
          background: "#f1f5f9",
          padding: "4px 10px",
          borderRadius: "12px",
          border: "1px solid #cbd5e1",
          whiteSpace: "nowrap",
        }}
      >
        Coming Soon
      </span>
    </div>
  );
};

export default ComingSoonCard;
