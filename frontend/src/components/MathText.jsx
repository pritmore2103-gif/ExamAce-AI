import React from "react";
import { BlockMath, InlineMath } from "react-katex";
import "katex/dist/katex.min.css";

// ============================================================
// LATEX HELPERS
// ============================================================

function convertUnicodeMath(text) {
  let value = String(text ?? "");

  // ----------------------------------------------------------
  // Greek letters
  // ----------------------------------------------------------

  const greek = {
    "θ": "\\theta",
    "ϑ": "\\vartheta",
    "φ": "\\phi",
    "ϕ": "\\phi",
    "λ": "\\lambda",
    "μ": "\\mu",
    "ω": "\\omega",
    "σ": "\\sigma",
    "Σ": "\\Sigma",
    "α": "\\alpha",
    "β": "\\beta",
    "γ": "\\gamma",
    "δ": "\\delta",
    "ε": "\\epsilon",
    "η": "\\eta",
    "κ": "\\kappa",
    "ρ": "\\rho",
    "τ": "\\tau",
    "Ω": "\\Omega",
    "Δ": "\\Delta",
    "π": "\\pi",
  };

  Object.entries(greek).forEach(
    ([symbol, latex]) => {
      value = value.split(symbol).join(latex);
    }
  );

  // ----------------------------------------------------------
  // Mathematical symbols
  // ----------------------------------------------------------

  value = value
    .replace(/×/g, "\\times ")
    .replace(/÷/g, "\\div ")
    .replace(/≤/g, "\\leq ")
    .replace(/≥/g, "\\geq ")
    .replace(/≠/g, "\\neq ")
    .replace(/≈/g, "\\approx ")
    .replace(/∞/g, "\\infty ")
    .replace(/∈/g, "\\in ")
    .replace(/∉/g, "\\notin ")
    .replace(/∑/g, "\\sum ")
    .replace(/∫/g, "\\int ")
    .replace(/∏/g, "\\prod ")
    .replace(/√/g, "\\sqrt{}");

  return value;
}

// ============================================================
// TRIG FUNCTIONS
// ============================================================

function convertTrig(text) {
  let value = String(text ?? "");

  // sin²x
  value = value.replace(
    /\b(sin|cos|tan|cot|sec|csc)\s*²\s*([A-Za-zθφϕλμωπ])/gi,
    (_, fn, variable) =>
      `\\${fn.toLowerCase()}^2${variable}`
  );

  // sin³x
  value = value.replace(
    /\b(sin|cos|tan|cot|sec|csc)\s*³\s*([A-Za-zθφϕλμωπ])/gi,
    (_, fn, variable) =>
      `\\${fn.toLowerCase()}^3${variable}`
  );

  // sin⁻¹x
  value = value.replace(
    /\b(sin|cos|tan)\s*⁻¹\s*([A-Za-zθφϕλμωπ])/gi,
    (_, fn, variable) =>
      `\\${fn.toLowerCase()}^{-1}${variable}`
  );

  // sin²(x)
  value = value.replace(
    /\b(sin|cos|tan|cot|sec|csc)\s*²\s*\(([^)]+)\)/gi,
    (_, fn, expression) =>
      `\\${fn.toLowerCase()}^2(${expression})`
  );

  // sin(x)
  value = value.replace(
    /\b(sin|cos|tan|cot|sec|csc|log|ln)\s*\(/gi,
    (_, fn) =>
      `\\${fn.toLowerCase()}(`
  );

  // sin θ
  value = value.replace(
    /\b(sin|cos|tan|cot|sec|csc|log|ln)\s+([A-Za-zθφϕλμωπ])/gi,
    (_, fn, variable) =>
      `\\${fn.toLowerCase()} ${variable}`
  );

  return value;
}

// ============================================================
// POWERS
// ============================================================

function convertSuperscripts(text) {
  let value = String(text ?? "");

  const superscripts = {
    "⁰": "0",
    "¹": "1",
    "²": "2",
    "³": "3",
    "⁴": "4",
    "⁵": "5",
    "⁶": "6",
    "⁷": "7",
    "⁸": "8",
    "⁹": "9",
    "⁺": "+",
    "⁻": "-",
  };

  // x², θ², a³ etc.
  value = value.replace(
    /([A-Za-z0-9)\]}])([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g,
    (_, base, power) => {
      const converted = [...power]
        .map(
          (char) =>
            superscripts[char] ?? char
        )
        .join("");

      return `${base}^{${converted}}`;
    }
  );

  return value;
}

// ============================================================
// SQUARE ROOT
// ============================================================

function convertRoots(text) {
  let value = String(text ?? "");

  // √(x + 1)
  value = value.replace(
    /√\s*\(([^()]*)\)/g,
    (_, expression) =>
      `\\sqrt{${expression}}`
  );

  // √x
  value = value.replace(
    /√\s*([A-Za-z0-9θφϕλμωπ]+)/g,
    (_, expression) =>
      `\\sqrt{${expression}}`
  );

  return value;
}

// ============================================================
// FRACTIONS
// ============================================================

function convertSimpleFractions(text) {
  let value = String(text ?? "");

  // a/b
  //
  // Only convert obvious mathematical fractions.
  // Do not convert URLs, dates, etc.
  value = value.replace(
    /\b([A-Za-z0-9θφϕλμωπ]+)\s*\/\s*([A-Za-z0-9θφϕλμωπ]+)\b/g,
    (_, numerator, denominator) =>
      `\\frac{${numerator}}{${denominator}}`
  );

  return value;
}

// ============================================================
// PLAIN TEXT → LATEX
// ============================================================

function normalizePlainMath(text) {
  let value = String(text ?? "");

  value = convertUnicodeMath(value);
  value = convertRoots(value);
  value = convertTrig(value);
  value = convertSuperscripts(value);
  value = convertSimpleFractions(value);

  return value;
}

