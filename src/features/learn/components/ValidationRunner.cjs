/**
 * ─────────────────────────────────────────────────────────────────────────────
 * ValidationRunner.cjs — CommonJS Educational Exercise Validator Engine
 * ─────────────────────────────────────────────────────────────────────────────
 */

function validateHtmlExercise(code, rules = [], customDoc = null) {
  if (!code || typeof code !== "string") {
    return {
      passed: false,
      checks: [{ id: "non-empty", description: "Code must not be empty", passed: false }],
    };
  }

  let doc = customDoc;
  if (!doc && typeof DOMParser !== "undefined") {
    try {
      const parser = new DOMParser();
      doc = parser.parseFromString(code, "text/html");
    } catch (err) {
      return {
        passed: false,
        checks: [{ id: "parse", description: "HTML must parse cleanly", passed: false, message: err.message }],
      };
    }
  }

  const checks = [];

  for (const rule of rules) {
    let passed = false;
    let message = "";

    if (doc) {
      switch (rule.type) {
        case "element_exists": {
          const els = doc.querySelectorAll(rule.selector);
          const minCount = rule.minCount || 1;
          passed = els.length >= minCount;
          message = passed ? `Found element matching ${rule.selector}` : `Missing element matching ${rule.selector}`;
          break;
        }

        case "element_attribute": {
          const el = doc.querySelector(rule.selector);
          if (!el) {
            passed = false;
            message = `Element ${rule.selector} not found`;
          } else {
            const attrVal = el.getAttribute(rule.attribute);
            if (rule.pattern) {
              const regex = new RegExp(rule.pattern, "i");
              passed = regex.test(attrVal || "");
              message = passed
                ? `Attribute ${rule.attribute} matches expected pattern`
                : `Attribute ${rule.attribute} ("${attrVal || ""}") does not match expected pattern`;
            } else if (rule.value !== undefined) {
              passed = (attrVal || "").trim().toLowerCase() === String(rule.value).trim().toLowerCase();
              message = passed
                ? `Attribute ${rule.attribute} matches "${rule.value}"`
                : `Attribute ${rule.attribute} is "${attrVal || ""}", expected "${rule.value}"`;
            } else {
              passed = el.hasAttribute(rule.attribute) && attrVal !== null && attrVal.trim().length > 0;
              message = passed ? `Attribute ${rule.attribute} is present and non-empty` : `Attribute ${rule.attribute} is missing or empty`;
            }
          }
          break;
        }

        case "text_content": {
          const el = doc.querySelector(rule.selector);
          if (!el) {
            passed = false;
            message = `Element ${rule.selector} not found`;
          } else {
            const text = el.textContent || "";
            if (rule.pattern) {
              passed = new RegExp(rule.pattern, "i").test(text);
            } else if (rule.contains) {
              passed = text.toLowerCase().includes(String(rule.contains).toLowerCase());
            } else {
              passed = text.trim().length > 0;
            }
            message = passed ? `Text content satisfied for ${rule.selector}` : `Text content requirement not met for ${rule.selector}`;
          }
          break;
        }

        default:
          passed = true;
          message = "Criterion passed";
      }
    } else {
      // Fallback regex checking for Node environments without DOMParser
      if (rule.selector) {
        passed = new RegExp(`<${rule.selector}\\b`, "i").test(code);
      } else {
        passed = true;
      }
      message = passed ? "Pattern matched" : "Pattern not matched";
    }

    checks.push({
      id: rule.id || rule.description,
      description: rule.description || `Verify ${rule.type}`,
      passed,
      message,
    });
  }

  const allPassed = checks.length > 0 && checks.every((c) => c.passed);
  return { passed: allPassed, checks };
}

function validateCssExercise(code, rules = []) {
  if (!code || typeof code !== "string") {
    return {
      passed: false,
      checks: [{ id: "non-empty", description: "CSS code must not be empty", passed: false }],
    };
  }

  const checks = [];

  for (const rule of rules) {
    let passed = false;
    let message = "";

    switch (rule.type) {
      case "selector_property": {
        const selectorEscaped = rule.selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const blockRegex = new RegExp(
          `${selectorEscaped}\\s*\\{[^}]*?\\b${rule.property}\\s*:\\s*([^;\\}\\n]+)`,
          "i"
        );
        const match = code.match(blockRegex);
        if (!match) {
          passed = false;
          message = `Property "${rule.property}" not found in rule for "${rule.selector}"`;
        } else {
          const actualVal = match[1].trim();
          if (rule.value) {
            const expectedVal = String(rule.value).trim().toLowerCase();
            passed = actualVal.toLowerCase().includes(expectedVal);
            message = passed
              ? `Rule "${rule.selector}" has "${rule.property}: ${actualVal}"`
              : `Rule "${rule.selector}" property "${rule.property}" is "${actualVal}", expected "${rule.value}"`;
          } else {
            passed = true;
            message = `Rule "${rule.selector}" defines property "${rule.property}"`;
          }
        }
        break;
      }

      case "has_media_query": {
        passed = /@media\b/.test(code);
        if (passed && rule.condition) {
          passed = code.toLowerCase().includes(String(rule.condition).toLowerCase());
        }
        message = passed
          ? "Responsive @media query rule is present"
          : "Add a responsive @media query";
        break;
      }

      default:
        passed = true;
        message = "Criterion passed";
    }

    checks.push({
      id: rule.id || rule.description,
      description: rule.description || `Verify ${rule.type}`,
      passed,
      message,
    });
  }

  const allPassed = checks.length > 0 && checks.every((c) => c.passed);
  return { passed: allPassed, checks };
}

