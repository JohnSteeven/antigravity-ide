import { Link } from "react-router";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiGlobe,
  FiEdit3,
  FiCalendar,
  FiShield,
  FiZap,
} from "react-icons/fi";
import { useAuth } from "../../hooks/useAuth";
import { getFullName, getProfileCover, getProfilePhoto } from "../../utils/helpers";

const formatDate = (value) => {
  if (!value) return "Not available";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const ProfileDetailsTab = () => {
  const { user, accountAccess } = useAuth();
  const profile = user?.profile || {};
  const fullName = getFullName(user);
  const skills = profile.skills || [];

  const profileFields = [
    { label: "First Name", value: user.firstName, icon: <FiUser /> },
    { label: "Last Name", value: user.lastName, icon: <FiUser /> },
    { label: "Username", value: `@${user.username}`, icon: <FiUser /> },
    { label: "Email", value: user.email, icon: <FiMail /> },
    { label: "Phone", value: user.mobile ? `${user.countryCode || "+91"} ${user.mobile}` : null, icon: <FiPhone /> },
    { label: "Location", value: profile.location, icon: <FiMapPin /> },
    { label: "Website", value: profile.website, icon: <FiGlobe /> },
    { label: "Bio", value: profile.bio },
  ];

  return (
    <div>
      <div className="rp-profile-grid">
        {/* Main Column */}
        <div className="rp-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
            <h3 className="rp-section-title" style={{ margin: 0 }}>
              <FiUser style={{ color: "var(--teal, #426c67)" }} /> Profile Details
            </h3>
            <Link to="/edit-profile" className="rp-edit-btn" style={{ minHeight: 38, padding: "6px 14px", fontSize: "0.8rem" }}>
              <FiEdit3 /> Edit Details
            </Link>
          </div>

          <div className="rp-info-list">
            {profileFields.map((field) => (
              <div key={field.label} className="rp-info-row">
                <div className="rp-info-label">
                  {field.icon} {field.label}
                </div>
                <div className={`rp-info-value${!field.value ? " muted" : ""}`}>
                  {field.value || "Not provided"}
                </div>
              </div>
            ))}

            {/* Skills */}
            <div className="rp-info-row">
              <div className="rp-info-label">
                <FiZap /> Skills & Topics
              </div>
              <div className="rp-info-value">
                {skills.length > 0 ? (
                  <div className="rp-skills-wrap">
                    {skills.map((skill, idx) => (
                      <span key={idx} className="rp-skill-chip">{skill}</span>
                    ))}
                  </div>
                ) : (
                  <span className="muted">No skills added yet</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Membership details */}
        <div className="rp-sidebar">
          <div className="rp-card">
            <h3 className="rp-section-title">
              <FiShield style={{ color: "var(--gold-dark, #8f6b48)" }} /> Account Membership
            </h3>
            <div className="rp-info-list">
              <div className="rp-info-row" style={{ gridTemplateColumns: "110px 1fr" }}>
                <div className="rp-info-label">Role</div>
                <div className="rp-info-value" style={{ fontWeight: 700, color: "var(--teal, #426c67)" }}>
                  {user.role || "Reader"}
                </div>
              </div>

              <div className="rp-info-row" style={{ gridTemplateColumns: "110px 1fr" }}>
                <div className="rp-info-label">Membership</div>
                <div className="rp-info-value" style={{ fontWeight: 700, color: "var(--teal, #426c67)" }}>
                  {accountAccess?.plan === "premium" ? "MyJourney Premium" : "MyJourney Free"}
                </div>
              </div>

              <div className="rp-info-row" style={{ gridTemplateColumns: "110px 1fr" }}>
                <div className="rp-info-label"><FiCalendar /> Joined</div>
                <div className="rp-info-value">{formatDate(user.createdAt)}</div>
              </div>

              <div className="rp-info-row" style={{ gridTemplateColumns: "110px 1fr" }}>
                <div className="rp-info-label">Email Verified</div>
                <div className="rp-info-value" style={{ color: user.verified?.email ? "#10b981" : "#f59e0b", fontWeight: 700 }}>
                  {user.verified?.email ? "✓ Verified" : "Pending"}
                </div>
              </div>

              <div className="rp-info-row" style={{ gridTemplateColumns: "110px 1fr" }}>
                <div className="rp-info-label">Mobile Verified</div>
                <div className="rp-info-value" style={{ color: user.verified?.mobile ? "#10b981" : "#f59e0b", fontWeight: 700 }}>
                  {user.verified?.mobile ? "✓ Verified" : "Pending"}
                </div>
              </div>
            </div>
            <Link to="/profile/subscription" className="rp-edit-btn" style={{ marginTop: 16 }}>Manage membership</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileDetailsTab;
