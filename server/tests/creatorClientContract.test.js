const fs = require("fs");
const path = require("path");

const read = (...parts) => fs.readFileSync(path.join(__dirname, "..", "..", ...parts), "utf8");

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

  test("players and creator economy do not fake unavailable operations", () => {
    const detail = read("src", "features", "learn", "FormatDetailPage.jsx");
    const studio = read("src", "features", "creators", "CreatorStudio.jsx");
    expect(detail).toContain("Secure delivery is not configured yet");
    expect(studio).toContain("Creator Earnings Program — not yet activated");
    expect(studio).toContain("No payout, currency amount, KYC, or bank connection is currently active");
  });
});
