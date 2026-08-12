import {
  balanceTitle,
  getMeasurementCandidates,
  type BalanceTitleOptions,
  type MeasureText,
} from "./core.js";

export function balanceTitleForElement(
  value: string,
  maxWidth: number,
  referenceElement: Element,
  options: BalanceTitleOptions = {},
): string[] {
  const measureText = createElementTextMeasurer(value, referenceElement);
  return balanceTitle(value, maxWidth, measureText, options);
}

export function createElementTextMeasurer(
  value: string,
  referenceElement: Element,
): MeasureText {
  const ownerDocument = referenceElement.ownerDocument;
  const view = ownerDocument.defaultView;

  if (!view || !ownerDocument.body) {
    throw new Error("The reference element must belong to an active browser document.");
  }

  const styles = view.getComputedStyle(referenceElement);
  const measurer = ownerDocument.createElement("div");

  Object.assign(measurer.style, {
    position: "fixed",
    left: "-10000px",
    top: "0",
    visibility: "hidden",
    pointerEvents: "none",
    contain: "layout style paint",
    font: styles.font,
    fontKerning: styles.fontKerning,
    fontStretch: styles.fontStretch,
    fontVariant: styles.fontVariant,
    letterSpacing: styles.letterSpacing,
    textTransform: styles.textTransform,
    whiteSpace: "nowrap",
  });

  const entries = getMeasurementCandidates(value).map((phrase) => {
    const span = ownerDocument.createElement("span");
    span.style.display = "block";
    span.style.width = "max-content";
    span.textContent = phrase;
    measurer.append(span);
    return [phrase, span] as const;
  });

  ownerDocument.body.append(measurer);
  const widths = new Map(
    entries.map(([phrase, span]) => [phrase, span.getBoundingClientRect().width]),
  );
  measurer.remove();

  return (phrase: string) => {
    const width = widths.get(phrase);
    if (width === undefined) {
      throw new Error(`Text was not included in the measurement set: ${phrase}`);
    }
    return width;
  };
}
