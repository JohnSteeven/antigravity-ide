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
              <button
                className={activeTab === item.id ? "active" : ""}
                type="button"
                key={item.id}
                onClick={() => onTabChange(item.id)}
                title={item.label}
              >
                {iconMap[item.icon] || <FiGrid />}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>
    </aside>

    <section className="cms-workspace">
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
