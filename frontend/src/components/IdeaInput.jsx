import React from 'react';
import {
  Bot,
  Loader2,
  RotateCcw,
  Send,
} from 'lucide-react';

const quickPrompts = [
  'pressure-test my MVP',
  'research go-to-market risks',
  'create an investor-ready plan',
];

export default function IdeaInput({
  idea,
  setIdea,
  onGenerate,
  onReset,
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

  return (
    <form className="composer-shell" onSubmit={handleSubmit}>
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
              : 'Ask Genesis to build, research, or refine a startup blueprint...'
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

      {!currentChatId && (
        <div className="composer-suggestions" aria-label="Try prompts">
          {quickPrompts.map((prompt) => (
            <button
              type="button"
              className="quick-chip"
              onClick={() => setIdea(prompt)}
              disabled={streamActive}
              key={prompt}
            >
              Try: {prompt}
            </button>
          ))}
        </div>
      )}

      <div className="composer-meta">
        <button type="button" className="reset-link" onClick={onReset} disabled={streamActive}>
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
