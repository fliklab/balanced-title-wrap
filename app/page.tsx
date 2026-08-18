"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { balanceTitleForElement, normalizeTitle } from "balanced-title-wrap";

const SAMPLE_TITLES = [
  "마케팅에서 중요하게 생각하는 법칙은 단 하나",
  "그렇지만, 우리는 중요하게 생각하는 것이 따로 있다.",
  "정말 중요한 것은 무엇일까? 우리는 다시 생각해본다.",
  "36.5도의 온도는 처음으로 회원가입했을 때의 기본값이다.",
];

const WIDTH_MIN = 180;
const WIDTH_MAX = 900;
const COMPARISON_GAP = 144;

export default function Home() {
  const [text, setText] = useState(SAMPLE_TITLES[0]);
  const [fontSize, setFontSize] = useState(52);
  const [width, setWidth] = useState(520);
  const [nativeBalance, setNativeBalance] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);
  const [codeTab, setCodeTab] = useState<"html" | "css">("html");
  const [lineCount, setLineCount] = useState(1);
  const [titleLines, setTitleLines] = useState([normalizeTitle(SAMPLE_TITLES[0])]);
  const [comparisonHorizontal, setComparisonHorizontal] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const guideRef = useRef<HTMLDivElement>(null);
  const previewShellRef = useRef<HTMLDivElement>(null);
  const displayText = normalizeTitle(text) || "제목을 입력하세요";

  const renderedHtml = [
    `<div class="width-guide" style="width: min(${width}px, 100%)">`,
    `  <h2 class="is-balanced" style="font-size: ${fontSize}px">`,
    ...titleLines.map(
      (line) => `    <span class="title-line">${escapeHtml(line)}</span>`,
    ),
    "  </h2>",
    "</div>",
  ].join("\n");

  const renderedCss = `.width-guide h2.is-balanced {
  display: flex;
  flex-direction: column;
  word-break: keep-all;
}

.title-line {
  display: block;
  white-space: nowrap;
}`;

  const updateLines = useCallback(() => {
    const title = titleRef.current;
    const guide = guideRef.current;
    if (!title || !guide) return;

    const lines = balanceTitleForElement(displayText, guide.clientWidth, title);
    setTitleLines(lines);
    setLineCount(lines.length);
  }, [displayText]);

  const startWidthDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = width;

    const move = (moveEvent: PointerEvent) => {
      setWidth(clamp(startWidth + (moveEvent.clientX - startX) * 2, WIDTH_MIN, WIDTH_MAX));
    };
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
  };

  const adjustWidthWithKeyboard = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const step = event.shiftKey ? 50 : 10;
    setWidth((current) => clamp(current + direction * step, WIDTH_MIN, WIDTH_MAX));
  };

  useEffect(() => {
    if (!codeOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setCodeOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [codeOpen]);

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    if (!("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8%", threshold: 0.08 },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const shell = previewShellRef.current;
    if (!shell) return;
    const updateLayout = () => {
      setComparisonHorizontal(shell.clientWidth >= width * 2 + COMPARISON_GAP);
    };
    updateLayout();
    const observer = new ResizeObserver(updateLayout);
    observer.observe(shell);
    return () => observer.disconnect();
  }, [width]);

  useLayoutEffect(() => {
    const title = titleRef.current;
    const guide = guideRef.current;
    if (!title || !guide) return;
    updateLines();
    const observer = new ResizeObserver(updateLines);
    observer.observe(guide);
    document.fonts?.ready.then(updateLines);
    return () => observer.disconnect();
  }, [text, fontSize, width, comparisonHorizontal, updateLines]);

  const guideStyle = { width: `min(${width}px, 100%)` };

  return (
    <main>
      <header className="site-header reveal reveal-1">
        <a className="brand" href="#top" aria-label="밸런스 랩 홈">
          <span className="brand-mark" aria-hidden="true">B</span>
          <span>Balance Wrap Lab</span>
        </a>
        <p>Smart wrapping · punctuation aware</p>
      </header>

      <section className="intro reveal reveal-2" id="top">
        <h1>제목 줄바꿈을 눈으로 조율하세요.</h1>
        <p>
          줄바꿈 문자를 넣지 않고도 각 줄의 길이를 자연스럽게 맞춥니다.
          내용을 입력하고 크기와 폭을 움직여 결과를 확인해보세요.
        </p>
      </section>

      <section className="lab reveal reveal-3" aria-label="균형 줄바꿈 테스트 도구">
        <div className="preview-panel">
          <div className="preview-meta" aria-live="polite">
            <span>브라우저 기본 줄바꿈과 균형 줄바꿈 비교</span>
            <div className="preview-actions">
              <span>{width}px · {fontSize}px · 적용 후 {lineCount}줄</span>
              <button
                className={`code-toggle ${codeOpen ? "is-open" : ""}`}
                type="button"
                aria-expanded={codeOpen}
                aria-controls="rendered-code-panel"
                onClick={() => setCodeOpen((value) => !value)}
              >
                <span aria-hidden="true">&lt;/&gt;</span>
                {codeOpen ? "코드 닫기" : "코드 보기"}
              </button>
            </div>
          </div>

          <div className="preview-tuning" aria-label="미리보기 조절">
            <Control label="글자 크기" value={fontSize} min={20} max={96} unit="px" onChange={setFontSize} />
            <Control label="제목 영역 폭" value={width} min={WIDTH_MIN} max={WIDTH_MAX} unit="px" onChange={setWidth} />
          </div>

          <div className="preview-shell" ref={previewShellRef}>
            <div className="preview-workspace">
              <div className={`comparison-stage ${comparisonHorizontal ? "is-horizontal" : "is-stacked"}`}>
                <section className="comparison-side before-side" aria-labelledby="before-label">
                  <div className="comparison-label" id="before-label">
                    <strong>적용 전</strong>
                    <div className="comparison-label-options">
                      <span>browser wrap</span>
                      <label className="native-balance-option">
                        <input
                          type="checkbox"
                          checked={nativeBalance}
                          onChange={(event) => setNativeBalance(event.target.checked)}
                        />
                        <span>text-wrap: balance</span>
                      </label>
                    </div>
                  </div>
                  <div className="comparison-canvas">
                    <div className="width-guide" style={guideStyle}>
                      <span className="guide-cap guide-cap-left" aria-hidden="true" />
                      <WidthDragHandle width={width} onPointerDown={startWidthDrag} onKeyDown={adjustWidthWithKeyboard} />
                      <h2
                        className={nativeBalance ? "uses-native-balance" : undefined}
                        style={{ fontSize: `${fontSize}px` }}
                      >
                        {displayText}
                      </h2>
                    </div>
                  </div>
                </section>

                <div className="comparison-arrow" aria-hidden="true">
                  <svg viewBox="0 0 48 24">
                    <path d="M3 12h38M33 4l8 8-8 8" />
                  </svg>
                </div>

                <section className="comparison-side after-side" aria-labelledby="after-label">
                  <div className="comparison-label" id="after-label">
                    <strong>balanced-wrap 적용 후</strong>
                    <span>npm package</span>
                  </div>
                  <div className="comparison-canvas">
                    <div ref={guideRef} className="width-guide" style={guideStyle}>
                      <span className="guide-cap guide-cap-left" aria-hidden="true" />
                      <WidthDragHandle width={width} onPointerDown={startWidthDrag} onKeyDown={adjustWidthWithKeyboard} />
                      <h2 ref={titleRef} className="is-balanced" style={{ fontSize: `${fontSize}px` }}>
                        {titleLines.map((line, index) => (
                          <span className="title-line" key={`${line}-${index}`}>{line}</span>
                        ))}
                      </h2>
                    </div>
                  </div>
                </section>
              </div>

              {codeOpen && (
                <aside className="code-panel" id="rendered-code-panel" aria-label="현재 렌더링 코드">
                  <div className="code-panel-heading">
                    <div>
                      <strong>balanced-wrap 적용 후 렌더 결과</strong>
                      <span>줄별 span 구조</span>
                    </div>
                    <button type="button" onClick={() => setCodeOpen(false)} aria-label="코드 패널 닫기">닫기</button>
                  </div>
                  <p className="code-explanation">
                    원문에는 줄바꿈 문자를 넣지 않습니다. 계산된 줄마다 span을 만들어 시각적인 줄만 고정합니다.
                  </p>
                  <div className="code-single">
                    <div className="code-tabs" role="tablist" aria-label="코드 종류">
                      {(["html", "css"] as const).map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          role="tab"
                          aria-selected={codeTab === tab}
                          aria-controls="rendered-code"
                          className={codeTab === tab ? "is-active" : ""}
                          onClick={() => setCodeTab(tab)}
                        >
                          {tab.toUpperCase()}
                        </button>
                      ))}
                    </div>
                    <pre id="rendered-code" role="tabpanel" tabIndex={0}>
                      <code>{codeTab === "html" ? renderedHtml : renderedCss}</code>
                    </pre>
                  </div>
                </aside>
              )}
            </div>
          </div>

          <div className="code-strip">
            <code>한 줄 확인 → 구두점 경계 → 구간별 폭 균형</code>
            <span>경계 손잡이를 좌우로 드래그해 폭 조절</span>
          </div>
        </div>

        <aside className="controls">
          <div className="control-heading"><h2>제목 입력</h2></div>
          <div className="text-control">
            <label className="field text-field">
              <span>제목 내용</span>
              <textarea value={text} onChange={(event) => setText(event.target.value)} rows={3} spellCheck={false} />
            </label>
            <div className="samples" aria-label="예시 제목">
              {SAMPLE_TITLES.map((sample, index) => (
                <button key={sample} type="button" onClick={() => setText(sample)}>예시 {index + 1}</button>
              ))}
            </div>
          </div>
          <p className="hint">
            전체가 한 줄에 들어가면 나누지 않습니다. 넘칠 때는 쉼표, 마침표,
            느낌표, 물음표 뒤 공백을 우선하되 균형이 크게 깨지면 다른 공백을
            선택합니다. 36.5처럼 글자가 붙으면 무시합니다.
          </p>
        </aside>
      </section>

      <footer className="reveal reveal-4">
        <p>짧은 제목과 카피를 위한 균형 줄바꿈 실험실</p>
        <p>짧은 제목은 거의 즉시 계산</p>
      </footer>
    </main>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

