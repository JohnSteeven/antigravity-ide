import { useState } from "react";
import {
  FiActivity,
  FiArchive,
  FiBarChart2,
  FiBookOpen,
  FiBriefcase,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiEdit3,
  FiFolder,
  FiGrid,
  FiHome,
  FiImage,
  FiLayers,
  FiLock,
  FiMail,
  FiMessageCircle,
  FiNavigation,
  FiSearch,
  FiSend,
  FiSettings,
  FiShield,
  FiStar,
  FiTag,
  FiUsers,
} from "react-icons/fi";
import { cmsNavigation } from "../../domain/knowledgeArchitecture";
import { useCms } from "../../context/CmsContext";
import { NavLink } from "react-router-dom";

const iconMap = {
  activity: <FiActivity />,
  analytics: <FiBarChart2 />,
  archive: <FiArchive />,
  book: <FiBookOpen />,
  briefcase: <FiBriefcase />,
  clock: <FiClock />,
  dashboard: <FiBarChart2 />,
  edit: <FiEdit3 />,
  folder: <FiFolder />,
  footer: <FiNavigation />,
  grid: <FiGrid />,
  home: <FiHome />,
  image: <FiImage />,
  layers: <FiLayers />,
  lock: <FiLock />,
  mail: <FiMail />,
  message: <FiMessageCircle />,
  navigation: <FiNavigation />,
  profile: <FiUsers />,
  search: <FiSearch />,
  send: <FiSend />,
  settings: <FiSettings />,
  shield: <FiShield />,
  star: <FiStar />,
  tag: <FiTag />,
  users: <FiUsers />,
};

const CmsLayout = ({
  brand,
  activeTab,
  onTabChange,
  headerKicker,
  title,
  actions,
  children,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { syncStatus } = useCms();

  return (
    <main className={`cms-page ${isCollapsed ? "sidebar-collapsed" : ""}`}>
    <aside className="cms-sidebar" aria-label="CMS sidebar">
      <div className="cms-brand">
        <FiGrid />
        <div>
          <span>{brand}</span>
          <strong>CMS</strong>
        </div>
      </div>

      <button
        className="cms-sidebar-toggle"
        type="button"
        aria-label={isCollapsed ? "Expand CMS sidebar" : "Collapse CMS sidebar"}
        onClick={() => setIsCollapsed((current) => !current)}
      >
        {isCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
      </button>

      <nav aria-label="CMS sections">
        {cmsNavigation.map((group) => (
          <div className="cms-nav-group" key={group.group}>
            <span>{group.group}</span>
            {group.items.map((item) => (
              <NavLink
                to={item.id === "overview" ? "/cms" : `/cms/${item.id}`}
                className={({ isActive }) => isActive ? "active" : ""}
                key={item.id}
                title={item.label}
                end={item.id === "overview"}
              >
                {iconMap[item.icon] || <FiGrid />}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </aside>

    <section className="cms-workspace">
      {syncStatus === "stale-fallback" && (
        <div style={{
          background: "#fff3cd",
          color: "#856404",
          border: "1px solid #ffeeba",
          padding: "0.75rem 1.25rem",
          margin: "1rem 1.5rem 0 1.5rem",
          borderRadius: "0.25rem",
          fontSize: "0.9rem",
          fontWeight: "500",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem"
        }}>
          ⚠️ Offline Fallback: Server sync failed. Displaying cached data.
        </div>
      )}

      <header className="cms-header">
        <div>
          <span className="section-kicker">{headerKicker}</span>
          <h1>{title}</h1>
        </div>
        {actions && <div className="cms-header-actions">{actions}</div>}
      </header>

      {children}
    </section>
    </main>
  );
};

export default CmsLayout;
