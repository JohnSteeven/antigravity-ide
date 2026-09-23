import React, { useState } from "react";
import {
  FiPlus,
  FiTrash2,
  FiChevronUp,
  FiChevronDown,
  FiCode,
  FiCheckCircle,
  FiAlertCircle,
  FiEye,
} from "react-icons/fi";

const RULE_CATEGORIES = [
  {
    category: "HTML Structure",
    types: [
      {
        value: "element_exists",
        label: "Element Exists (e.g. h1, div.card)",
        fields: ["selector", "message"],
        placeholders: {
          selector: "e.g. h1, main > article, .hero-title",
          message: "e.g. Add an <h1> element to your page.",
        },
      },
      {
        value: "element_attribute",
        label: "Element Attribute (e.g. img src, a href)",
        fields: ["selector", "attribute", "value", "message"],
        placeholders: {
          selector: "e.g. img.avatar",
          attribute: "e.g. alt",
          value: "e.g. Profile photo",
          message: "e.g. Ensure the <img> tag has an alt attribute describing the image.",
        },
      },
      {
        value: "text_content",
        label: "Element Text Content",
        fields: ["selector", "expected", "message"],
        placeholders: {
          selector: "e.g. h1#title",
          expected: "e.g. Hello, World!",
          message: "e.g. The <h1> should contain the text 'Hello, World!'.",
        },
      },
    ],
  },
  {
    category: "CSS Presentation",
    types: [
      {
        value: "selector_property",
        label: "Property Equals (e.g. color: red, font-size: 16px)",
        fields: ["selector", "property", "expected", "message"],
        placeholders: {
          selector: "e.g. h1",
          property: "e.g. color",
          expected: "e.g. red or #ff0000",
          message: "e.g. Set the heading color to red.",
        },
      },
      {
        value: "has_media_query",
        label: "Media Query Declaration",
        fields: ["pattern", "message"],
        placeholders: {
          pattern: "e.g. max-width:\\s*768px",
          message: "e.g. Add a responsive media query for screens 768px and below.",
        },
      },
    ],
  },
  {
    category: "Terminal / Console Output",
    types: [
      {
        value: "output_contains",
        label: "Output Contains String",
        fields: ["expected", "message"],
        placeholders: {
          expected: "e.g. 42 or Result: Success",
          message: "e.g. Program output must include the expected computation.",
        },
      },
      {
        value: "stdout_contains",
        label: "Stdout Contains String",
        fields: ["expected", "message"],
        placeholders: {
          expected: "e.g. Hello, Python!",
          message: "e.g. Print 'Hello, Python!' using print().",
        },
      },
      {
        value: "output_pattern",
        label: "Output Matches Regex Pattern",
        fields: ["pattern", "message"],
        placeholders: {
          pattern: "e.g. ^\\d{3}-\\d{2}-\\d{4}$",
          message: "e.g. Output must match the specified format.",
        },
      },
      {
        value: "stdout_pattern",
        label: "Stdout Matches Regex Pattern",
        fields: ["pattern", "message"],
        placeholders: {
          pattern: "e.g. Total:\\s+\\$\\d+",
          message: "e.g. Standard output must include the calculated total.",
        },
      },
    ],
  },
  {
    category: "Code & Syntax Checks",
    types: [
      {
        value: "code_contains",
        label: "Code Contains Substring / Identifier",
        fields: ["expected", "message"],
        placeholders: {
          expected: "e.g. for ... in or const total =",
          message: "e.g. Use a for-in loop to iterate over the items.",
        },
      },
      {
        value: "syntax_contains",
        label: "Syntax Token Exists",
        fields: ["expected", "message"],
        placeholders: {
          expected: "e.g. arrow_function or class_declaration",
          message: "e.g. Define the function using ES6 arrow syntax.",
        },
      },
      {
        value: "pattern",
        label: "Code Matches Regex Pattern",
        fields: ["pattern", "message"],
        placeholders: {
          pattern: "e.g. def\\s+calculate_\\w+\\(",
          message: "e.g. Declare the function with snake_case naming.",
        },
      },
    ],
  },
];

const ALL_TYPES = RULE_CATEGORIES.flatMap((c) => c.types);
const TYPE_LOOKUP = Object.fromEntries(ALL_TYPES.map((t) => [t.value, t]));

