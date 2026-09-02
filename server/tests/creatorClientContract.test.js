const fs = require("fs");
const path = require("path");
const vm = require("vm");
const swc = require("@swc/core");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

const read = (...parts) => fs.readFileSync(path.join(__dirname, "..", "..", ...parts), "utf8");

const renderCreatorApplication = ({ application, creatorAccess }) => {
  const filename = path.join(__dirname, "..", "..", "src", "features", "creators", "CreatorApplication.jsx");
  const compiled = swc.transformSync(fs.readFileSync(filename, "utf8"), {
    filename,
    jsc: { parser: { syntax: "ecmascript", jsx: true }, target: "es2022", transform: { react: { runtime: "classic" } } },
    module: { type: "commonjs" },
  }).code;
  const reactMock = {
    ...React,
    useEffect: () => {},
    useState: (initial) => {
      if (initial === null) return [application, () => {}];
      if (initial?.loading === true) return [{ ...initial, loading: false }, () => {}];
      return [initial, () => {}];
    },
  };
  const Link = ({ to, children, ...props }) => React.createElement("a", { href: to, ...props }, children);
  const applicationModule = { exports: {} };
  const localRequire = (id) => {
    if (id === "react") return reactMock;
    if (id === "react-router") return { Link };
    if (id === "../../hooks/useAuth") return { useAuth: () => ({ creatorAccess }) };
    if (id === "../../services/apiService") return { creatorApi: {} };
    if (id === "../../utils/countryCodes") return { ALL_COUNTRY_CODES: [] };
    if (id === "./creators.css") return {};
    return require(id);
  };
  vm.runInNewContext(`(function(require,module,exports){${compiled}\n})`, { console })(localRequire, applicationModule, applicationModule.exports);
  return renderToStaticMarkup(React.createElement(applicationModule.exports.default));
};

