const fs = require("fs");
const path = require("path");

describe("client authentication contract", () => {
  const clientAuth = fs.readFileSync(path.join(__dirname, "../../src/services/authService.js"), "utf8");
  const tokenService = fs.readFileSync(path.join(__dirname, "../services/tokenService.js"), "utf8");

  test("does not manufacture browser-only users or authenticated sessions", () => {
    expect(clientAuth).not.toContain("getSessionWithUser");
    expect(clientAuth).not.toContain("createUserRecord");
    expect(clientAuth).not.toContain("user.passwordHash ===");
    expect(clientAuth).not.toContain("document.cookie = `myjourney_session");
    expect(clientAuth).not.toContain("writeStorage(AUTH_STORAGE_KEYS.session");
  });

  test("keeps access and refresh tokens out of JSON session responses", () => {
    const responseContract = tokenService.slice(tokenService.indexOf("return {"), tokenService.indexOf("};\n};", tokenService.indexOf("return {")));
    expect(responseContract).toContain("authenticated: true");
    expect(responseContract).not.toContain("accessToken,");
    expect(responseContract).not.toContain("refreshToken,");
  });

  test("gives every refresh JWT a unique identifier", () => {
    expect(tokenService).toContain("jti: crypto.randomUUID()");
  });

  test("uses the registered server user id when requesting an OTP", () => {
    expect(clientAuth).toContain('JSON.stringify({ userId, channel, purpose: "register" })');
  });
});