// ============================================================
// DETECT MATH
// ============================================================

function looksLikeMath(text) {
  const value = String(text ?? "").trim();

  if (!value) return false;

  // Explicit mathematical symbols
  if (
    /[=+\-×÷√∞≤≥≠≈∑∫]/.test(value)
  ) {
    return true;
  }

  // Greek letters
  if (
    /[θφϕλμωσΣαβγδπ]/.test(value)
  ) {
    return true;
  }

  // Trigonometry
  if (
    /\b(sin|cos|tan|cot|sec|csc|log|ln)\b/i.test(
      value
    )
  ) {
    return true;
  }

  // Powers
  if (
    /[²³⁴⁵⁶⁷⁸⁹]|\^[0-9A-Za-z]/.test(
      value
    )
  ) {
    return true;
  }

  // LaTeX commands
  if (
    /\\(sin|cos|tan|frac|sqrt|theta|lambda|alpha|beta|gamma|pi|infty)\b/.test(
      value
    )
  ) {
    return true;
  }

  return false;
}

// ============================================================
// PARSE EXPLICIT MATH
// ============================================================

function parseText(text) {
  const value = String(text ?? "");

  const pattern =
    /(\$\$[\s\S]*?\$\$|\$[^$\n]+\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g;

  const parts = [];
  let lastIndex = 0;

  let match;

  while (
    (match = pattern.exec(value)) !== null
  ) {
    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        value: value.slice(
          lastIndex,
          match.index
        ),
      });
    }

    parts.push({
      type: "math",
      value: match[0],
    });

    lastIndex =
      match.index + match[0].length;
  }

  if (lastIndex < value.length) {
    parts.push({
      type: "text",
      value: value.slice(lastIndex),
    });
  }

  return parts;
}

// ============================================================
// RENDER EXPLICIT MATH
// ============================================================

function renderExplicitMath(
  value,
  key
) {
  const trimmed = value.trim();

  try {
    // $$ ... $$
    if (
      trimmed.startsWith("$$") &&
      trimmed.endsWith("$$")
    ) {
      const latex = trimmed.slice(2, -2).trim();

      return (
        <div
          key={key}
          className="my-3 overflow-x-auto"
        >
          <BlockMath math={latex} />
        </div>
      );
    }

    // \[ ... \]
    if (
      trimmed.startsWith("\\[") &&
      trimmed.endsWith("\\]")
    ) {
      const latex = trimmed
        .slice(2, -2)
        .trim();

      return (
        <div
          key={key}
          className="my-3 overflow-x-auto"
        >
          <BlockMath math={latex} />
        </div>
      );
    }

    // $ ... $
    if (
      trimmed.startsWith("$") &&
      trimmed.endsWith("$")
    ) {
      const latex = trimmed
        .slice(1, -1)
        .trim();

      return (
        <InlineMath
          key={key}
          math={latex}
        />
      );
    }

    // \( ... \)
    if (
      trimmed.startsWith("\\(") &&
      trimmed.endsWith("\\)")
    ) {
      const latex = trimmed
        .slice(2, -2)
        .trim();

      return (
        <InlineMath
          key={key}
          math={latex}
        />
      );
    }
  } catch (error) {
    console.error(
      "KaTeX rendering error:",
      error
    );
  }

  return null;
}

// ============================================================
// RENDER PLAIN TEXT
// ============================================================

function renderPlainText(text, key) {
  const value = String(text ?? "");

  if (!value) return null;

  // Break text into lines while preserving line breaks.
  const lines = value.split(/\n/);

  return (
    <React.Fragment key={key}>
      {lines.map((line, index) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return (
            <br
              key={`${key}-empty-${index}`}
            />
          );
        }

        // If the entire text is clearly mathematical,
        // render the COMPLETE expression together.
        if (looksLikeMath(trimmed)) {
          const latex =
            normalizePlainMath(trimmed);

          try {
            return (
              <React.Fragment
                key={`${key}-math-${index}`}
              >
                <InlineMath math={latex} />

                {index <
                  lines.length - 1 && (
                  <br />
                )}
              </React.Fragment>
            );
          } catch (error) {
            console.error(
              "Plain math rendering error:",
              error
            );

            return (
              <React.Fragment
                key={`${key}-fallback-${index}`}
              >
                {line}
                {index <
                  lines.length - 1 && (
                  <br />
                )}
              </React.Fragment>
            );
          }
        }

        return (
          <React.Fragment
            key={`${key}-text-${index}`}
          >
            {line}

            {index <
              lines.length - 1 && (
              <br />
            )}
          </React.Fragment>
        );
      })}
    </React.Fragment>
  );
}

// ============================================================
// INLINE RENDERER
// ============================================================

function renderContent(text) {
  const parts = parseText(text);

  return parts.map((part, index) => {
    if (part.type === "math") {
      return renderExplicitMath(
        part.value,
        `math-${index}`
      );
    }

    return renderPlainText(
      part.value,
      `text-${index}`
    );
  });
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function MathText({
  text,
  block = false,
  className = "",
}) {
  if (
    text === null ||
    text === undefined
  ) {
    return null;
  }

  const value = String(text);

  if (!value.trim()) {
    return null;
  }

  // Explicit block request.
  if (block) {
    const latex =
      normalizePlainMath(value);

    try {
      return (
        <div
          className={`overflow-x-auto ${className}`}
        >
          <BlockMath math={latex} />
        </div>
      );
    } catch (error) {
      console.error(
        "Block math error:",
        error
      );

      return (
        <div className={className}>
          {value}
        </div>
      );
    }
  }

  return (
    <span
      className={`leading-relaxed ${className}`}
    >
      {renderContent(value)}
    </span>
  );
}