function validateJsExercise(code, executionOutput = {}, rules = []) {
  const stdout = executionOutput.logs ? executionOutput.logs.join("\n") : (executionOutput.stdout || "");
  const errors = executionOutput.errors || [];
  const checks = [];

  if (errors.length > 0) {
    checks.push({
      id: "no-runtime-errors",
      description: "Code must execute without runtime errors",
      passed: false,
      message: errors[0].text || errors[0] || "Runtime error occurred",
    });
    return { passed: false, checks };
  }

  for (const rule of rules) {
    let passed = false;
    let message = "";

    switch (rule.type) {
      case "output_contains":
      case "stdout_contains": {
        const text = String(rule.value || rule.text || "");
        passed = stdout.toLowerCase().includes(text.toLowerCase());
        message = passed ? `Output contains "${text}"` : `Output should contain "${text}"`;
        break;
      }

      case "output_pattern":
      case "stdout_pattern": {
        const regex = new RegExp(rule.pattern, rule.flags || "i");
        passed = regex.test(stdout);
        message = passed ? "Output matches expected pattern" : `Output does not match pattern ${rule.pattern}`;
        break;
      }

      case "code_contains":
      case "syntax_contains": {
        const val = rule.value || rule.keyword;
        if (val) {
          passed = code.includes(val);
        } else if (rule.pattern) {
          passed = new RegExp(rule.pattern, rule.flags || "i").test(code);
        } else {
          passed = true;
        }
        message = passed ? `Used required construct: ${rule.message || val}` : (rule.message || `Must use ${val}`);
        break;
      }

      case "pattern": {
        const regex = new RegExp(rule.pattern, rule.flags || "i");
        passed = regex.test(code);
        message = passed ? "Code matches pattern" : (rule.message || "Pattern not matched");
        break;
      }

      default:
        passed = true;
        message = "Criterion passed";
    }

    checks.push({
      id: rule.id || rule.description || rule.type,
      description: rule.description || rule.message || `Verify ${rule.type}`,
      passed,
      message,
    });
  }

  const allPassed = checks.length > 0 && checks.every((c) => c.passed);
  return { passed: allPassed, checks };
}

function validatePythonExercise(code, executionOutput = {}, rules = []) {
  const stdout = executionOutput.stdout || (typeof executionOutput === "string" ? executionOutput : "");
  const errors = executionOutput.errors || [];
  const checks = [];

  if (errors.length > 0) {
    checks.push({
      id: "no-runtime-errors",
      description: "Python code must execute without runtime errors",
      passed: false,
      message: errors[0] || "Runtime error occurred",
    });
    return { passed: false, checks };
  }

  for (const rule of rules) {
    let passed = false;
    let message = "";

    switch (rule.type) {
      case "output_contains":
      case "stdout_contains": {
        const text = String(rule.value || rule.text || "");
        passed = stdout.toLowerCase().includes(text.toLowerCase());
        message = passed ? `Output contains "${text}"` : `Output should contain "${text}"`;
        break;
      }

      case "output_pattern":
      case "stdout_pattern": {
        const regex = new RegExp(rule.pattern, rule.flags || "i");
        passed = regex.test(stdout);
        message = passed ? "Output matches expected pattern" : `Output does not match pattern ${rule.pattern}`;
        break;
      }

      case "code_contains": {
        const val = rule.value || rule.keyword;
        if (val) {
          passed = code.includes(val);
        } else if (rule.pattern) {
          passed = new RegExp(rule.pattern, rule.flags || "i").test(code);
        } else {
          passed = true;
        }
        message = passed ? `Used required construct: ${rule.message || val}` : (rule.message || `Must use ${val}`);
        break;
      }

      default:
        passed = true;
        message = "Criterion passed";
    }

    checks.push({
      id: rule.id || rule.description || rule.type,
      description: rule.description || rule.message || `Verify ${rule.type}`,
      passed,
      message,
    });
  }

  const allPassed = checks.length > 0 && checks.every((c) => c.passed);
  return { passed: allPassed, checks };
}

function runExerciseValidation({ language, code, rules = [], executionOutput = {} }) {
  const lang = String(language || "").toLowerCase();
  if (lang === "html") {
    return validateHtmlExercise(code, rules);
  }
  if (lang === "css") {
    return validateCssExercise(code, rules);
  }
  if (lang === "javascript" || lang === "js") {
    return validateJsExercise(code, executionOutput, rules);
  }
  if (lang === "python" || lang === "py") {
    return validatePythonExercise(code, executionOutput, rules);
  }
  return { passed: true, checks: [] };
}

module.exports = {
  validateHtmlExercise,
  validateCssExercise,
  validateJsExercise,
  validatePythonExercise,
  runExerciseValidation,
};

