"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { balanceTitleForElement, normalizeTitle } from "balanced-title-wrap";

const SAMPLE_TITLES = [
  "마케팅에서 중요하게 생각하는 법칙은 단 하나",
  "그렇지만, 우리는 중요하게 생각하는 것이 따로 있다.",
  "정말 중요한 것은 무엇일까? 우리는 다시 생각해본다.",
  "36.5도의 온도는 처음으로 회원가입했을 때의 기본값이다.",
];

export default function Home() {
  const [text, setText] = useState(SAMPLE_TITLES[0]);
  const [fontSize, setFontSize] = useState(52);
  const [width, setWidth] = useState(520);
  const [balanced, setBalanced] = useState(true);
  const [lineCount, setLineCount] = useState(1);
  const [titleLines, setTitleLines] = useState([normalizeTitle(SAMPLE_TITLES[0])]);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const guideRef = useRef<HTMLDivElement>(null);

  const updateLines = useCallback(() => {
    const title = titleRef.current;
    const guide = guideRef.current;
    if (!title || !guide) return;

    const normalized = normalizeTitle(text) || "제목을 입력하세요";
    if (!balanced) {
      setTitleLines([normalized]);
      const styles = window.getComputedStyle(title);
      const lineHeight = Number.parseFloat(styles.lineHeight);
      setLineCount(Math.max(1, Math.round(title.getBoundingClientRect().height / lineHeight)));
      return;
    }

    const lines = balanceTitleForElement(normalized, guide.clientWidth, title);
    setTitleLines(lines);
    setLineCount(lines.length);
  }, [balanced, text]);

  useLayoutEffect(() => {
    const title = titleRef.current;
    const guide = guideRef.current;
    if (!title || !guide) return;

    updateLines();
    const observer = new ResizeObserver(updateLines);
    observer.observe(guide);
    document.fonts?.ready.then(updateLines);
    return () => observer.disconnect();
  }, [text, fontSize, width, balanced, updateLines]);

  useLayoutEffect(() => {
    if (balanced) return;
    const title = titleRef.current;
    if (!title) return;
    const styles = window.getComputedStyle(title);
    const lineHeight = Number.parseFloat(styles.lineHeight);
    setLineCount(Math.max(1, Math.round(title.getBoundingClientRect().height / lineHeight)));
  }, [balanced, fontSize, text, titleLines, width]);

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
            <span>{balanced ? "문장부호 우선 균형" : "일반 줄바꿈"}</span>
            <span>{width}px · {fontSize}px · {lineCount}줄</span>
          </div>

          <div className="preview-stage">
            <div ref={guideRef} className="width-guide" style={{ width: `min(${width}px, 100%)` }}>
              <span className="guide-cap guide-cap-left" aria-hidden="true" />
              <span className="guide-cap guide-cap-right" aria-hidden="true" />
              <h2
                ref={titleRef}
                className={balanced ? "is-balanced" : ""}
                style={{ fontSize: `${fontSize}px` }}
              >
                {balanced
                  ? titleLines.map((line, index) => <span className="title-line" key={`${line}-${index}`}>{line}</span>)
                  : (normalizeTitle(text) || "제목을 입력하세요")}
              </h2>
            </div>
          </div>

          <div className="code-strip">
            <code>
              {balanced ? "한 줄 확인 → 구두점 경계 → 구간별 폭 균형" : "text-wrap: wrap; word-break: keep-all;"}
            </code>
            <span>문자열에 줄바꿈 문자 없음</span>
          </div>
        </div>

        <aside className="controls">
          <div className="control-heading">
            <h2>설정</h2>
            <button
              className={`toggle ${balanced ? "is-on" : ""}`}
              type="button"
              role="switch"
              aria-checked={balanced}
              onClick={() => setBalanced((value) => !value)}
            >
              <span aria-hidden="true" />
              균형 적용
            </button>
          </div>

          <div className="text-control">
            <label className="field text-field">
              <span>제목 내용</span>
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                rows={3}
                spellCheck={false}
              />
            </label>

            <div className="samples" aria-label="예시 제목">
              {SAMPLE_TITLES.map((sample, index) => (
                <button key={sample} type="button" onClick={() => setText(sample)}>
                  예시 {index + 1}
                </button>
              ))}
            </div>
          </div>

          <Control
            label="글자 크기"
            value={fontSize}
            min={20}
            max={96}
            unit="px"
            onChange={setFontSize}
          />

          <Control
            label="제목 영역 폭"
            value={width}
            min={180}
            max={900}
            unit="px"
            onChange={setWidth}
          />

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
          <input
            aria-label={`${label} 숫자 입력`}
            type="number"
            value={value}
            min={min}
            max={max}
            onChange={(event) => update(event.target.value)}
          />
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
      <div className="range-ends" aria-hidden="true">
        <span>{min}</span><span>{max}</span>
      </div>
    </div>
  );
}
