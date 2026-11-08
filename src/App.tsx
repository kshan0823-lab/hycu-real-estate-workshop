import { useEffect, useMemo, useState } from "react";
import { CopyButton } from "./components/CopyButton";
import { HelpModal } from "./components/HelpModal";
import { optionalLessons, requiredLessons, schedule } from "./data/lessons";

const PROGRESS_KEY = "hycu-vibecoding-progress-v1";
const defaultTopic = "부동산 현장 메모";

const guideSteps = [
  { label: "START", down: "준비물을 확인하고 시작해요.", up: "처음으로 돌아가 준비를 다시 볼까요?" },
  { label: "FIELD", down: "현장기록 앱 실습으로 이동해요.", up: "현장 기록 실습을 다시 확인해요." },
  { label: "ANALYSIS", down: "시장조사와 권리분석을 정리해요.", up: "분석 기준을 다시 살펴봐요." },
  { label: "MARKETING", down: "부동산 마케팅 문장을 만들어 봐요.", up: "광고 표현과 사용 권한을 다시 확인해요." },
  { label: "REDEVELOPMENT", down: "정비사업 설명 실습을 만나 보세요.", up: "재개발·재건축 설명을 다시 볼까요?" },
  { label: "INVESTMENT", down: "투자·경매 실습으로 이어져요.", up: "권리분석과 투자 주의를 다시 확인해요." },
  { label: "DONE", down: "마무리에서 오늘의 결과를 남겨요.", up: "마무리 내용을 다시 확인해요." },
];

function readProgress(): Record<string, boolean> {
  try {
    const saved = JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? "{}");
    return typeof saved === "object" && saved !== null ? saved : {};
  } catch {
    return {};
  }
}

function MiniTimer() {
  const [seconds, setSeconds] = useState(300);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running || seconds <= 0) return;
    const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [running, seconds]);
  useEffect(() => { if (seconds === 0) setRunning(false); }, [seconds]);
  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const remainder = String(seconds % 60).padStart(2, "0");
  return (
    <div className="timer-demo" aria-label="5분 타이머 미리보기">
      <div className="timer-demo-head"><span>바로 눌러 보기</span><span className="timer-live">{running ? "실행 중" : seconds === 0 ? "완료" : "대기 중"}</span></div>
      <div className="timer-display" aria-live="polite">{minutes}:{remainder}</div>
      <div className="timer-actions">
        <button type="button" className="button button-dark small-button" onClick={() => setRunning((value) => !value)} disabled={seconds === 0}>{running ? "멈춤" : "시작"}</button>
        <button type="button" className="button button-light small-button" onClick={() => { setRunning(false); setSeconds(300); }}>다시 시작</button>
      </div>
    </div>
  );
}

function ScrollGuide({ direction, step, pulse }: { direction: "up" | "down"; step: number; pulse: number }) {
  const guide = guideSteps[step];
  return (
    <aside className={`scroll-guide is-${direction}`} aria-label="페이지 이동 캐릭터 안내">
      <div className="scroll-guide-bubble" key={`bubble-${pulse}`}>
        <span>{guide.label} · SCROLL GUIDE</span>
        <strong>{direction === "up" ? guide.up : guide.down}</strong>
        <small>{direction === "up" ? "↑ 위로 이동 중" : "↓ 아래로 이동 중"}</small>
      </div>
      <img key={`avatar-${pulse}`} className="scroll-guide-avatar" src="./assets/hansooni.jpg" alt="한순이 안내 캐릭터" />
    </aside>
  );
}

