import { BlockMath, InlineMath } from "react-katex";
import "katex/dist/katex.min.css";

function normalizeMath(text) {
  return String(text)
    .replace(/√\s*\(([^)]+)\)/g, "\\sqrt{$1}")
    .replace(/√\s*([A-Za-z0-9]+)/g, "\\sqrt{$1}")
    .replace(/\b(sin|cos|tan|cot|sec|csc|log|ln)\s*\(/gi, "\\$1(")
    .replace(/\bsin\s*([²³])\s*([A-Za-zθφ])/gi, (_, power, value) => `\\sin^${power === "²" ? "2" : "3"}(${value})`)
    .replace(/\bcos\s*([²³])\s*([A-Za-zθφ])/gi, (_, power, value) => `\\cos^${power === "²" ? "2" : "3"}(${value})`)
    .replace(/\btan\s*([²³])\s*([A-Za-zθφ])/gi, (_, power, value) => `\\tan^${power === "²" ? "2" : "3"}(${value})`)
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

function renderMathToken(token, key) {
  try {
    return <InlineMath key={key}>{normalizeMath(token)}</InlineMath>;
  } catch {
    return <span key={key}>{token}</span>;
  }
}

function renderInline(text) {
  const explicitParts = String(text).split(/(\$[^$]+\$|\\\([^)]*\\\))/g);
  const mathTokenPattern = /(\\(?:sin|cos|tan|cot|sec|csc|log|ln|sqrt|theta|lambda|alpha|beta|gamma|delta|Delta|pi|phi|mu|omega|sigma|Sigma|times|div|infty|leq|geq|neq|approx|in|sum|int)(?:\([^)]*\))?|[πθφϕαβγδΔλμωσΣ∞≤≥≠≈∈∑∫×÷])/g;

  return explicitParts.flatMap((part, partIndex) => {
    if (part.startsWith("$") && part.endsWith("$")) {
      return [<InlineMath key={`${partIndex}-latex`}>{part.slice(1, -1)}</InlineMath>];
    }

    if (part.startsWith("\\(") && part.endsWith("\\)")) {
      return [<InlineMath key={`${partIndex}-latex`}>{part.slice(2, -2)}</InlineMath>];
    }

    const normalized = normalizeMath(part);
    const tokens = normalized.split(mathTokenPattern);
    const matches = normalized.match(mathTokenPattern) || [];

    if (matches.length === 0) {
      return [<span key={`${partIndex}-text`}>{part}</span>];
    }

    const result = [];
    let matchIndex = 0;

    tokens.forEach((token, index) => {
      if (token) result.push(<span key={`${partIndex}-text-${index}`}>{token}</span>);
      if (index < tokens.length - 1 && matches[matchIndex]) {
        result.push(renderMathToken(matches[matchIndex], `${partIndex}-math-${index}`));
        matchIndex += 1;
      }
    });

    return result;
  });
}

function looksLikeBlockMath(value) {
  const text = String(value).trim();
  return /[=^]/.test(text) && /[A-Za-z0-9\\]/.test(text) && text.length <= 180;
}

export default function MathText({ text, block = false, className = "" }) {
  if (text === null || text === undefined || text === "") return null;

  const value = String(text).trim();
  const formatted = normalizeMath(value);

  if (formatted.startsWith("$$") && formatted.endsWith("$$")) {
    return <div className={`overflow-x-auto py-2 ${className}`}><BlockMath>{formatted.slice(2, -2)}</BlockMath></div>;
  }

  if (formatted.startsWith("\\[") && formatted.endsWith("\\]")) {
    return <div className={`overflow-x-auto py-2 ${className}`}><BlockMath>{formatted.slice(2, -2)}</BlockMath></div>;
  }

  if (block && looksLikeBlockMath(formatted)) {
    return <div className={`overflow-x-auto py-2 ${className}`}><BlockMath>{formatted}</BlockMath></div>;
  }

  return <span className={`leading-8 whitespace-pre-wrap ${className}`}>{renderInline(value)}</span>;
}
