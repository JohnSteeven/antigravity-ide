import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiSave } from "react-icons/fi";
import { useAuth } from "../hooks/useAuth";
import { ALL_COUNTRY_CODES } from "../utils/countryCodes";
import { getProfileCover, getProfilePhoto } from "../utils/helpers";
import AvatarUploader from "./AvatarUploader";
import PasswordStrength from "./PasswordStrength";

const EditProfile = () => {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const profile = user.profile || {};
  const [form, setForm] = useState({
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    username: user.username || "",
    email: user.email || "",
    countryCode: user.countryCode || "+91",
    mobile: user.mobile || "",
    bio: profile.bio || "",
    location: profile.location || "",
    website: profile.website || "",
    skills: (profile.skills || []).join(", "),
    avatar: getProfilePhoto(profile),
    coverImage: getProfileCover(profile),
  });
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      if (form.currentPassword || form.newPassword) {
        if (!form.currentPassword || !form.newPassword) {
          throw new Error("Both current password and new password are required to change password.");
        }
        await changePassword({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        });
      }

      const result = await updateProfile({
        firstName: form.firstName,
        lastName: form.lastName,
        username: form.username,
        email: form.email,
        countryCode: form.countryCode,
        mobile: form.mobile,
        profile: {
          bio: form.bio,
          location: form.location,
          website: form.website,
          skills: form.skills
            .split(",")
            .map((skill) => skill.trim())
            .filter(Boolean),
          avatar: form.avatar,
          coverImage: form.coverImage,
        },
      });
      navigate("/profile", {
        replace: true,
        state: { message: result.message },
      });
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="edit-profile-page">
      <section className="edit-profile-header">
        <Link className="secondary-btn" to="/profile">
          <FiArrowLeft /> Profile
        </Link>
        <div>
          <span className="section-kicker">Profile settings</span>
          <h1>Edit Profile</h1>
        </div>
      </section>

      <form className="edit-profile-form" onSubmit={handleSubmit}>
        <div className="profile-upload-grid">
          <AvatarUploader
            aspect="avatar"
            label="Profile Photo"
            value={form.avatar}
            onChange={(value) => updateField("avatar", value)}
          />
          <AvatarUploader
            aspect="cover"
            label="Cover Image"
            value={form.coverImage}
            onChange={(value) => updateField("coverImage", value)}
          />
        </div>

        <div className="form-grid two">
          <label>
            First Name
            <input value={form.firstName} onChange={(event) => updateField("firstName", event.target.value)} />
          </label>
          <label>
            Last Name
            <input value={form.lastName} onChange={(event) => updateField("lastName", event.target.value)} />
          </label>
        </div>

        <div className="form-grid two">
          <label>
            Username
            <input value={form.username} onChange={(event) => updateField("username", event.target.value)} />
          </label>
          <label>
            Email
            <input type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} />
          </label>
        </div>

        <div className="form-grid country-mobile">
          <label>
            Country Code
            <select value={form.countryCode} onChange={(event) => updateField("countryCode", event.target.value)}>
              {ALL_COUNTRY_CODES.map((c) => (
                <option key={`${c.country}-${c.code}`} value={c.code}>
                  {c.flag} {c.code} — {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Mobile
            <input value={form.mobile} onChange={(event) => updateField("mobile", event.target.value)} />
          </label>
        </div>

        <label>
          Bio
          <textarea value={form.bio} onChange={(event) => updateField("bio", event.target.value)}></textarea>
        </label>

        <div className="form-grid two">
          <label>
            Location
            <input value={form.location} onChange={(event) => updateField("location", event.target.value)} />
          </label>
          <label>
            Website
            <input value={form.website} onChange={(event) => updateField("website", event.target.value)} />
          </label>
        </div>

        <label>
          Skills
          <input value={form.skills} onChange={(event) => updateField("skills", event.target.value)} />
        </label>

        {message && <div className="auth-alert" style={{ marginTop: "16px" }}>{message}</div>}

        <button className="primary-btn auth-submit" disabled={isSubmitting} type="submit" style={{ marginTop: "24px" }}>
          <FiSave /> {isSubmitting ? "Saving..." : "Save Profile & Settings"}
        </button>
      </form>
    </main>
  );
};

export default EditProfile;
