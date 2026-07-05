import { getFullName, getInitialAvatarLabel, getProfilePhoto } from "../../utils/helpers";

const UserAvatar = ({ user, className = "", size = "large" }) => {
  const profile = user?.profile || {};
  const photoUrl = getProfilePhoto(profile);
  const label = getInitialAvatarLabel(user);
  const classes = ["generated-avatar", `generated-avatar-${size}`, className]
    .filter(Boolean)
    .join(" ");

  if (photoUrl) {
    return (
      <img
        className={classes}
        src={photoUrl}
        alt={`${getFullName(user)} profile photo`}
      />
    );
  }

  return (
    <span className={classes} aria-label={`${getFullName(user)} avatar`} role="img">
      {label}
    </span>
  );
};

export default UserAvatar;
