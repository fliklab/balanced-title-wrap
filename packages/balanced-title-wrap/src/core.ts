export type MeasureText = (value: string) => number;

export type BalanceTitleOptions = {
  /** Characters that become preferred break boundaries when followed by whitespace. */
  priorityEndings?: readonly string[];
  /** Reward applied to preferred punctuation breaks. Set to 0 to disable. */
  priorityBreakBonus?: number;
  /** Penalizes a longer line following a shorter line. Set to 0 to disable. */
  ascendingLinePenalty?: number;
};

type Candidate = {
  lines: string[];
  balanceCost: number;
  lastWidth: number | null;
};

const DEFAULT_PRIORITY_ENDINGS = [",", ".", "!", "?"] as const;

export function normalizeTitle(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function hasPriorityEnding(
  value: string,
  priorityEndings: readonly string[] = DEFAULT_PRIORITY_ENDINGS,
): boolean {
  return priorityEndings.some((ending) => ending.length > 0 && value.endsWith(ending));
}

export function balanceTitle(
  value: string,
  maxWidth: number,
  measureText: MeasureText,
  options: BalanceTitleOptions = {},
): string[] {
  assertMaxWidth(maxWidth);

  const normalized = normalizeTitle(value);
  if (!normalized) return [""];
  if (measureText(normalized) <= maxWidth) return [normalized];

  const priorityEndings = options.priorityEndings ?? DEFAULT_PRIORITY_ENDINGS;
  const priorityBreakBonus = options.priorityBreakBonus ?? 0.55;
  const ascendingLinePenalty = options.ascendingLinePenalty ?? 0.5;
  const words = normalized.split(" ");
  const priorityBreaks = words.map(
    (word, index) =>
      index < words.length - 1 && hasPriorityEnding(word, priorityEndings),
  );

  if (!Number.isFinite(priorityBreakBonus) || priorityBreakBonus < 0) {
    throw new RangeError("priorityBreakBonus must be a finite number greater than or equal to 0.");
  }

  return balanceWords(
    words,
    maxWidth,
    measureText,
    ascendingLinePenalty,
    priorityBreaks,
    priorityBreakBonus,
  );
}

export function getMeasurementCandidates(value: string): string[] {
  const normalized = normalizeTitle(value);
  if (!normalized) return [""];

  const words = normalized.split(" ");
  const phrases = new Set<string>([" ", normalized, ...words]);

  for (let start = 0; start < words.length; start += 1) {
    for (let end = start + 1; end <= words.length; end += 1) {
      phrases.add(words.slice(start, end).join(" "));
    }
  }

  return [...phrases];
}

function balanceWords(
  words: string[],
  maxWidth: number,
  measureText: MeasureText,
  ascendingLinePenalty: number,
  priorityBreaks: readonly boolean[],
  priorityBreakBonus: number,
): string[] {
  const fullLine = words.join(" ");
  if (measureText(fullLine) <= maxWidth) return [fullLine];

  const lineCount = minimumLineCount(words, maxWidth, measureText);
  const totalContentWidth = words.reduce((sum, word) => sum + measureText(word), 0);
  const totalSpaceWidth = measureText(" ") * Math.max(0, words.length - lineCount);
  const targetWidth = (totalContentWidth + totalSpaceWidth) / lineCount;

  let states = new Map<number, Candidate>();
  states.set(0, { lines: [], balanceCost: 0, lastWidth: null });

  for (let used = 0; used < lineCount; used += 1) {
    const nextStates = new Map<number, Candidate>();

    for (const [start, candidate] of states) {
      const remainingLines = lineCount - used - 1;
      const lastPossibleEnd = words.length - remainingLines;

      for (let end = start + 1; end <= lastPossibleEnd; end += 1) {
        const line = words.slice(start, end).join(" ");
        const lineWidth = measureText(line);
        const singleOversizedWord = end === start + 1;

        if (lineWidth > maxWidth && !singleOversizedWord) break;

        const distance = (lineWidth - targetWidth) / Math.max(maxWidth, 1);
        const upwardStep = candidate.lastWidth !== null && lineWidth > candidate.lastWidth
          ? (lineWidth - candidate.lastWidth) / Math.max(maxWidth, 1)
          : 0;
        const next: Candidate = {
          lines: [...candidate.lines, line],
          balanceCost:
            candidate.balanceCost +
            distance * distance +
            upwardStep * upwardStep * ascendingLinePenalty -
            (priorityBreaks[end - 1] ? priorityBreakBonus : 0),
          lastWidth: lineWidth,
        };

        const current = nextStates.get(end);
        if (!current || next.balanceCost < current.balanceCost) {
          nextStates.set(end, next);
        }
      }
    }

    states = nextStates;
  }

  return states.get(words.length)?.lines ?? greedyLines(words, maxWidth, measureText);
}

function minimumLineCount(
  words: string[],
  maxWidth: number,
  measureText: MeasureText,
): number {
  return greedyLines(words, maxWidth, measureText).length;
}

function greedyLines(
  words: string[],
  maxWidth: number,
  measureText: MeasureText,
): string[] {
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const joined = current ? `${current} ${word}` : word;
    if (current && measureText(joined) > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = joined;
    }
  }

  if (current) lines.push(current);
  return lines;
}

function assertMaxWidth(maxWidth: number): void {
  if (!Number.isFinite(maxWidth) || maxWidth <= 0) {
    throw new RangeError("maxWidth must be a finite number greater than 0.");
  }
}
