import { useState } from "react";
import { FiChevronDown, FiChevronUp, FiCpu, FiKey, FiShield, FiSmartphone } from "react-icons/fi";
import { useSecurityCenter } from "../../hooks/useSecurityCenter";
import SecurityHealthCard from "./SecurityHealthCard";
import PasswordSecurityCard from "./PasswordSecurityCard";
import ActiveSessionsCard from "./ActiveSessionsCard";
import LoginHistoryCard from "./LoginHistoryCard";
import ConnectedDevicesCard from "./ConnectedDevicesCard";
import ComingSoonCard from "./ComingSoonCard";
import LoadingSkeleton from "./LoadingSkeleton";
import "./SecurityCenter.css";

const SecurityCenter = ({ user }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    overview,
    sessions,
    historyData,
    devices,
    loading,
    error,
    historyParams,
    updateHistoryParams,
    revokeSession,
    revokeAllOtherSessions,
    renameDevice,
    removeDevice,
  } = useSecurityCenter(user);

  return (
    <div className="sec-embedded-container" style={{ width: "100%" }}>
      <button
        className="sec-header-button settings-action"
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
      >
        <span className="sec-action-label">
          <FiShield style={{ fontSize: "1.1rem" }} /> Security
        </span>

        <span className="sec-expand-indicator">
          {isExpanded ? <><FiChevronUp /> Collapse Security</> : <><FiChevronDown /> View Security Center</>}
        </span>
      </button>

      <div className={`sec-section-wrap ${isExpanded ? "is-expanded" : ""}`}>
        {loading ? (
          <LoadingSkeleton count={4} />
        ) : error ? (
          <div className="auth-alert error" style={{ margin: "10px 0" }}>
            {error}
          </div>
        ) : (
          <>
            {/* Security Health Overview */}
            <SecurityHealthCard overview={overview} user={user} />

            {/* Password & Security */}
            <PasswordSecurityCard user={user} />

            {/* Active Sessions */}
            <ActiveSessionsCard
              sessions={sessions}
              onRevokeAllOtherSessions={revokeAllOtherSessions}
              onRevokeSession={revokeSession}
            />

            {/* Login History */}
            <LoginHistoryCard
              historyData={historyData}
              params={historyParams}
              onUpdateParams={updateHistoryParams}
            />

            {/* Connected Devices */}
            <ConnectedDevicesCard
              devices={devices}
              onRemoveDevice={removeDevice}
              onRenameDevice={renameDevice}
            />

            {/* Two-Factor Authentication (2FA) Stub */}
            <ComingSoonCard
              description="Add an authenticator app (Google Authenticator, Authy, 1Password) or SMS for extra multi-factor security protection."
              icon={FiSmartphone}
              title="Two-Factor Authentication (2FA)"
            />

            {/* Passkeys & WebAuthn Stub */}
            <ComingSoonCard
              description="Passwordless sign-in using biometric hardware (Touch ID, Face ID, Windows Hello) and FIDO2 keys."
              icon={FiKey}
              title="Passkeys & WebAuthn"
            />
          </>
        )}
      </div>
    </div>
  );
};

export default SecurityCenter;
