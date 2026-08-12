export type MeasureText = (value: string) => number;

type Candidate = {
  lines: string[];
  balanceCost: number;
  lastWidth: number | null;
};

const PRIORITY_ENDING = /[,.]$/;

export function normalizeTitle(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function hasPriorityEnding(value: string) {
  return PRIORITY_ENDING.test(value);
}

export function balanceTitle(
  value: string,
  maxWidth: number,
  measureText: MeasureText,
): string[] {
  const normalized = normalizeTitle(value);
  if (!normalized) return [""];
  if (measureText(normalized) <= maxWidth) return [normalized];

  const words = normalized.split(" ");
  const priorityGroups = splitAtPriorityEndings(words);
  if (priorityGroups.length > 1) {
    return priorityGroups.flatMap((group) => balanceWords(group, maxWidth, measureText));
  }

  return balanceWords(words, maxWidth, measureText);
}

function balanceWords(words: string[], maxWidth: number, measureText: MeasureText) {
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
          balanceCost: candidate.balanceCost + distance * distance + upwardStep * upwardStep * 0.5,
          lastWidth: lineWidth,
        };

        const current = nextStates.get(end);
        if (!current || isBetter(next, current)) nextStates.set(end, next);
      }
    }

    states = nextStates;
  }

  return states.get(words.length)?.lines ?? greedyLines(words, maxWidth, measureText);
}

function splitAtPriorityEndings(words: string[]) {
  const groups: string[][] = [];
  let current: string[] = [];

  words.forEach((word, index) => {
    current.push(word);
    if (index < words.length - 1 && hasPriorityEnding(word)) {
      groups.push(current);
      current = [];
    }
  });

  if (current.length) groups.push(current);
  return groups;
}

function minimumLineCount(words: string[], maxWidth: number, measureText: MeasureText) {
  return greedyLines(words, maxWidth, measureText).length;
}

function greedyLines(words: string[], maxWidth: number, measureText: MeasureText) {
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

function isBetter(next: Candidate, current: Candidate) {
  return next.balanceCost < current.balanceCost;
}
