import React, { useState, useEffect } from "react";
import { FiSave, FiRefreshCw, FiImage, FiSettings, FiLayout, FiFileText } from "react-icons/fi";
import { useCms } from "../../context/CmsContext";

export default function HomepageModule() {
  const { getSetting, updateSetting } = useCms();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [homepageData, setHomepageData] = useState({
    hero: {
      eyebrow: "Stories from a life in motion",
      title: "Stories, Thoughts & Experiences.",
      description: "A personal journal for honest lessons, meaningful projects, and moments that shaped the way I see the world.",
      primaryLabel: "Start Reading",
      secondaryLabel: "Read My Story",
      image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=80",
    },
    sections: {
      featuredCategories: {
        visible: true,
        title: "Featured Categories",
        subtitle: "Explore popular topics on development and growth",
      },
      featuredArticles: {
        visible: true,
        title: "Featured Stories",
        subtitle: "Hand-picked articles worth reading",
      },
      latestArticles: {
        visible: true,
        title: "Latest Writing",
        subtitle: "Recent logs and thoughts",
      },
    },
    newsletter: {
      visible: true,
      title: "Subscribe to the Newsletter",
      subtitle: "Get new stories, ideas, and project updates straight to your inbox.",
      buttonText: "Subscribe Now",
    },
    quote: {
      text: "Life is not measured by the number of breaths we take, but by the moments that take our breath away.",
      author: "A reminder I keep close",
      image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1800&q=80",
    },
    layoutOrder: ["hero", "categories", "featured", "latest", "quote", "newsletter"],
  });

  const loadHomepage = async () => {
    setLoading(true);
    setError("");
    try {
      const val = await getSetting("homepage");
      if (val) {
        setHomepageData((prev) => ({
          ...prev,
          ...val,
          hero: { ...prev.hero, ...(val.hero || {}) },
          sections: { ...prev.sections, ...(val.sections || {}) },
          newsletter: { ...prev.newsletter, ...(val.newsletter || {}) },
          quote: { ...prev.quote, ...(val.quote || {}) },
        }));
      }
    } catch (err) {
      setError("Failed to load homepage settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHomepage();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!window.confirm("Are you sure you want to save homepage content configuration?")) return;

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await updateSetting("homepage", homepageData);
      setSuccess("Homepage settings updated successfully.");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message || "Failed to update homepage settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleNestedChange = (section, key, val) => {
    setHomepageData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: val,
      }
    }));
  };

  const handleSectionVisibility = (sectionKey, visible) => {
    setHomepageData((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        [sectionKey]: {
          ...prev.sections[sectionKey],
          visible,
        }
      }
    }));
  };

  if (loading) {
    return (
      <div className="cms-panel" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "3rem" }}>
        <div className="spinner"></div>
        <p style={{ marginTop: "1rem" }}>Loading homepage configuration...</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <form onSubmit={handleSave}>
        {success && <div className="cms-alert cms-alert-success" style={{ marginBottom: "1rem" }}>{success}</div>}
        {error && <div className="cms-alert cms-alert-danger" style={{ marginBottom: "1rem" }}>{error}</div>}

        <div className="cms-grid-two">
          {/* Hero Banner Section */}
          <div className="cms-panel">
            <div className="cms-panel-heading">
              <div>
                <span className="section-kicker">Hero Banner</span>
                <h2>Hero Welcome Block</h2>
              </div>
            </div>
            <div className="form-grid one" style={{ marginTop: "1rem" }}>
              <label>
                Eyebrow Text (Kicker)
                <input
                  type="text"
                  value={homepageData.hero.eyebrow}
                  onChange={(e) => handleNestedChange("hero", "eyebrow", e.target.value)}
                  className="form-input"
                />
              </label>
              <label>
                Hero Title *
                <input
                  type="text"
                  required
                  value={homepageData.hero.title}
                  onChange={(e) => handleNestedChange("hero", "title", e.target.value)}
                  className="form-input"
                />
              </label>
              <label>
                Hero Description *
                <textarea
                  rows="3"
                  required
                  value={homepageData.hero.description}
                  onChange={(e) => handleNestedChange("hero", "description", e.target.value)}
                  className="form-input"
                />
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <label>
                  Primary CTA Label
                  <input
                    type="text"
                    value={homepageData.hero.primaryLabel}
                    onChange={(e) => handleNestedChange("hero", "primaryLabel", e.target.value)}
                    className="form-input"
                  />
                </label>
                <label>
                  Secondary CTA Label
                  <input
                    type="text"
                    value={homepageData.hero.secondaryLabel}
                    onChange={(e) => handleNestedChange("hero", "secondaryLabel", e.target.value)}
                    className="form-input"
                  />
                </label>
              </div>
              <label>
                Background Image URL
                <input
                  type="text"
                  value={homepageData.hero.image}
                  onChange={(e) => handleNestedChange("hero", "image", e.target.value)}
                  className="form-input"
                />
              </label>
            </div>
          </div>

          {/* Section Headings and Visibility Toggle */}
          <div className="cms-panel">
            <div className="cms-panel-heading">
              <div>
                <span className="section-kicker">Section Configuration</span>
                <h2>Homepage Sections</h2>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
              {Object.keys(homepageData.sections).map((key) => (
                <div key={key} style={{ border: "1px solid #e2e8f0", padding: "1rem", borderRadius: "8px", background: "#f8f9fa" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <h3 style={{ margin: 0, fontSize: "0.95rem", textTransform: "capitalize" }}>
                      {key.replace(/([A-Z])/g, " $1")} Section
                    </h3>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.3rem", cursor: "pointer", fontSize: "0.85rem" }}>
                      <input
                        type="checkbox"
                        checked={homepageData.sections[key].visible}
                        onChange={(e) => handleSectionVisibility(key, e.target.checked)}
                      />
                      Show Section
                    </label>
                  </div>
                  {homepageData.sections[key].visible && (
                    <div className="form-grid one" style={{ margin: 0 }}>
                      <input
                        type="text"
                        placeholder="Section title"
                        value={homepageData.sections[key].title}
                        onChange={(e) => {
                          const nextSec = { ...homepageData.sections[key], title: e.target.value };
                          setHomepageData({ ...homepageData, sections: { ...homepageData.sections, [key]: nextSec } });
                        }}
                        className="form-input"
                        style={{ padding: "0.4rem 0.8rem", marginBottom: "0.4rem" }}
                      />
                      <input
                        type="text"
                        placeholder="Section subtitle / description"
                        value={homepageData.sections[key].subtitle}
                        onChange={(e) => {
                          const nextSec = { ...homepageData.sections[key], subtitle: e.target.value };
                          setHomepageData({ ...homepageData, sections: { ...homepageData.sections, [key]: nextSec } });
                        }}
                        className="form-input"
                        style={{ padding: "0.4rem 0.8rem" }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="cms-grid-two" style={{ marginTop: "1.5rem" }}>
          {/* Quote Section Settings */}
          <div className="cms-panel">
            <div className="cms-panel-heading">
              <div>
                <span className="section-kicker">Quote Block</span>
                <h2>Inspiration Quote</h2>
              </div>
            </div>
            <div className="form-grid one" style={{ marginTop: "1rem" }}>
              <label>
                Quote Text
                <textarea
                  rows="3"
                  value={homepageData.quote.text}
                  onChange={(e) => handleNestedChange("quote", "text", e.target.value)}
                  className="form-input"
                />
              </label>
              <label>
                Author / Attribution
                <input
                  type="text"
                  value={homepageData.quote.author}
                  onChange={(e) => handleNestedChange("quote", "author", e.target.value)}
                  className="form-input"
                />
              </label>
              <label>
                Quote Image URL
                <input
                  type="text"
                  value={homepageData.quote.image}
                  onChange={(e) => handleNestedChange("quote", "image", e.target.value)}
                  className="form-input"
                />
              </label>
            </div>
          </div>

          {/* Newsletter Banner Settings */}
          <div className="cms-panel">
            <div className="cms-panel-heading">
              <div>
                <span className="section-kicker">Audience Expansion</span>
                <h2>Newsletter Widget</h2>
              </div>
            </div>
            <div className="form-grid one" style={{ marginTop: "1rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={homepageData.newsletter.visible}
                  onChange={(e) => handleNestedChange("newsletter", "visible", e.target.checked)}
                />
                Show Newsletter Section on Homepage
              </label>
              {homepageData.newsletter.visible && (
                <>
                  <label>
                    Newsletter Banner Title *
                    <input
                      type="text"
                      required
                      value={homepageData.newsletter.title}
                      onChange={(e) => handleNestedChange("newsletter", "title", e.target.value)}
                      className="form-input"
                    />
                  </label>
                  <label>
                    Newsletter Description Text *
                    <textarea
                      rows="2"
                      required
                      value={homepageData.newsletter.subtitle}
                      onChange={(e) => handleNestedChange("newsletter", "subtitle", e.target.value)}
                      className="form-input"
                    />
                  </label>
                  <label>
                    Subscribe Button Label
                    <input
                      type="text"
                      value={homepageData.newsletter.buttonText}
                      onChange={(e) => handleNestedChange("newsletter", "buttonText", e.target.value)}
                      className="form-input"
                    />
                  </label>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" }}>
          <button type="submit" className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }} disabled={saving}>
            {saving ? <FiRefreshCw className="spin" /> : <FiSave />}
            {saving ? "Saving Configurations..." : "Save Homepage Setup"}
          </button>
        </div>
      </form>
    </div>
  );
}