function App() {
  const [completed, setCompleted] = useState<Record<string, boolean>>(readProgress);
  const [topic, setTopic] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);
  const [openOptional, setOpenOptional] = useState<string | null>(null);
  const [scrollGuide, setScrollGuide] = useState({ direction: "down" as "up" | "down", step: 0, pulse: 0 });
  const safeTopic = topic.trim() || defaultTopic;
  const completedCount = requiredLessons.filter((lesson) => completed[lesson.id]).length;
  const progressPercent = Math.round((completedCount / requiredLessons.length) * 100);

  useEffect(() => { localStorage.setItem(PROGRESS_KEY, JSON.stringify(completed)); }, [completed]);
  useEffect(() => {
    let previousY = window.scrollY;
    let latestY = previousY;
    let frame = 0;
    let lastPulse = 0;
    const handleScroll = () => {
      latestY = window.scrollY;
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        const currentY = latestY;
        if (currentY !== previousY) {
          const direction = currentY < previousY ? "up" : "down";
          const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
          const step = Math.min(guideSteps.length - 1, Math.floor((currentY / maxScroll) * guideSteps.length));
          const now = window.performance.now();
          if (now - lastPulse > 110) {
            setScrollGuide({ direction, step, pulse: now });
            lastPulse = now;
          }
        }
        previousY = currentY;
        frame = 0;
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);
  const appPrompt = useMemo(() => requiredLessons[1].prompt.replace("{topic}", safeTopic), [safeTopic]);
  const resetProgress = () => setCompleted({});
  const toggleCompleted = (id: string) => setCompleted((current) => ({ ...current, [id]: !current[id] }));

  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="site-logo" href="#top" aria-label="맨 위로 이동"><img src="./assets/hycu-kor-wordmark.png" alt="한양사이버대학교" /></a>
        <div className="header-context"><span>부동산학과</span><strong>AI활용한 현장적용실무특강</strong></div>
        <nav className="top-nav" aria-label="주요 메뉴"><a href="#overview">특강 안내</a><a href="#start">준비</a><a href="#schedule">일정</a><a href="#required">필수 실습</a><a href="#optional">선택 실습</a></nav>
        <div className="header-progress" aria-label={`필수 실습 ${completedCount}개 완료, 전체 6개`}><span>필수</span><strong>{String(completedCount).padStart(2, "0")}</strong><span>/ 06</span></div>
      </header>

      <main id="top">
        <section className="hero-v2 section-wrap" id="overview" aria-labelledby="hero-title">
          <div className="hero-v2-copy">
            <p className="eyebrow"><span className="eyebrow-line" />HYCU REAL ESTATE · WORKSHOP 02</p>
            <h1 id="hero-title">한 문장으로 시작하는<br /><em>나의 AI 도구</em></h1>
            <p className="hero-lead">부동산 중개·마케팅·시장조사·금융·도시정비·개발·투자·법률·경매·권리분석 업무를 작은 AI 도구로 바꿉니다. 길게 설명하지 않고, 한 문장으로 요청하고, 눈으로 확인하고, 한 가지씩 고쳐 봅니다.</p>
            <div className="hero-actions"><a className="button button-blue" href="#start">오늘의 준비 보기 <span aria-hidden="true">↓</span></a><a className="button button-outline" href="#required">필수 실습 시작 <span aria-hidden="true">→</span></a></div>
            <div className="hero-meta"><span>160분</span><span>필수 6단계</span><span>10분 쉬는 시간</span><span>진행상태 자동 저장</span></div>
          </div>
          <div className="hero-v2-visual">
            <div className="hero-photo-frame"><img src="./assets/hycu-campus-grid.png" alt="HYCU 교육 공간과 캠퍼스 사진 모음" /></div>
            <div className="hero-caption"><span>LEARN BY DOING</span><strong>오늘 한 가지를<br />내 것으로</strong><small>부동산학과 · 2026</small></div>
            <img className="hero-mascot" src="./assets/handori.jpg" alt="한돌이 캐릭터" />
            <div className="hero-number"><strong>01</strong><span>한 문장<br />한 결과</span></div>
          </div>
        </section>

        <section className="quick-facts section-wrap" aria-label="특강 핵심 정보">
          <div><span>01</span><strong>현장 기록</strong><p>상담·답사 내용을<br />빠르게 남깁니다.</p></div>
          <div><span>02</span><strong>시장 읽기</strong><p>가격·수요·정책 자료를<br />한 화면에 모읍니다.</p></div>
          <div><span>03</span><strong>판단 점검</strong><p>법률·권리·금융 포인트를<br />체크리스트로 확인합니다.</p></div>
          <div className="quick-question"><span>오늘의 질문</span><strong>“오늘 만난 매물 하나를<br />더 정확하게 판단한다면?”</strong></div>
        </section>

        <section className="comparison section-wrap" aria-labelledby="comparison-title">
          <div className="section-heading"><div><p className="section-kicker">FROM LAST TIME TO TODAY</p><h2 id="comparison-title">지난 시간과<br /><em>이렇게 다릅니다.</em></h2></div><p>지난 시간에 배운 폴더 정리·스킬·홈페이지 경험을 오늘은 부동산 자료를 내 업무에 쓰는 한 문장으로 이어 갑니다.</p></div>
          <div className="comparison-grid"><article className="comparison-card before"><span className="card-index">지난 시간</span><h3>자료는 많은데 판단이 막막해요.</h3><p>매물·시세·권리·법률·금융 자료를 모두 따로 찾아야 시작할 수 있다고 생각했습니다.</p><div className="quote-line">“이 매물의 입지와 권리관계를 모두 조사해 줘…”</div></article><article className="comparison-card after"><span className="card-index">오늘</span><h3>질문 하나로 조사 흐름을 만듭니다.</h3><p>필요한 결과를 한 문장으로 말하고, 근거·확인 필요 항목·다음 행동을 구분합니다.</p><div className="quote-line">“이 매물의 리스크와 다음 확인 사항을 정리해 줘.”</div></article></div>
        </section>

        <section className="continuation section-wrap" aria-labelledby="continuation-title">
          <div className="continuation-card"><div className="section-kicker">KEEP GOING</div><h2 id="continuation-title">지난 시간에 이어서</h2><p>폴더 정리·작업 규칙·스킬 활용을 매물 자료·현장 사진·시장 리포트·정비사업 자료에 연결합니다. 모두 끝내지 못했어도 오늘 실습은 그대로 시작할 수 있습니다.</p><div className="continuation-tags"><span>매물 자료</span><span>시장 데이터</span><span>권리 확인</span><span>보고서 결과물</span></div></div>
          <div className="continuation-card today"><div className="section-kicker">TODAY</div><h2>오늘 할 것</h2><p>타이머, 업무 앱, 대화 대시보드로 시작해 중개 기록·마케팅 글·시장조사·정비사업 설명·투자·경매 자료까지 진행합니다. 전체 160분, 쉬는 시간 10분입니다.</p><div className="today-route"><span>01</span><b>현장 입력</b><i>→</i><span>02</span><b>분야별 분석</b><i>→</i><span>03</span><b>결과 검수</b></div></div>
        </section>

        <section className="progress-panel section-wrap" aria-labelledby="progress-title">
          <div className="progress-mascot"><img src="./assets/hansooni.jpg" alt="한순이 캐릭터" /></div><div className="progress-panel-main"><div className="progress-topline"><div><p className="section-kicker">YOUR WORKSHOP MAP</p><h2 id="progress-title">오늘의 진행표</h2></div><div className="progress-score"><strong>{completedCount}</strong><span>/ 6<br />필수 완료</span></div></div><div className="progress-bar" aria-label={`필수 실습 진행률 ${progressPercent}%`}><span style={{ width: `${progressPercent}%` }} /></div><div className="progress-foot"><span>체크한 내용은 이 브라우저에만 남습니다.</span><button type="button" className="text-button" onClick={resetProgress}>진행상태 초기화</button></div></div>
        </section>

        <section className="content-section section-wrap" id="start" aria-labelledby="start-title">
          <div className="section-heading"><div><p className="section-kicker">STEP 00 · GET READY</p><h2 id="start-title">시작 전, 세 가지만<br /><em>준비</em>합니다.</h2></div><p>처음부터 완벽하게 준비할 필요는 없습니다. 가상의 매물 1건이나 관심 지역 1곳을 정하고, 자료 출처와 개인정보를 확인한 뒤 아래 문장을 한 번 보내면 됩니다.</p></div>
          <div className="prep-grid"><div className="prep-list"><div className="prep-item"><span>01</span><div><h3>분석 폴더 열기</h3><p>가상의 매물 1건 또는 관심 지역 1곳을 기준으로 자료 폴더를 준비합니다. 매물·답사·시장조사 자료를 한곳에 모아 보세요.</p></div></div><div className="prep-item"><span>02</span><div><h3>분야별 자료 묶기</h3><p>중개 상담 메모, 입지·시세 자료, 금융 조건, 개발·정비사업 자료, 법률·권리 확인 자료를 구분합니다.</p></div></div><div className="prep-item"><span>03</span><div><h3>출처와 개인정보 확인하기</h3><p>등기·계약·시세·정비계획은 공식 확인이 필요한 자료로 표시하고, 고객 이름·연락처는 예시 정보로 바꿉니다.</p></div></div></div><div className="prep-command"><div><span className="card-label">처음 보내는 한 문장</span><p>“이 폴더의 부동산 자료를 종류별로 분류하고, 확인이 필요한 정보와 출처를 알려 줘.”</p></div><CopyButton text="이 폴더의 부동산 자료를 종류별로 분류하고, 확인이 필요한 정보와 출처를 알려 줘." label="문장 복사" /></div></div>
          <div className="setup-notes"><details><summary><span>부동산 스킬 추가하기</span><span>+</span></summary><div className="details-body"><p>부동산 시장조사, 지역 비교, 매물 마케팅, 권리분석처럼 오늘 쓸 수 있는 스킬이 있다면 먼저 목록과 적용 범위를 확인합니다.</p><CopyButton text="이 폴더의 부동산 시장조사·매물 마케팅·권리분석에 도움이 되는 스킬이 있는지 확인해 줘. 이미 설치된 스킬은 덮어쓰지 마." label="확인 문장 복사" /></div></details><details><summary><span>현장답사 영상 준비하기</span><span>+</span></summary><div className="details-body"><p>투자·경매·개발부지 영상 실습에서만 필요합니다. 설치 여부를 먼저 확인하고 실제 설치와 권한 허용은 화면을 읽은 뒤 직접 결정하세요.</p><CopyButton text="이 컴퓨터에 영상 편집 도구가 준비되어 있는지 확인하고, 현장답사 영상 편집을 시작할 수 있는지 알려 줘." label="확인 문장 복사" /><a href="https://ffmpeg.org/download.html" target="_blank" rel="noreferrer">공식 안내 열기 ↗</a></div></details><details><summary><span>다음에도 부동산 자료처럼 쓰기</span><span>+</span></summary><div className="details-body"><p>다른 매물이나 지역을 살펴볼 때도 출처·확인 필요 항목·다음 행동을 먼저 보여 주도록 설정할 수 있습니다.</p><CopyButton text="앞으로 부동산 자료를 정리할 때는 근거와 출처, 확인이 필요한 내용, 다음 행동을 먼저 보여 주도록 설정해 줘." label="설정 문장 복사" /></div></details></div>
        </section>

        <section className="schedule-section content-section section-wrap" id="schedule" aria-labelledby="schedule-title">
          <div className="section-heading compact"><div><p className="section-kicker">160 MINUTES · BREAK INCLUDED</p><h2 id="schedule-title">오늘은 이렇게<br /><em>흐릅니다.</em></h2></div><p>빠르게 끝난 분은 선택 실습으로 이동하고, 다음 설명이 시작되면 함께 돌아옵니다. 중개·시장조사·마케팅·정비·투자·경매 중 하나의 결과물이라도 내 방식으로 바꾸는 것이 목표입니다.</p></div>
          <div className="schedule-table" role="table" aria-label="특강 일정">{schedule.map(([time, content, tag]) => <div className="schedule-row" role="row" key={time}><span role="cell" className="schedule-time">{time}</span><strong role="cell">{content}</strong><span role="cell" className={tag === "쉬는 시간" ? "schedule-tag rest" : "schedule-tag"}>{tag}</span></div>)}</div>
        </section>

        <section className="required-section content-section section-wrap" id="required" aria-labelledby="required-title">
          <div className="required-heading"><div><p className="section-kicker">CORE WORKSHOPS · REQUIRED 01—06</p><h2 id="required-title">필수 실습은<br /><em>여섯 장면</em>입니다.</h2></div><div className="required-intro"><p>공개 강의에서 이어진 학습 순서를 그대로 살렸습니다. 중개 타이머 → 현장기록 앱 → 시장조사·권리분석 대시보드 → 마케팅 글과 문서 → 정비사업 설명 → 투자·경매 영상 순서로 진행합니다.</p><a href="#finish" className="quiet-link">마무리로 이동 ↘</a></div></div>
          <div className="lesson-stack">{requiredLessons.map((lesson, index) => { const isDone = Boolean(completed[lesson.id]); const mainPrompt = index === 1 ? appPrompt : lesson.prompt; return <article className={`lesson-card ${isDone ? "is-done" : ""}`} id={lesson.id} key={lesson.id}><div className="lesson-rail"><span className="lesson-number">{lesson.number}</span><span className="lesson-word">실습</span><span className="lesson-line" /></div><div className="lesson-main"><div className="lesson-topline"><span>{lesson.kicker}</span><span>{lesson.duration}</span></div><h3>{lesson.title}</h3><p className="lesson-summary">{lesson.summary}</p>{index === 0 && <MiniTimer />}{index === 1 && <div className="topic-picker"><label htmlFor="app-topic">부동산 업무 주제를 고르거나 직접 적어 보세요</label><div className="topic-chips">{["매물 상담 기록", "상권·입지 조사", "임대수익 계산", "정비사업 주민 안내", "경매 권리 체크"].map((item) => <button type="button" className={topic === item ? "active" : ""} key={item} onClick={() => setTopic(item)}>{item}</button>)}</div><input id="app-topic" value={topic} onChange={(event) => setTopic(event.target.value.slice(0, 50))} placeholder="예: 신축 아파트 매물 상담 기록" maxLength={50} /><span className="input-hint">현재 선택: {safeTopic}</span></div>}{index === 4 && <div className="stage-strip"><div><span>01</span><strong>사업 설명 만들기</strong><small>공식 자료와 확인 내용을 구분하기</small></div><div><span>02</span><strong>내가 검수하기</strong><small>분담금·일정은 단정하지 않기</small></div><div><span>03</span><strong>가로형 영상</strong><small>16:9 · 1920×1080 · MP4</small></div></div>}{index === 5 && <div className="source-reminder"><span>LOCAL SOURCE</span><strong>현장 영상 폴더가 필요합니다.</strong><p>원본은 건드리지 않고, 투자·경매 확인 항목을 담은 편집 결과를 별도 파일로 만들고 재생까지 확인합니다.</p></div>}<div className="prompt-box"><div className="prompt-label">{index === 1 ? "주제가 반영된 요청문" : "이 문장을 복사하세요"}</div><p>{mainPrompt}</p><CopyButton text={mainPrompt} label="문장 복사" /></div><div className="lesson-columns"><div><h4>이렇게 되면 성공</h4><ul>{lesson.success.map((item) => <li key={item}>{item}</li>)}</ul></div><div><h4>한 마디 더 해 보기</h4><div className="tweak-list">{lesson.tweaks.map((item) => <CopyButton key={item} text={item} label={item} className="tweak-button" />)}</div></div></div>{lesson.note && <p className="lesson-note"><span aria-hidden="true">i</span>{lesson.note}</p>}<div className="lesson-footer"><label className={`done-toggle ${isDone ? "checked" : ""}`}><input type="checkbox" checked={isDone} onChange={() => toggleCompleted(lesson.id)} /><span className="custom-check" aria-hidden="true">{isDone ? "✓" : ""}</span><strong>{isDone ? "완료했어요" : "해냈어요"}</strong></label>{lesson.linkLabel && <a className="quiet-link" href="https://ffmpeg.org/download.html" target="_blank" rel="noreferrer">{lesson.linkLabel} ↗</a>}</div></div></article>; })}</div>
        </section>

        <section className="optional-section" id="optional" aria-labelledby="optional-title"><div className="section-wrap"><div className="section-heading compact"><div><p className="section-kicker">OPTIONAL ROUTES · WHEN TIME REMAINS</p><h2 id="optional-title">시간이 남으면<br /><em>이 장면도</em> 열어 보세요.</h2></div><p>필수 진행률에는 포함하지 않습니다. 중개 사진앨범, 시장조사 메모장, 투자·경매 퀴즈, 마케팅 공개 페이지, 시장 리포트 예약, 권리분석 표 시연을 선택할 수 있습니다.</p></div><div className="challenge-row"><span>먼저 끝났다면</span><strong>01 매물 설명 카드</strong><strong>02 지역 비교표</strong><strong>03 투자 수익 체크</strong><strong>04 경매 권리 퀴즈</strong></div><div className="optional-grid">{optionalLessons.map((lesson) => { const isOpen = openOptional === lesson.id; return <article className={`optional-card ${isOpen ? "open" : ""}`} key={lesson.id}><button type="button" className="optional-toggle" onClick={() => setOpenOptional(isOpen ? null : lesson.id)} aria-expanded={isOpen}><span className="optional-index">{lesson.number}</span><span><small>{lesson.label}</small><strong>{lesson.title}</strong></span><span className="optional-plus" aria-hidden="true">{isOpen ? "−" : "+"}</span></button>{isOpen && <div className="optional-body"><p>{lesson.description}</p><div className="optional-status">{lesson.status}</div><div className="prompt-box small"><p>{lesson.prompt}</p><CopyButton text={lesson.prompt} label="문장 복사" /></div></div>}</article>; })}</div></div></section>

        <section className="finish-section section-wrap" id="finish" aria-labelledby="finish-title"><div className="finish-card"><div className="finish-symbol"><img src="./assets/hycu-sub-blue.png" alt="HYCU 서브심볼" /></div><div className="finish-copy"><p className="section-kicker">RECAP & NEXT STEP</p><h2 id="finish-title">이번 주 숙제는<br /><em>하나</em>입니다.</h2><p>오늘 만든 중개 기록 앱·시장조사 대시보드·마케팅 글·투자 체크표 중 하나를 실제 학습이나 업무에 써 보세요. 무엇을 확인했고 무엇을 더 확인해야 하는지 한 줄로 적으면 충분합니다.</p><div className="finish-actions"><a className="button button-blue" href="#top">처음으로 돌아가기 ↑</a><button type="button" className="button button-light" onClick={resetProgress}>진행상태 다시 시작</button></div></div><div className="finish-score"><strong>{completedCount}<span>/6</span></strong><small>필수 실습 완료</small><div className="mini-dots">{requiredLessons.map((lesson) => <span key={lesson.id} className={completed[lesson.id] ? "done" : ""} />)}</div></div></div></section>
      </main>

      <footer className="site-footer"><div className="footer-inner"><div><img className="footer-logo" src="./assets/hycu-kor-wordmark.png" alt="한양사이버대학교" /><p>HYCU 부동산학과를 위한 독립형 교육용 페이지입니다.<br />학교 공식 홈페이지·SSO·행사 페이지를 대신하지 않습니다.</p></div><div className="footer-links"><span>참고한 공개 페이지</span><a href="https://www.hycu.ac.kr/user/index.do" target="_blank" rel="noreferrer">한양사이버대학교 홈페이지 ↗</a><a href="https://www.hycu.ac.kr/user/comm/html/www_UI_12.do" target="_blank" rel="noreferrer">대학 UI 규정 ↗</a><a href="https://vibecoding-class-2-1108.vercel.app/" target="_blank" rel="noreferrer">공개 강의 구조 참고 ↗</a></div><div className="footer-note"><img src="./assets/hansooni.jpg" alt="한순이" /><div><span>LOCAL-FIRST</span><p>입력한 앱 주제와 진행상태는<br />이 브라우저에만 저장됩니다.</p></div></div></div><div className="footer-bottom"><span>© 2026 HYCU 부동산학과 AI활용한 현장적용실무특강</span><span>made for learning · no official endorsement</span></div></footer>
      <ScrollGuide direction={scrollGuide.direction} step={scrollGuide.step} pulse={scrollGuide.pulse} />
      <button type="button" className="help-fab" onClick={() => setHelpOpen(true)} aria-label="막힌 곳 도움말 열기"><span aria-hidden="true">?</span><strong>막혔어요</strong></button>
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}

export default App;
