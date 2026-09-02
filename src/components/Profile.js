import React from "react";
import ReaderPortal from "./profile/ReaderPortal";

/**
 * Profile.js — Legacy export wrapper pointing to ReaderPortal
 * MyJourney Phase 2 — Reader Portal Implementation
 */
const Profile = (props) => {
  return <ReaderPortal {...props} />;
};

export default Profile;
