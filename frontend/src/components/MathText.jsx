import { BlockMath, InlineMath } from "react-katex";
import "katex/dist/katex.min.css";

function normalizeMath(text) {
  return String(text)
    .replace(/√\s*\(([^)]+)\)/g, "\\sqrt{$1}")
    .replace(/√\s*([A-Za-z0-9]+)/g, "\\sqrt{$1}")
    .replace(/\b(sin|cos|tan|cot|sec|csc|log|ln)\s*\(/gi, "\\$1(")
    .replace(/\bsin\s*([²³])\s*([A-Za-zθφ])/gi, (_, power, value) => `\\sin^${power === "²" ? "2" : "3"}${value}`)
    .replace(/\bcos\s*([²³])\s*([A-Za-zθφ])/gi, (_, power, value) => `\\cos^${power === "²" ? "2" : "3"}${value}`)
    .replace(/\btan\s*([²³])\s*([A-Za-zθφ])/gi, (_, power, value) => `\\tan^${power === "²" ? "2" : "3"}${value}`)
    .replace(/π/g, "\\pi")
    .replace(/θ/g, "\\theta")
    .replace(/φ/g, "\\phi")
    .replace(/ϕ/g, "\\phi")
    .replace(/α/g, "\\alpha")
    .replace(/β/g, "\\beta")
    .replace(/γ/g, "\\gamma")
    .replace(/δ/g, "\\delta")
    .replace(/Δ/g, "\\Delta")
    .replace(/λ/g, "\\lambda")
    .replace(/μ/g, "\\mu")
    .replace(/ω/g, "\\omega")
    .replace(/σ/g, "\\sigma")
    .replace(/Σ/g, "\\Sigma")
    .replace(/×/g, "\\times")
    .replace(/÷/g, "\\div")
    .replace(/∞/g, "\\infty")
    .replace(/≤/g, "\\leq")
    .replace(/≥/g, "\\geq")
    .replace(/≠/g, "\\neq")
    .replace(/≈/g, "\\approx")
    .replace(/∈/g, "\\in")
    .replace(/∑/g, "\\sum")
    .replace(/∫/g, "\\int");
}

function isMathLike(value) {
  const text = value.trim();
  if (!text) return false;

  return (
    /\\(theta|lambda|alpha|beta|gamma|delta|pi|phi|sqrt|sin|cos|tan|cot|sec|csc|sum|int)/.test(text) ||
    /[=<>≤≥≠≈∑∫√πθλφαβγδμσω×÷]/.test(text) ||
    /\b(sin|cos|tan|cot|sec|csc|log|ln)\b/i.test(text) && /[A-Za-z0-9]/.test(text) && /[()^²³=]/.test(text)
  );
}

function renderInline(text) {
  const formatted = normalizeMath(text);
  const parts = formatted.split(/(\$[^$]+\$|\\\([^)]*\\\))/g);

  return parts.map((part, index) => {
    if (part.startsWith("$") && part.endsWith("$")) {
      return <InlineMath key={index}>{part.slice(1, -1)}</InlineMath>;
    }

    if (part.startsWith("\\(") && part.endsWith("\\)")) {
      return <InlineMath key={index}>{part.slice(2, -2)}</InlineMath>;
    }

    if (isMathLike(part)) {
      try {
        return <InlineMath key={index}>{part}</InlineMath>;
      } catch {
        return <span key={index}>{part}</span>;
      }
    }

    return <span key={index}>{part}</span>;
  });
}

export default function MathText({ text, block = false, className = "" }) {
  if (text === null || text === undefined || text === "") return null;

  const value = String(text).trim();
  const formatted = normalizeMath(value);

  if ((formatted.startsWith("$$") && formatted.endsWith("$$")) || (formatted.startsWith("\\[") && formatted.endsWith("\\]"))) {
    const expression = formatted.startsWith("$$")
      ? formatted.slice(2, -2)
      : formatted.slice(2, -2);

    return (
      <div className={`overflow-x-auto py-2 ${className}`}>
        <BlockMath>{expression}</BlockMath>
      </div>
    );
  }

  if (block && isMathLike(formatted)) {
    return (
      <div className={`overflow-x-auto py-2 ${className}`}>
        <BlockMath>{formatted}</BlockMath>
      </div>
    );
  }

  return (
    <span className={`leading-8 whitespace-pre-wrap ${className}`}>
      {renderInline(value)}
    </span>
  );
}
