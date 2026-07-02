import React, { useEffect, useRef } from 'react';
import { ArrowRight, Check, Network, Radio, Server, Sparkles, UsersRound } from 'lucide-react';
import { SiFastapi, SiOpenai, SiPydantic, SiPython, SiReact, SiSqlalchemy, SiSqlite, SiVite } from 'react-icons/si';
import LogoLoop from '../components/reactbits/LogoLoop';

const agents = [
  ['Research Agent', 'Market demand is visible, but the target segment is too broad.'],
  ['Product Agent', 'The first version should solve one painful workflow only.'],
  ['Finance Agent', 'The model works only if acquisition cost stays low.'],
  ['MVP Guard Agent', 'Reject extra features. Keep the pilot narrow.'],
  ['Consensus', 'Launch the narrow MVP, measure paid conversion, expand after proof.'],
];

const evidenceCards = [
  ['ROOT COORDINATOR', 'One idea becomes a structured agent workflow.', 'The coordinator breaks the raw startup idea into research, product, technical, financial, UX, marketing, risk, and scope tasks.', '10', 'specialized agents'],
  ['RESEARCH AGENT', 'Signals before opinions.', 'Pulls market, competitor, and customer assumptions before the debate begins.'],
  ['DEBATE ENGINE', 'Specialists challenge each other.', 'Product, finance, technical, and risk agents expose tradeoffs instead of agreeing too early.'],
  ['MVP SCOPE GUARD', 'Prevents the idea from becoming a full system.', 'Cuts non-essential features and protects the first build from scope creep.'],
  ['REPORT GENERATOR', 'Blueprint, not transcript.', 'Converts the debate into an actionable MVP plan, architecture, roadmap, risks, and pitch direction.'],
];

const processSteps = [
  ['Capture', 'Founder idea, target user, market hunch, or constraint enters the studio.'],
  ['Research', 'External signals are gathered and summarized into the working context.'],
  ['Debate', 'Specialist agents pressure-test feasibility, cost, channel, and risk.'],
  ['Resolve', 'Consensus narrows the product wedge and the launch sequence.'],
  ['Package', 'The blueprint becomes a structured founder-ready plan.'],
];

const stackItems = [
  { name: 'React', icon: SiReact },
  { name: 'Vite', icon: SiVite, tone: 'gold' },
  { name: 'FastAPI', icon: SiFastapi, tone: 'green' },
  { name: 'Python', icon: SiPython, tone: 'gold' },
  { name: 'Pydantic', icon: SiPydantic, tone: 'red' },
  { name: 'OpenAI SDK', icon: SiOpenai, tone: 'dark' },
  { name: 'OpenRouter routing', icon: Network },
  { name: 'Tavily Search API', icon: Sparkles, tone: 'green' },
  { name: 'SQLAlchemy', icon: SiSqlalchemy, tone: 'red' },
  { name: 'SQLite', icon: SiSqlite },
  { name: 'SSE streaming', icon: Radio, tone: 'green' },
  { name: 'REST API', icon: Server, tone: 'dark' },
];

const studioMessages = [
  ['user', 'Build a B2B tool that turns customer calls into product roadmap evidence.'],
  ['agent', 'Research sees a strong wedge if the first buyer is product ops, not founders.'],
  ['agent', 'Finance flags sales cycle risk. Keep the pilot inside existing Slack workflows.'],
  ['agent', 'Consensus: ship call ingestion, evidence tagging, and roadmap export first.'],
];

const deliverables = [
  ['01', 'Launch thesis', 'Market wedge, buyer profile, and the reason this idea deserves a narrow first launch.'],
  ['02', 'Business model', 'Pricing logic, acquisition channel, and early unit economics.'],
  ['03', 'MVP roadmap', 'First workflow, success metrics, and deferred scope.'],
  ['04', 'Risk register', 'Operational, technical, and go-to-market risks before build.'],
  ['05', 'Pitch inputs', 'Concise narrative points for problem, wedge, traction plan, and ask.'],
];

function GenesisLogo() {
  return (
    <a href="/" className="gcp-logo" aria-label="Genesis home">
      <span>G</span>
      <strong>Genesis</strong>
    </a>
  );
}

function AgentBoard() {
  return (
    <aside className="gcp-agent-card" aria-label="Live agent boardroom preview">
      <div className="gcp-agent-title">Live Agent Boardroom</div>
      <div className="gcp-agent-feed">
        {agents.map(([name, message]) => (
          <article className={name === 'Consensus' ? 'gcp-agent-line is-consensus' : 'gcp-agent-line'} key={name}>
            <strong>{name}</strong>
            <p>{message}</p>
          </article>
        ))}
      </div>
    </aside>
  );
}

function MacDots() {
  return (
    <div className="gcp-mac-dots" aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  );
}

function GradientText({ children, className = '' }) {
  const letters = String(children).split('');

  return (
    <span className={("gcp-gradient-text " + className).trim()}>
      <span aria-hidden="true">
        {letters.map((letter, index) => (
          <span className="gcp-brand-letter" style={{ '--i': index }} key={`${letter}-${index}`}>
            {letter}
          </span>
        ))}
      </span>
      <span className="sr-only">{children}</span>
    </span>
  );
}