const S = {
  card: {
    background: "#0b1324",
    border: "1px solid #1e293b",
    borderRadius: "8px",
    padding: "1rem",
    marginTop: "0.5rem",
  },
  ruleList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    marginBottom: "1rem",
  },
  ruleItem: {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "6px",
    padding: "0.75rem 1rem",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "0.75rem",
  },
  badge: (type) => {
    let color = "#38bdf8";
    let bg = "rgba(56, 189, 248, 0.15)";
    if (type.startsWith("element") || type === "text_content") {
      color = "#38bdf8";
      bg = "rgba(56, 189, 248, 0.15)";
    } else if (type.startsWith("selector") || type.includes("media")) {
      color = "#c084fc";
      bg = "rgba(192, 132, 252, 0.15)";
    } else if (type.includes("output") || type.includes("stdout")) {
      color = "#34d399";
      bg = "rgba(52, 211, 153, 0.15)";
    } else {
      color = "#fbbf24";
      bg = "rgba(251, 191, 36, 0.15)";
    }
    return {
      fontSize: "0.72rem",
      fontWeight: 700,
      padding: "0.15rem 0.5rem",
      borderRadius: "4px",
      color,
      background: bg,
      textTransform: "uppercase",
      letterSpacing: "0.04em",
      display: "inline-block",
    };
  },
  btnSmall: {
    background: "#0f172a",
    color: "#94a3b8",
    border: "1px solid #334155",
    borderRadius: "4px",
    padding: "0.25rem 0.45rem",
    fontSize: "0.75rem",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
  },
  btnDelete: {
    background: "rgba(239, 68, 68, 0.12)",
    color: "#f87171",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    borderRadius: "4px",
    padding: "0.25rem 0.5rem",
    fontSize: "0.75rem",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
  },
  newRuleBox: {
    background: "#131d31",
    border: "1px solid #22324d",
    borderRadius: "6px",
    padding: "0.85rem",
  },
  input: {
    width: "100%",
    background: "#090d16",
    color: "#f8fafc",
    border: "1px solid #334155",
    borderRadius: "6px",
    padding: "0.45rem 0.65rem",
    fontSize: "0.82rem",
    outline: "none",
    boxSizing: "border-box",
  },
  label: {
    display: "block",
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "#cbd5e1",
    marginBottom: "0.25rem",
  },
  btnAdd: {
    background: "#0284c7",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    padding: "0.45rem 0.9rem",
    fontSize: "0.8rem",
    fontWeight: 600,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.35rem",
  },
  toggleBtn: {
    background: "transparent",
    color: "#94a3b8",
    border: "none",
    fontSize: "0.78rem",
    cursor: "pointer",
    padding: "0.25rem 0",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.3rem",
  },
  jsonArea: {
    width: "100%",
    background: "#090d16",
    color: "#38bdf8",
    border: "1px solid #334155",
    borderRadius: "6px",
    padding: "0.6rem",
    fontSize: "0.78rem",
    fontFamily: "monospace",
    marginTop: "0.5rem",
    boxSizing: "border-box",
  },
};