describe("Creator + Learn public and CMS client contracts", () => {
  test("dedicated public, Creator Studio, Course, Lesson, and format routes exist", () => {
    const app = read("src", "App.js");
    ["creators", "creators/apply", "creators/:slug", "creator-studio/*", "learn", "learn/courses/:slug", "learn/courses/:slug/lessons/:lessonId", "learn/videos/:slug", "learn/podcasts/:slug", "learn/resources/:slug"].forEach((route) => expect(app).toContain(`path: "${route}"`));
  });

  test("Learn is primary navigation while Creators and Studio use existing discovery/account surfaces", () => {
    const header = read("src", "components", "Header.js");
    expect(header).toContain('to="/learn"');
    expect(header).toContain('to="/creators"');
    expect(header).toContain('creatorAccess?.studioAvailable ? "/creator-studio" : "/creators/apply"');
  });

  test("admin Creator review is separate from the Studio", () => {
    const dashboard = read("src", "components", "AdminDashboard.js");
    const studio = read("src", "features", "creators", "CreatorStudio.jsx");
    expect(dashboard).toContain("CreatorReviewModule");
    expect(dashboard).toContain('path="creators"');
    expect(studio).not.toContain("adminApplications");
    expect(studio).not.toContain("reviewApplication");
  });

  test("responsive CSS has four-card desktop, two-card tablet, and one-card phone rhythm", () => {
    const learnCss = read("src", "features", "learn", "learn.css");
    const creatorCss = read("src", "features", "creators", "creators.css");
    expect(learnCss).toContain("repeat(4, minmax(0, 1fr))");
    expect(learnCss).toContain("@media (max-width: 1023px)");
    expect(learnCss).toContain("@media (max-width: 430px)");
    expect(creatorCss).toContain("@media (max-width: 820px)");
    expect(creatorCss).toContain("@media (max-width: 430px)");
    expect(`${learnCss}\n${creatorCss}`).toContain("prefers-reduced-motion");
  });

  test("Creator application uses progressive accessible controls without changing its payload fields", () => {
    const application = read("src", "features", "creators", "CreatorApplication.jsx");
    ["Identity", "Expertise", "Experience", "Create", "Review"].forEach((stage) => expect(application).toContain(`label: "${stage}"`));
    ["legalName", "displayName", "headline", "biography", "country", "languages", "specialties", "yearsExperience", "professionalBackground", "creatorTypes", "intendedTopics", "intendedFormats", "portfolioLinks", "workSamples", "motivation", "acceptTerms", "confirmContentRights"].forEach((field) => expect(application).toContain(field));
    expect(application).toContain("ALL_COUNTRY_CODES");
    expect(application).toContain('aria-label="Creator application progress"');
    expect(application).not.toContain("comma separated");
  });

  test("Creator application presents each server status without contradictory review copy", () => {
    const application = read("src", "features", "creators", "CreatorApplication.jsx");
    ["applied", "under_review", "interview", "verification", "more_info_required", "approved", "active", "rejected", "restricted", "suspended", "deactivated"].forEach((status) => expect(application).toContain(status));
    expect(application).toContain("You're an active MyJourney Creator.");
    expect(application).toContain("Your public Creator profile and Creator Studio are ready.");
    expect(application).toContain("Additional information is required.");
    expect(application).toContain("Creator activation and workspace setup are pending.");
    expect(application).toContain("Open Creator Studio");
    expect(application).toContain("View public profile");
    expect(application).not.toContain("Your application is safely with the MyJourney review team.");
  });

  test("ACTIVE Creator renders from capability state when optional application status and profile slug are missing", () => {
    const application = { submittedAt: "2026-08-15T00:00:00.000Z", applicantMessage: "Your application is safely with the MyJourney review team." };
    const withoutSlug = renderCreatorApplication({ application, creatorAccess: { creatorStatus: "active" } });
    expect(withoutSlug).toContain("You&#x27;re an active MyJourney Creator.");
    expect(withoutSlug).toContain("Your public Creator profile and Creator Studio are ready.");
    expect(withoutSlug).toContain('href="/creator-studio"');
    expect(withoutSlug).not.toContain("review team");
    expect(withoutSlug).not.toContain("View public profile");

    const withoutCreatorData = renderCreatorApplication({ application: { ...application, status: "active" }, creatorAccess: null });
    expect(withoutCreatorData).toContain("You&#x27;re an active MyJourney Creator.");
    expect(withoutCreatorData).toContain('href="/creator-studio"');
    expect(withoutCreatorData).not.toContain("View public profile");

    const withSlug = renderCreatorApplication({ application, creatorAccess: { creatorStatus: "active", creatorSlug: "maya-sen" } });
    expect(withSlug).toContain('href="/creators/maya-sen"');
    expect(withSlug).toContain("View public profile");
  });

  test("Creator Directory uses singular grammar only for a total of one", () => {
    const directory = read("src", "features", "creators", "CreatorDirectory.jsx");
    expect(directory).toContain('creatorTotal === 1 ? "Creator" : "Creators"');
  });

  test("Creator Profile follow UI hydrates state, dedupes pending clicks, and pluralizes follower count", () => {
    const profile = read("src", "features", "creators", "CreatorProfile.jsx");
    const api = read("src", "services", "apiService.js");
    const routes = read("server", "routes", "creatorRoutes.js");
    const controllers = read("server", "creators", "controllers.js");

    expect(profile).toContain("creator.isFollowing ? await creatorApi.unfollow(slug) : await creatorApi.follow(slug)");
    expect(profile).toContain("followRequestPending.current");
    expect(profile).toContain("disabled={state.followBusy}");
    expect(profile).toContain("isAuthenticated && !creator.isOwner");
    expect(profile).toContain('followerCount === 1 ? "follower" : "followers"');
    expect(api).toContain('unfollow: (slug) => del(`/api/creators/${slug}/follow`)');
    expect(routes).toContain('router.post("/:slug/follow", authenticate');
    expect(routes).toContain('router.delete("/:slug/follow", authenticate');
    expect(routes).toContain('router.get("/:slug", optionalAuthenticate, controllers.getCreator)');
    expect(controllers).toContain("getPublicProfile(req.params.slug, userId(req))");
    expect(controllers).not.toMatch(/followCreator[\s\S]{0,500}req\.body\.(follower|followerId|userId)/);
    expect(read("server", "creators", "directoryService.js")).toContain("CREATOR_SELF_FOLLOW_FORBIDDEN");
  });

  test("Learn Home prioritizes progress, topics, Courses, and Creator discovery", () => {
    const home = read("src", "features", "learn", "LearnHome.jsx");
    expect(home.indexOf("Continue Learning")).toBeLessThan(home.indexOf("Explore Topics"));
    expect(home.indexOf("Explore Topics")).toBeLessThan(home.indexOf("Featured Courses"));
    expect(home.indexOf("Featured Courses")).toBeLessThan(home.indexOf("Meet the Creators behind the work"));
  });

  test("players and creator economy do not fake unavailable operations", () => {
    const detail = read("src", "features", "learn", "FormatDetailPage.jsx");
    const studio = read("src", "features", "creators", "CreatorStudio.jsx");
    expect(detail).toContain("Secure delivery is not configured yet");
    expect(studio).toContain("Creator Earnings Program — not yet activated");
    expect(studio).toContain("No payout, currency amount, KYC, or bank connection is currently active");
  });
});
