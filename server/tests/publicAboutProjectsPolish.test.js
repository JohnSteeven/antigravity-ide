const fs = require("fs");
const path = require("path");

describe("Phase 27 — Public About & Projects Polish Contract", () => {
  const readSrcFile = (relativePath) => {
    return fs.readFileSync(path.join(__dirname, "../../", relativePath), "utf8");
  };

  describe("1. Canonical Routes & Component Registration", () => {
    test("App.js registers canonical /about and /projects routes", () => {
      const appJs = readSrcFile("src/App.js");
      expect(appJs).toContain('path: "about"');
      expect(appJs).toContain('path: "projects"');
      expect(appJs).toContain('ProjectsPage');
      expect(appJs).toContain('ReadMyStory');
    });

    test("Footer.js includes valid links to About and Projects", () => {
      const footerJs = readSrcFile("src/components/Footer.js");
      expect(footerJs).toContain('<Link to="/about">About</Link>');
      expect(footerJs).toContain('<Link to="/projects">Projects</Link>');
    });

    test("ReadMyStory.js points View All Projects to canonical /projects route", () => {
      const readMyStoryJs = readSrcFile("src/components/ReadMyStory.js");
      expect(readMyStoryJs).toContain('<Link to="/projects" className="about-outline-btn">');
      expect(readMyStoryJs).toContain("<span>View All Projects</span>");
    });
  });

  describe("2. The Five Pillars of MyJourney (Read, Learn, Life, Create, Play)", () => {
    test("AboutPillarsSection contains all five pillars with correct canonical routes", () => {
      const pillarsJs = readSrcFile("src/features/about/AboutPillarsSection.jsx");
      
      const expectedPillars = [
        { key: "read", name: "READ", route: "/articles" },
        { key: "learn", name: "LEARN", route: "/learn" },
        { key: "life", name: "LIFE", route: "/life" },
        { key: "create", name: "CREATE", route: "/creators" },
        { key: "play", name: "PLAY", route: "/play" },
      ];

      for (const pillar of expectedPillars) {
        expect(pillarsJs).toContain(`key: "${pillar.key}"`);
        expect(pillarsJs).toContain(`name: "${pillar.name}"`);
        expect(pillarsJs).toContain(`primaryRoute: "${pillar.route}"`);
      }
    });

    test("AboutPillarsSection documents how pillars connect", () => {
      const pillarsJs = readSrcFile("src/features/about/AboutPillarsSection.jsx");
      expect(pillarsJs).toContain("How the Pillars Connect");
      expect(pillarsJs).toContain("server-authoritative");
    });
  });

  describe("3. Privacy Guarantees & Journey AI Boundaries", () => {
    test("About and Projects copy enforces strict Life OS isolation and zero-knowledge privacy", () => {
      const pillarsJs = readSrcFile("src/features/about/AboutPillarsSection.jsx");
      expect(pillarsJs).toContain("Strict Life Isolation");
      expect(pillarsJs).toContain("never surfaced to other users or search");
      expect(pillarsJs).not.toContain("LifeEntry");
      expect(pillarsJs).not.toContain("LifeDay");
    });

    test("Journey AI capabilities are described honestly without medical or financial guarantees", () => {
      const pillarsJs = readSrcFile("src/features/about/AboutPillarsSection.jsx");
      expect(pillarsJs).toContain("Journey AI");
      expect(pillarsJs).toContain("without pretending to provide certified medical or financial outcomes");
      expect(pillarsJs).not.toContain("guaranteed profit");
      expect(pillarsJs).not.toContain("medical diagnosis");
    });
  });

  describe("4. Projects Showcase & Repository Truth", () => {
    test("ProjectsPage defines valid platform engines grounded in repository modules", () => {
      const projectsJs = readSrcFile("src/features/projects/ProjectsPage.jsx");
      
      const realRoutes = [
        "/articles",
        "/coding",
        "/learn",
        "/life",
        "/creators",
        "/play",
        "/agent",
      ];

      for (const r of realRoutes) {
        expect(projectsJs).toContain(`route: "${r}"`);
      }
    });

    test("ProjectsPage and ReadMyStory render AboutProjectsSection with flagship games", () => {
      const projectsJs = readSrcFile("src/features/projects/ProjectsPage.jsx");
      const readMyStoryJs = readSrcFile("src/components/ReadMyStory.js");
      expect(projectsJs).toContain("<AboutProjectsSection />");
      expect(readMyStoryJs).toContain("<AboutProjectsSection />");
    });
  });

  describe("5. DocumentMetadata & SEO Architecture", () => {
    test("Both About and Projects pages render DocumentMetadata with appropriate titles", () => {
      const readMyStoryJs = readSrcFile("src/components/ReadMyStory.js");
      const projectsJs = readSrcFile("src/features/projects/ProjectsPage.jsx");

      expect(readMyStoryJs).toContain('<DocumentMetadata');
      expect(readMyStoryJs).toContain('kind="About"');

      expect(projectsJs).toContain('<DocumentMetadata');
      expect(projectsJs).toContain('kind="Projects"');
    });
  });

  describe("6. Accessibility & Motion Rules", () => {
    test("CSS styles for About Pillars and Projects include prefers-reduced-motion queries", () => {
      const pillarsCss = readSrcFile("src/features/about/about-pillars.css");
      const projectsCss = readSrcFile("src/features/projects/projects.css");

      expect(pillarsCss).toContain("@media (prefers-reduced-motion: reduce)");
      expect(pillarsCss).toContain("transition: none !important");

      expect(pillarsCss).toContain("max-width: 1280px");
      expect(projectsCss).toContain("max-width: 1280px");
    });
  });
});