export default function CodingValidationRuleBuilder({
  rules = [],
  onChange,
}) {
  const [selectedType, setSelectedType] = useState("element_exists");
  const [formFields, setFormFields] = useState({
    selector: "",
    attribute: "",
    value: "",
    property: "",
    expected: "",
    pattern: "",
    message: "",
  });
  const [formError, setFormError] = useState("");
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [rawJsonEdit, setRawJsonEdit] = useState("");
  const [rawJsonError, setRawJsonError] = useState("");

  const activeDef = TYPE_LOOKUP[selectedType] || ALL_TYPES[0];

  const handleFieldChange = (field, val) => {
    setFormFields((prev) => ({ ...prev, [field]: val }));
    setFormError("");
  };

  const handleAddRule = (e) => {
    e.preventDefault();
    setFormError("");

    const newRule = { type: selectedType };
    for (const f of activeDef.fields) {
      const val = (formFields[f] || "").trim();
      if (!val && f !== "message") {
        setFormError(`Field "${f}" is required for ${activeDef.label}.`);
        return;
      }
      if (val) newRule[f] = val;
    }

    if (!newRule.message && formFields.message) {
      newRule.message = formFields.message.trim();
    }

    const updated = [...(rules || []), newRule];
    onChange(updated);

    // Reset fields
    setFormFields({
      selector: "",
      attribute: "",
      value: "",
      property: "",
      expected: "",
      pattern: "",
      message: "",
    });
  };

  const handleRemove = (index) => {
    const updated = (rules || []).filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleMove = (index, dir) => {
    const targetIdx = index + dir;
    if (targetIdx < 0 || targetIdx >= (rules || []).length) return;
    const list = [...(rules || [])];
    const item = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = item;
    onChange(list);
  };

  const handleApplyRawJson = () => {
    setRawJsonError("");
    try {
      const parsed = JSON.parse(rawJsonEdit);
      if (!Array.isArray(parsed)) {
        throw new Error("Must be a JSON array of rule objects.");
      }
      onChange(parsed);
      setShowJsonPreview(false);
    } catch (err) {
      setRawJsonError(err.message);
    }
  };

  return (
    <div style={S.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
        <div>
          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f8fafc" }}>
            Validation Rules ({(rules || []).length})
          </span>
          <span style={{ fontSize: "0.78rem", color: "#94a3b8", marginLeft: "0.5rem" }}>
            Automated criteria checked when the learner clicks "Check Code"
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            setRawJsonEdit(JSON.stringify(rules || [], null, 2));
            setShowJsonPreview(!showJsonPreview);
          }}
          style={S.toggleBtn}
        >
          <FiCode /> {showJsonPreview ? "Hide Advanced JSON" : "Advanced / JSON Preview"}
        </button>
      </div>

      {/* Active Rules List */}
      {(rules || []).length === 0 ? (
        <div style={{ padding: "0.75rem", background: "#090d16", borderRadius: "6px", color: "#64748b", fontSize: "0.8rem", textAlign: "center", marginBottom: "0.75rem" }}>
          No validation rules configured yet. Use the structured form below to add criteria.
        </div>
      ) : (
        <div style={S.ruleList}>
          {(rules || []).map((r, idx) => {
            const def = TYPE_LOOKUP[r.type];
            return (
              <div key={idx} style={S.ruleItem}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                    <span style={S.badge(r.type)}>{r.type}</span>
                    <strong style={{ fontSize: "0.82rem", color: "#f8fafc" }}>
                      {def ? def.label.split(" (")[0] : r.type}
                    </strong>
                  </div>

                  <div style={{ fontSize: "0.78rem", color: "#cbd5e1", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                    {r.selector && (
                      <span>
                        <span style={{ color: "#94a3b8" }}>Selector:</span>{" "}
                        <code style={{ background: "#090d16", padding: "0.1rem 0.35rem", borderRadius: "3px", color: "#38bdf8" }}>{r.selector}</code>
                      </span>
                    )}
                    {r.property && (
                      <span>
                        <span style={{ color: "#94a3b8" }}>Property:</span>{" "}
                        <code style={{ background: "#090d16", padding: "0.1rem 0.35rem", borderRadius: "3px", color: "#c084fc" }}>{r.property}</code>
                      </span>
                    )}
                    {r.attribute && (
                      <span>
                        <span style={{ color: "#94a3b8" }}>Attr:</span>{" "}
                        <code style={{ background: "#090d16", padding: "0.1rem 0.35rem", borderRadius: "3px", color: "#38bdf8" }}>{r.attribute}</code>
                      </span>
                    )}
                    {r.expected !== undefined && (
                      <span>
                        <span style={{ color: "#94a3b8" }}>Expected:</span>{" "}
                        <code style={{ background: "#090d16", padding: "0.1rem 0.35rem", borderRadius: "3px", color: "#34d399" }}>{String(r.expected)}</code>
                      </span>
                    )}
                    {r.value !== undefined && (
                      <span>
                        <span style={{ color: "#94a3b8" }}>Value:</span>{" "}
                        <code style={{ background: "#090d16", padding: "0.1rem 0.35rem", borderRadius: "3px", color: "#34d399" }}>{String(r.value)}</code>
                      </span>
                    )}
                    {r.pattern && (
                      <span>
                        <span style={{ color: "#94a3b8" }}>Pattern:</span>{" "}
                        <code style={{ background: "#090d16", padding: "0.1rem 0.35rem", borderRadius: "3px", color: "#fbbf24" }}>{r.pattern}</code>
                      </span>
                    )}
                  </div>

                  {r.message && (
                    <div style={{ fontSize: "0.76rem", color: "#94a3b8", fontStyle: "italic" }}>
                      Failure message: "{r.message}"
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMove(idx, -1)}
                    style={S.btnSmall}
                    title="Move Up"
                  >
                    <FiChevronUp />
                  </button>
                  <button
                    type="button"
                    disabled={idx === (rules || []).length - 1}
                    onClick={() => handleMove(idx, 1)}
                    style={S.btnSmall}
                    title="Move Down"
                  >
                    <FiChevronDown />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    style={S.btnDelete}
                    title="Delete Rule"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Advanced Raw JSON Inspection / Batch Edit */}
      {showJsonPreview && (
        <div style={{ marginBottom: "1rem", padding: "0.75rem", background: "#090d16", borderRadius: "6px", border: "1px solid #334155" }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#38bdf8", marginBottom: "0.25rem" }}>
            Raw JSON Configuration (Server-Validated)
          </div>
          <textarea
            rows={6}
            value={rawJsonEdit}
            onChange={(e) => setRawJsonEdit(e.target.value)}
            style={S.jsonArea}
          />
          {rawJsonError && (
            <div style={{ color: "#f87171", fontSize: "0.75rem", marginTop: "0.3rem" }}>
              {rawJsonError}
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
            <button
              type="button"
              onClick={handleApplyRawJson}
              style={{ ...S.btnSmall, background: "#0284c7", color: "#ffffff", border: "none" }}
            >
              Apply JSON Changes
            </button>
          </div>
        </div>
      )}

      {/* Structured Add Rule Form */}
      <div style={S.newRuleBox}>
        <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#f8fafc", marginBottom: "0.6rem" }}>
          + Add New Validation Rule
        </div>

        {formError && (
          <div style={{ color: "#f87171", fontSize: "0.75rem", marginBottom: "0.5rem" }}>
            {formError}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", marginBottom: "0.6rem" }}>
          <div>
            <label style={S.label}>Rule Type *</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              style={S.input}
            >
              {RULE_CATEGORIES.map((cat) => (
                <optgroup key={cat.category} label={cat.category}>
                  {cat.types.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {activeDef.fields.includes("selector") && (
            <div>
              <label style={S.label}>CSS Selector *</label>
              <input
                type="text"
                placeholder={activeDef.placeholders.selector}
                value={formFields.selector}
                onChange={(e) => handleFieldChange("selector", e.target.value)}
                style={S.input}
              />
            </div>
          )}

          {activeDef.fields.includes("property") && (
            <div>
              <label style={S.label}>CSS Property *</label>
              <input
                type="text"
                placeholder={activeDef.placeholders.property}
                value={formFields.property}
                onChange={(e) => handleFieldChange("property", e.target.value)}
                style={S.input}
              />
            </div>
          )}

          {activeDef.fields.includes("attribute") && (
            <div>
              <label style={S.label}>HTML Attribute *</label>
              <input
                type="text"
                placeholder={activeDef.placeholders.attribute}
                value={formFields.attribute}
                onChange={(e) => handleFieldChange("attribute", e.target.value)}
                style={S.input}
              />
            </div>
          )}

          {activeDef.fields.includes("value") && (
            <div>
              <label style={S.label}>Expected Attribute Value *</label>
              <input
                type="text"
                placeholder={activeDef.placeholders.value}
                value={formFields.value}
                onChange={(e) => handleFieldChange("value", e.target.value)}
                style={S.input}
              />
            </div>
          )}

          {activeDef.fields.includes("expected") && (
            <div>
              <label style={S.label}>Expected Value / Content *</label>
              <input
                type="text"
                placeholder={activeDef.placeholders.expected}
                value={formFields.expected}
                onChange={(e) => handleFieldChange("expected", e.target.value)}
                style={S.input}
              />
            </div>
          )}

          {activeDef.fields.includes("pattern") && (
            <div>
              <label style={S.label}>Regex Pattern *</label>
              <input
                type="text"
                placeholder={activeDef.placeholders.pattern}
                value={formFields.pattern}
                onChange={(e) => handleFieldChange("pattern", e.target.value)}
                style={S.input}
              />
            </div>
          )}

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={S.label}>Failure Message (Shown to learner if rule fails)</label>
            <input
              type="text"
              placeholder={activeDef.placeholders.message}
              value={formFields.message}
              onChange={(e) => handleFieldChange("message", e.target.value)}
              style={S.input}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddRule}
          style={S.btnAdd}
        >
          <FiPlus /> Add Rule to Block
        </button>
      </div>
    </div>
  );
}