function useLandingInteractions() {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const revealTargets = root.querySelectorAll('[data-reveal]');
    const stack = root.querySelector('.gcp-artifact-stack');
    const artifactCards = stack ? [...stack.querySelectorAll('.gcp-artifact-card')] : [];
    let artifactTimer = null;
    let activeArtifact = 0;
    let wheelLock = false;

    const setArtifactClasses = () => {
      if (!stack) return;
      stack.classList.add('is-interactive');
      artifactCards.forEach((card, index) => {
        const diff = (index - activeArtifact + artifactCards.length) % artifactCards.length;
        card.classList.remove('is-active', 'is-prev', 'is-next', 'is-far-prev', 'is-far-next');
        if (diff === 0) card.classList.add('is-active');
        else if (diff === 1) card.classList.add('is-next');
        else if (diff === artifactCards.length - 1) card.classList.add('is-prev');
        else if (diff === 2) card.classList.add('is-far-next');
        else card.classList.add('is-far-prev');
      });
    };

    const moveArtifact = (direction = 1) => {
      if (!artifactCards.length) return;
      activeArtifact = (activeArtifact + direction + artifactCards.length) % artifactCards.length;
      setArtifactClasses();
    };


    setArtifactClasses();

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.remove('is-visible');
          void entry.target.offsetWidth;
          entry.target.classList.add('is-visible');
        } else {
          entry.target.classList.remove('is-visible');
        }
      });
    }, { threshold: 0.24 });

    revealTargets.forEach((target) => revealObserver.observe(target));

    const syncVisibleTargets = () => {
      revealTargets.forEach((target) => {
        const rect = target.getBoundingClientRect();
        const visibleHeight = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
        if (visibleHeight > rect.height * 0.18) target.classList.add('is-visible');
      });
    };

    window.setTimeout(syncVisibleTargets, 80);


    const handleWheel = (event) => {
      event.preventDefault();
      if (wheelLock || Math.abs(event.deltaY) < 8) return;
      moveArtifact(event.deltaY > 0 ? 1 : -1);
      wheelLock = true;
      window.setTimeout(() => { wheelLock = false; }, 430);
    };

    if (stack && artifactCards.length) stack.addEventListener('wheel', handleWheel, { passive: false });
    if (stack && artifactCards.length) artifactTimer = window.setInterval(() => moveArtifact(1), 3200);

    return () => {
      revealObserver.disconnect();
      if (stack) stack.removeEventListener('wheel', handleWheel);
      if (artifactTimer) window.clearInterval(artifactTimer);
    };
  }, []);

  return rootRef;
}

function WordReveal({ words, label }) {
  return (
    <h2 className="gcp-word-reveal" aria-label={label}>
      {words.map((word, index) => (
        <span style={{ '--i': index }} key={`${word}-${index}`}>{word}</span>
      ))}
    </h2>
  );
}

function LetterRevealTitle({ children }) {
  return (
    <h2 className="gcp-letter-reveal" aria-label={children}>
      {String(children).split('').map((letter, index) => (
        <span
          className={letter === ' ' ? 'is-space' : undefined}
          style={{ '--i': index }}
          aria-hidden="true"
          key={`${letter}-${index}`}
        >
          {letter === ' ' ? '\u00a0' : letter}
        </span>
      ))}
    </h2>
  );
}