type WidthDragHandleProps = {
  width: number;
  onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
};

function WidthDragHandle({ width, onPointerDown, onKeyDown }: WidthDragHandleProps) {
  return (
    <button
      className="width-drag-handle"
      type="button"
      role="slider"
      aria-label="제목 폭 드래그 조절"
      aria-valuemin={WIDTH_MIN}
      aria-valuemax={WIDTH_MAX}
      aria-valuenow={width}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
    >
      <span aria-hidden="true" />
    </button>
  );
}

type ControlProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (value: number) => void;
};

function Control({ label, value, min, max, unit, onChange }: ControlProps) {
  const update = (rawValue: string) => {
    const next = Number(rawValue);
    if (Number.isFinite(next)) onChange(Math.min(max, Math.max(min, next)));
  };
  const fill = ((value - min) / (max - min)) * 100;

  return (
    <div className="field range-field">
      <div className="field-row">
        <label htmlFor={`range-${label}`}>{label}</label>
        <div className="number-input">
          <input aria-label={`${label} 숫자 입력`} type="number" value={value} min={min} max={max} onChange={(event) => update(event.target.value)} />
          <span>{unit}</span>
        </div>
      </div>
      <input
        id={`range-${label}`}
        className="range"
        type="range"
        value={value}
        min={min}
        max={max}
        onChange={(event) => onChange(Number(event.target.value))}
        style={{ "--fill": `${fill}%` } as React.CSSProperties}
      />
      <div className="range-ends" aria-hidden="true"><span>{min}</span><span>{max}</span></div>
    </div>
  );
}
