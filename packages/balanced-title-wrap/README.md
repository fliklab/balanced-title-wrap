# balanced-title-wrap

Fast, dependency-free title wrapping that balances line widths, keeps words
intact, and prefers punctuation boundaries such as `, `, `. `, `! `, and `? `.

## Install

```bash
npm install balanced-title-wrap
```

## Browser usage

```ts
import { balanceTitleForElement } from "balanced-title-wrap";

const title = document.querySelector("h1")!;
const container = title.parentElement!;

const lines = balanceTitleForElement(
  title.textContent ?? "",
  container.clientWidth,
  title,
);

title.replaceChildren(
  ...lines.map((line) => {
    const span = document.createElement("span");
    span.textContent = line;
    span.style.display = "block";
    span.style.whiteSpace = "nowrap";
    return span;
  }),
);
```

No newline characters are inserted into the source string. The returned array
controls visual lines through ordinary block elements.

## Core usage

Use the framework-independent core when you already have a text measurement
function:

```ts
import { balanceTitle } from "balanced-title-wrap";

const canvas = document.createElement("canvas");
const context = canvas.getContext("2d")!;
context.font = "700 48px sans-serif";

const lines = balanceTitle(
  "마케팅에서 중요하게 생각하는 법칙은 단 하나",
  520,
  (text) => context.measureText(text).width,
);
```

## Rules

1. Keep the title on one line when it fits.
2. Keep whitespace-delimited words intact.
3. When wrapping is necessary, prefer boundaries after `, `, `. `, `! `, and `? `.
4. Do not treat joined punctuation such as `36.5` as a boundary.
5. Balance any remaining long segment across multiple lines.

Preferred punctuation is weighted, not forced. The algorithm keeps the minimum
line count and may choose another whitespace boundary when it produces a
substantially better balance.

Customize preferred punctuation and its weight when needed:

```ts
balanceTitle(text, width, measureText, {
  priorityEndings: [",", ".", "!", "?", ";"],
  priorityBreakBonus: 0.75,
});
```

`priorityBreakBonus` defaults to `0.55`. Set it to `0` to turn punctuation
preference off without changing `priorityEndings`.

## API

- `balanceTitle(text, maxWidth, measureText, options?)`
- `balanceTitleForElement(text, maxWidth, referenceElement, options?)`
- `createElementTextMeasurer(text, referenceElement)`
- `normalizeTitle(text)`
- `hasPriorityEnding(text, priorityEndings?)`

## Performance

The algorithm uses dynamic programming over whitespace-delimited words. The DOM
helper measures all candidate phrases in one hidden layout pass and then removes
the temporary element immediately. It is intended for short headings and reacts
comfortably within an interactive resize flow.

## License

MIT

## Releases and provenance

Releases are published from the public GitHub repository through npm Trusted
Publishing. No long-lived npm publish token is stored in GitHub, and npm
automatically attaches provenance to each published version.
