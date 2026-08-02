import ChangePasswordCard from "./ChangePasswordCard";
import "./PasswordSecurityCard.css";

const PasswordSecurityCard = ({ user }) => {
  return (
    <div className="sec-pass-card-wrap">
      <ChangePasswordCard user={user} />
    </div>
  );
};

export default PasswordSecurityCard;
