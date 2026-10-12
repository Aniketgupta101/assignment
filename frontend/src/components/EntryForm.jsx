import React, { useState } from 'react';

const SAMPLE_TEXTS = [
  {
    label: 'Meeting Transcript',
    text: `Team sync on Q4 roadmap: We discussed migrating our legacy microservices to a unified API gateway. Priya highlighted that latency improved by 40% in initial benchmarks. Next steps: Rahul will complete the load testing by Thursday, and documentation will be shared with the DevOps team before Friday release.`,
  },
  {
    label: 'Financial Memo',
    text: `IIFL Finance portfolio risk evaluation: Retail lending saw steady credit growth of 14% year-over-year, driven by secured gold loans and affordable housing segments. Non-performing assets (NPA) remained controlled at 1.8%. Liquidity reserves remain robust heading into the next fiscal quarter.`,
  },
  {
    label: 'Engineering Architecture',
    text: `Proposal for resilient AI service integration: All outgoing calls to external LLM providers must enforce a strict 15-second client timeout with exponential backoff on 5xx errors. Sensitive customer identifiers must be redacted prior to prompt serialization to comply with internal privacy standards.`,
  },
];

export default function EntryForm({ onSubmit, isLoading, error, onClearError }) {
  const [text, setText] = useState('');
  const maxLength = 10000;

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    onSubmit(trimmed);
  };

  const handleClear = () => {
    setText('');
    if (onClearError) onClearError();
  };

  const loadSample = (sampleText) => {
    setText(sampleText);
    if (onClearError) onClearError();
  };

  return (
    <section className="card form-card">
      <div className="card-header">
        <h2>Submit Content for AI Analysis</h2>
        <p className="subtitle">
          Paste any meeting transcript, article draft, or note. The AI will generate a concise summary and 3 relevant tags.
        </p>
      </div>

      <div className="sample-chips">
        <span className="sample-label">Try a sample:</span>
        {SAMPLE_TEXTS.map((sample, idx) => (
          <button
            key={idx}
            type="button"
            className="chip-btn"
            onClick={() => loadSample(sample.text)}
            disabled={isLoading}
          >
            {sample.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="textarea-wrapper">
          <textarea
            className="content-textarea"
            rows="6"
            placeholder="Type or paste your text here (e.g., notes, article draft, customer feedback)..."
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (error && onClearError) onClearError();
            }}
            disabled={isLoading}
            maxLength={maxLength}
          />
          <div className="textarea-footer">
            <span className={`char-counter ${text.length > maxLength * 0.9 ? 'warning' : ''}`}>
              {text.length.toLocaleString()} / {maxLength.toLocaleString()} characters
            </span>
          </div>
        </div>

        {error && (
          <div className="error-alert">
            <div className="error-icon">⚠️</div>
            <div className="error-content">
              <strong>Processing Failed</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleClear}
            disabled={isLoading || !text}
          >
            Clear
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading || !text.trim()}
          >
            {isLoading ? (
              <span className="spinner-wrapper">
                <span className="spinner"></span>
                <span>Generating Summary...</span>
              </span>
            ) : (
              'Analyze & Save Entry'
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
