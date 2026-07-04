import React from 'react';
import {
  Bot,
  Loader2,
  RotateCcw,
  Send,
} from 'lucide-react';

const examplePrompts = [
  ['AI logistics', 'I want to build an AI logistics platform for small businesses that reduces delivery costs.'],
  ['Meal planning', 'I want to create a meal planning app for university students that helps them eat on a budget.'],
  ['Cybersecurity', 'I want to start a cybersecurity consultancy service for SMEs in Malaysia.'],
  ['HR SaaS', 'I want to build a SaaS tool for HR teams that automates employee onboarding.'],
];

export default function IdeaInput({
  idea,
  setIdea,
  onGenerate,
  onClearInput,
  streamActive,
  currentChatId,
  currentPhase,
  connectionState,
  apiLabel,
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!idea.trim() || streamActive) return;
    onGenerate();
  };

  const canSubmit = Boolean(idea.trim()) && !streamActive;
  const isNewIdea = !currentChatId;

  return (
    <form className="composer-shell" onSubmit={handleSubmit}>
      {isNewIdea && (
        <section className="idea-guidance" aria-label="Startup idea examples">
          <div className="idea-examples" aria-label="Example startup idea prompts">
            {examplePrompts.map(([label, prompt]) => (
              <button
                type="button"
                className="example-chip"
                onClick={() => setIdea(prompt)}
                disabled={streamActive}
                key={prompt}
              >
                {label}
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="composer-card">
        <label className="sr-only" htmlFor="idea-input">
          {currentChatId ? 'Refine this blueprint' : 'Ask Genesis anything'}
        </label>
        <textarea
          id="idea-input"
          className="composer-textarea"
          placeholder={
            currentChatId
              ? 'Ask Genesis to revisit pricing, compliance, risk, MVP scope...'
              : 'I want to build [product/service] for [target users] that solves [problem].'
          }
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          disabled={streamActive}
          rows={1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (canSubmit) onGenerate();
            }
          }}
        />

        <div className="composer-tools" aria-label="Composer tools">
          <span className={`composer-status ${connectionState}`}>
            <Bot size={15} />
            {connectionState === 'connected'
              ? 'Genesis online'
              : connectionState === 'checking'
                ? 'Checking'
                : 'Offline'}
          </span>



          <button
            type="submit"
            className="composer-send"
            disabled={!canSubmit}
            aria-label={streamActive ? 'Genesis is thinking' : 'Send prompt'}
          >
            {streamActive ? <Loader2 size={19} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>

      <div className="composer-meta">
        <button type="button" className="reset-link" onClick={onClearInput} disabled={streamActive || !idea}>
          <RotateCcw size={14} />
          Clear input
        </button>
        <span>
          {currentPhase ? (
            <>
              Current phase: <strong>{currentPhase}</strong>
            </>
          ) : (
            <>
              API: <code>{apiLabel}</code>
            </>
          )}
        </span>
      </div>
    </form>
  );
}
