import { Link } from "react-router";
import {
  FiArrowLeft,
  FiCheck,
  FiHeadphones,
  FiMusic,
  FiSliders,
  FiVolume2,
  FiVolumeX,
  FiX,
} from "react-icons/fi";
import MoodChooser from "./MoodChooser";

export const PlayLifeTopBar = ({ mood, onMoodOpen, onSoundOpen, onFinish }) => (
  <header className="pl-topbar">
    <Link to="/about" className="pl-back-link" aria-label="Return to MyJourney About Me">
      <FiArrowLeft />
      <span>MyJourney</span>
    </Link>
    <div className="pl-wordmark" aria-label="Play Life">Play Life</div>
    <div className="pl-top-actions">
      {mood && (
        <button type="button" className="pl-mood-control" onClick={onMoodOpen}>
          <span aria-hidden="true">{mood.emoji || "•"}</span>
          <span>{mood.label}</span>
        </button>
      )}
      <button type="button" className="pl-icon-button" onClick={onSoundOpen} aria-label="Sound settings" title="Sound settings">
        <FiSliders />
      </button>
      <button type="button" className="pl-finish-button" onClick={onFinish}>
        <FiCheck /> <span>Finish</span>
      </button>
    </div>
  </header>
);

export const MoodDrawer = ({ open, onClose, onSelect, reducedMotion }) => {
  if (!open) return null;
  return (
    <div className="pl-drawer-backdrop" role="presentation" onMouseDown={onClose}>
      <aside
        className="pl-control-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Change current mood"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <MoodChooser compact onClose={onClose} onSelect={onSelect} reducedMotion={reducedMotion} />
      </aside>
    </div>
  );
};

const ToggleRow = ({ icon, label, enabled, onChange }) => (
  <button
    type="button"
    className={`pl-sound-toggle ${enabled ? "is-on" : ""}`}
    onClick={() => onChange(!enabled)}
    aria-pressed={enabled}
  >
    {icon}
    <span>{label}</span>
    <span className="pl-toggle-track" aria-hidden="true"><i /></span>
  </button>
);

export const SoundDrawer = ({ open, onClose, settings, onChange }) => {
  if (!open) return null;
  return (
    <div className="pl-drawer-backdrop" role="presentation" onMouseDown={onClose}>
      <aside
        className="pl-control-drawer is-sound"
        role="dialog"
        aria-modal="true"
        aria-label="Sound settings"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="pl-drawer-heading">
          <div>
            <span>Atmosphere</span>
            <strong>Sound settings</strong>
          </div>
          <button type="button" className="pl-icon-button" onClick={onClose} aria-label="Close sound settings" title="Close sound settings">
            <FiX />
          </button>
        </div>
        <div className="pl-sound-options">
          <ToggleRow icon={<FiMusic />} label="Music" enabled={settings.music} onChange={(music) => onChange({ music })} />
          <ToggleRow icon={<FiHeadphones />} label="Ambient sound" enabled={settings.ambient} onChange={(ambient) => onChange({ ambient })} />
          <label className="pl-volume-control">
            {settings.volume > 0 ? <FiVolume2 /> : <FiVolumeX />}
            <span>Volume</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.volume}
              onChange={(event) => onChange({ volume: Number(event.target.value) })}
            />
          </label>
        </div>
      </aside>
    </div>
  );
};
