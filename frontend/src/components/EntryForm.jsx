import React, { useState } from 'react';

const SAMPLE_TEXTS = [
  {
    title: 'Meeting Notes',
    text: `Team sync on Q4 priorities: We agreed to migrate existing reporting endpoints to background workers. Priya verified that query latency dropped by 38% after indexing the transactions table. Follow-up: Vikram will finalize load testing by Wednesday, and updated deployment runbooks will be shared with the operations team before Friday's maintenance window.`,
  },
  {
    title: 'Financial Memo',
    text: `IIFL portfolio quarterly review: Retail lending assets expanded by 14% year-over-year, spearheaded by secured gold loans and affordable housing advances. Gross NPA ratio contracted to 1.82%, reflecting improved underwriting quality. Liquidity buffers and capital adequacy ratios remain comfortable well above statutory guidelines.`,
  },
  {
    title: 'Architecture Spec',
    text: `Proposal for resilient LLM client integration: All egress HTTP calls to external AI providers must enforce a strict 20-second connection timeout, exponential backoff with jitter on 5xx responses, and schema normalization. Sensitive customer identifiers (PAN, account numbers) must be masked prior to transport to uphold financial regulatory compliance.`,
  },
];

export default function EntryForm({ onSubmit, isLoading, error, onClearError }) {
  const [text, setText] = useState('');
  const maxLength = 10000;

  const handleSubmit = (e) => {
    e.preventDefault();
    const clean = text.trim();
    if (!clean || isLoading) return;
    onSubmit(clean);
  };

  const handleClear = () => {
    setText('');
    if (onClearError) onClearError();
  };

  const applySample = (sampleContent) => {
    setText(sampleContent);
    if (onClearError) onClearError();
  };

  return (
    <section className="content-card">
      <h2 className="card-title">Submit Text for Summary</h2>
      <p className="card-subtitle">
        Paste a note, article draft, or meeting transcript. The model will extract a concise summary and 3 tags.
      </p>

      <div className="sample-bar">
        <span className="sample-bar-heading">Try a sample:</span>
        {SAMPLE_TEXTS.map((sample, idx) => (
          <button
            key={idx}
            type="button"
            className="sample-pill"
            onClick={() => applySample(sample.text)}
            disabled={isLoading}
          >
            {sample.title}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="textarea-group">
          <textarea
            className="main-textarea"
            rows="6"
            placeholder="Type or paste your text here (e.g., notes, article draft, customer feedback)..."
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (error && onClearError) onClearError();
            }}
            disabled={isLoading}
            maxLength={maxLength}
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
          <div className="textarea-footer">
            <span className={`character-count ${text.length > maxLength * 0.9 ? 'warning' : ''}`}>
              {text.length.toLocaleString()} / {maxLength.toLocaleString()} characters
            </span>
          </div>
        </div>

        {error && (
          <div className="error-banner">
            <div>
              <strong>Generation Failed</strong>
              <div>{error}</div>
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
              <>
                <span className="spinner"></span>
                <span>Generating...</span>
              </>
            ) : (
              'Analyze & Save Entry'
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
