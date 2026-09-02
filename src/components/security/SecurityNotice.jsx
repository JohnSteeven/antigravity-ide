import { FiCheck, FiShield } from "react-icons/fi";

const SecurityNotice = () => {
  return (
    <div
      style={{
        margin: "18px 0",
        padding: "14px 16px",
        background: "rgba(240, 253, 250, 0.75)",
        border: "1px solid rgba(20, 184, 166, 0.28)",
        borderRadius: "8px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "0.86rem",
          fontWeight: 700,
          color: "#0f766e",
          marginBottom: "8px",
        }}
      >
        <FiShield /> Changing your password will:
      </div>
      <ul
        style={{
          margin: 0,
          paddingLeft: 0,
          listStyle: "none",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "6px 12px",
          fontSize: "0.82rem",
          color: "#334155",
        }}
      >
        <li style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <FiCheck style={{ color: "#0d9488" }} /> Sign you out on all devices
        </li>
        <li style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <FiCheck style={{ color: "#0d9488" }} /> Remove Remember Me logins
        </li>
        <li style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <FiCheck style={{ color: "#0d9488" }} /> Protect your account
        </li>
        <li style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <FiCheck style={{ color: "#0d9488" }} /> Require you to sign in again
        </li>
      </ul>
    </div>
  );
};

export default SecurityNotice;
