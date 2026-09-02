const { LifeError } = require("../domain/errors");

class ProviderRegistry {
  constructor(kind, allowedProviders) { this.kind = kind; this.allowed = new Set(allowedProviders); this.adapters = new Map(); }
  register(provider, adapter) {
    if (!this.allowed.has(provider)) throw new Error(`Unsupported ${this.kind} provider.`);
    if (!adapter || typeof adapter.capabilities !== "function") throw new Error(`${this.kind} adapter must expose capabilities().`);
    this.adapters.set(provider, adapter);
  }
  capabilities() {
    return [...this.allowed].map((provider) => ({ provider, state: this.adapters.has(provider) ? "available" : "unavailable", capabilities: this.adapters.get(provider)?.capabilities?.() || [] }));
  }
  async invoke(userId, provider, operation, input) {
    const adapter = this.adapters.get(provider);
    if (!adapter) throw new LifeError(`${provider} ${this.kind} integration is unavailable.`, 503, `LIFE_${this.kind.toUpperCase()}_UNAVAILABLE`);
    if (!adapter[operation]) throw new LifeError(`This ${this.kind} operation is unsupported.`, 422, `LIFE_${this.kind.toUpperCase()}_UNSUPPORTED`);
    return adapter[operation](userId, input);
  }
}

const calendarRegistry = new ProviderRegistry("calendar", ["google", "microsoft", "device"]);
const healthRegistry = new ProviderRegistry("health", ["apple_health", "health_connect", "fitbit", "garmin", "strava"]);

const integrationStatus = () => ({
  calendar: { mode: "read_only_foundation", providers: calendarRegistry.capabilities(), state: "disconnected" },
  health: { importFields: ["source", "externalId", "originalTimestamp", "importedAt", "dedupeKey"], providers: healthRegistry.capabilities(), state: "disconnected" },
  truth: "Unavailable providers remain disabled until credentials and a user connection exist.",
});

module.exports = { ProviderRegistry, calendarRegistry, healthRegistry, integrationStatus };