export default function LandingPage() {
  const rootRef = useLandingInteractions();

  return (
    <div ref={rootRef} className="genesis-case-page">
      <header className="gcp-nav">
        <div className="gcp-shell gcp-nav-inner">
          <GenesisLogo />
          <nav className="gcp-links" aria-label="Primary navigation">
            <a href="#evidence">Evidence</a>
            <a href="#process">Process</a>
            <a href="#stack">Stack</a>
            <a href="#studio">Studio</a>
            <a href="#deliverables">Deliverables</a>
            <a className="gcp-btn gcp-btn-primary" href="/chat">Open Studio</a>
          </nav>
        </div>
      </header>

      <main>
        <section className="gcp-shell gcp-hero is-visible" id="top" data-reveal>
          <div className="gcp-hero-copy">
            <p className="gcp-eyebrow">AI Startup Boardroom</p>
            <h1 className="gcp-hero-title">
              <GradientText className="gcp-brand-gradient">Genesis</GradientText>
              <small>turns ideas into investable plans.</small>
            </h1>
            <p className="gcp-subtitle">A live executive team researches the market, debates the tradeoffs, and assembles a founder-ready blueprint without turning the page into a dense dashboard.</p>
            <div className="gcp-proof">
              <div><strong>10</strong><span>specialist agents</span></div>
              <div><strong>6</strong><span>blueprint sections</span></div>
              <div><strong>Live</strong><span>debate stream</span></div>
            </div>
            <div className="gcp-actions">
              <a className="gcp-btn gcp-btn-primary" href="/chat">Open Genesis <ArrowRight size={16} /></a>
              <a className="gcp-btn gcp-btn-secondary" href="#process">View process</a>
            </div>
          </div>
          <AgentBoard />
        </section>

        <section className="gcp-shell gcp-section gcp-band gcp-evidence" id="evidence" data-reveal>
          <div className="gcp-section-head"><p className="gcp-eyebrow">Agent Society</p><h2>A startup boardroom powered by specialized agents.</h2><p>Genesis does not generate a generic answer. It assigns the idea to a team of agents that research, challenge, negotiate, and turn the final decision into an MVP blueprint.</p></div>
          <div className="gcp-signals">
            {evidenceCards.map(([label, title, body, metric, caption], index) => <article className={index === 0 ? 'gcp-signal is-featured' : 'gcp-signal'} key={label}><span>{label}</span><h3>{title}</h3><p>{body}</p>{index === 0 && <strong>{metric}<small>{caption}</small></strong>}</article>)}
          </div>
        </section>

        <section className="gcp-shell gcp-section gcp-band gcp-process" id="process">
          <div className="gcp-section-head" data-reveal><p className="gcp-eyebrow">Operating model</p><WordReveal words={['The', 'system', 'feels', 'more', 'like', 'a', 'boardroom', 'than', 'a', 'chatbot.']} label="The system feels more like a boardroom than a chatbot." /></div>
          <div className="gcp-process-line" aria-label="Genesis process from capture to package">
            {processSteps.map(([title, body], index) => (
              <article className="gcp-process-node" key={title}>
                <div>{index + 1}</div>
                <strong>{title}</strong>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="gcp-shell gcp-section gcp-band gcp-stack" id="stack" data-reveal>
          <div className="gcp-stack-head">
            <div>
              <p className="gcp-eyebrow">Technical stack</p>
              <LetterRevealTitle>The stack behind the boardroom.</LetterRevealTitle>
            </div>
            <p>Frontend, orchestration, model routing, persistence, research, streaming, and deployment tools share the same blueprint pipeline.</p>
          </div>
          <div className="gcp-stack-loop">
            <LogoLoop items={stackItems} speed={38} ariaLabel="Genesis technology stack" />
          </div>
        </section>

        <section className="gcp-shell gcp-section gcp-studio" id="studio" data-reveal>
          <div className="gcp-section-head"><p className="gcp-eyebrow">Studio surface</p><WordReveal words={['A', 'product', 'screen', 'with', 'breathing', 'room,', 'not', 'a', 'cockpit.']} label="A product screen with breathing room, not a cockpit." /></div>
          <div className="gcp-studio-wrap">
            <aside className="gcp-session-rail"><div className="gcp-rail-title"><span>G</span><strong>Sessions</strong></div><article><strong>New blueprint</strong><p>Fresh strategy run for one startup idea.</p></article><article><strong>Saved sessions</strong><p>Past blueprints return as working memory.</p></article><article><strong>Investor pass</strong><p>Sections can be tightened for pitch review.</p></article></aside>
            <div className="gcp-workspace"><div className="gcp-workspace-top"><div><span>Genesis boardroom</span><h3>Startup Blueprint Studio</h3></div><em>Backend connects in live app</em></div><div className="gcp-workspace-grid"><div className="gcp-conversation"><span>Debate feed</span><div className="gcp-chat-stream"><div className="gcp-typing" aria-hidden="true"><i /><i /><i /></div>{studioMessages.map(([type, text], index) => <p className={type === 'user' ? 'gcp-bubble is-user' : 'gcp-bubble'} style={{ '--i': index }} key={text}>{text}</p>)}</div></div><aside className="gcp-blueprint-panel"><span>Blueprint preview</span><h3>Generated sections</h3>{['Market wedge and buyer profile', 'MVP scope and deferred features', 'Technical architecture outline', 'Risk register and next actions'].map((item) => <p key={item}><Check size={15} />{item}</p>)}</aside></div><div className="gcp-composer"><span>Try: pressure-test my MVP and produce a launch blueprint</span><a className="gcp-btn gcp-btn-primary" href="/chat">Generate</a></div></div>
          </div>
        </section>

        <section className="gcp-shell gcp-section gcp-band gcp-deliverables" id="deliverables" data-reveal>
          <div className="gcp-deliverable-intro"><div><p className="gcp-eyebrow">Founder package</p><p>Genesis turns the discussion into a focused set of founder-ready artifacts. The center card becomes the active deliverable, while the other cards wait behind it like a polished review stack.</p></div><WordReveal words={['Everything', 'a', 'founder', 'needs', 'after', 'the', 'debate', 'ends.']} label="Everything a founder needs after the debate ends." /></div>
          <div className="gcp-artifact-stack" aria-label="Founder package carousel">{deliverables.map(([num, title, body]) => <article className="gcp-artifact-card" key={num}><MacDots /><span>{num}</span><strong>{title}</strong><p>{body}</p></article>)}</div>
        </section>

        <section className="gcp-shell gcp-section gcp-final"><Sparkles size={28} /><h2>Bring one idea. Leave with a sharper company.</h2><p>Genesis is built for founders who want pressure-tested thinking, not another blank page.</p><a className="gcp-btn gcp-btn-primary" href="/chat">Open Studio <UsersRound size={16} /></a></section>
      </main>
    </div>
  );
}
