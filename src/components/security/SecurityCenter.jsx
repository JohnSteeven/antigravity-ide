import { useState } from "react";
import { FiChevronDown, FiChevronUp, FiShield } from "react-icons/fi";
import { useSecurityCenter } from "../../hooks/useSecurityCenter";
import SecurityHealthCard from "./SecurityHealthCard";
import PasswordSecurityCard from "./PasswordSecurityCard";
import ActiveSessionsCard from "./ActiveSessionsCard";
import LoginHistoryCard from "./LoginHistoryCard";
import ConnectedDevicesCard from "./ConnectedDevicesCard";
import TwoFactorCard from "./TwoFactorCard";
import DeleteAccountCard from "./DeleteAccountCard";
import LoadingSkeleton from "./LoadingSkeleton";
import "./SecurityCenter.css";

const SecurityCenter = ({ user, embedFull = false, standaloneDeleteOnly = false }) => {
  const [isExpanded, setIsExpanded] = useState(embedFull);

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
    setup2FA,
    verify2FA,
    disable2FA,
    deleteAccount,
  } = useSecurityCenter(user);

  if (standaloneDeleteOnly) {
    return <DeleteAccountCard onDeleteAccount={deleteAccount} />;
  }

  return (
    <>
      <div className="sec-embedded-container" style={{ width: "100%" }}>
        {!embedFull && (
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
        )}

        <div className={`sec-section-wrap ${isExpanded || embedFull ? "is-expanded" : ""}`}>
          {loading ? (
            <LoadingSkeleton count={4} />
          ) : error ? (
            <div className="auth-alert error" style={{ margin: "10px 0" }}>
              {error}
            </div>
          ) : (
            <>
              {/* 1. Security Health Overview */}
              <SecurityHealthCard overview={overview} user={user} />

              {/* 2. Password & Security */}
              <PasswordSecurityCard user={user} />

              {/* 3. Active Sessions */}
              <ActiveSessionsCard
                sessions={sessions}
                onRevokeAllOtherSessions={revokeAllOtherSessions}
                onRevokeSession={revokeSession}
              />

              {/* 4. Login History */}
              <LoginHistoryCard
                historyData={historyData}
                params={historyParams}
                onUpdateParams={updateHistoryParams}
              />

              {/* 5. Connected Devices */}
              <ConnectedDevicesCard
                devices={devices}
                onRemoveDevice={removeDevice}
                onRenameDevice={renameDevice}
              />

              {/* 6. Two-Factor Authentication */}
              <TwoFactorCard
                user={user}
                on2FADisable={disable2FA}
                on2FASetup={setup2FA}
                on2FAVerify={verify2FA}
              />
            </>
          )}
        </div>
      </div>

      {!embedFull && (
        <div className="sec-standalone-delete-wrap" style={{ width: "100%", marginTop: "24px" }}>
          <DeleteAccountCard onDeleteAccount={deleteAccount} />
        </div>
      )}
    </>
  );
};

export default SecurityCenter;
