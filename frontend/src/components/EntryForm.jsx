import React, { useState } from 'react';

const PRESET_EXAMPLES = [
  {
    title: 'Meeting Sync',
    snippet: `Engineering sync on Q4 priorities: We agreed to migrate existing reporting endpoints to background workers. Priya verified that query latency dropped by 38% after indexing the transactions table. Follow-up: Vikram will finalize load testing by Wednesday, and updated deployment runbooks will be shared with the operations team before Friday's maintenance window.`,
  },
  {
    title: 'Credit Risk Analysis',
    snippet: `IIFL portfolio quarterly review: Retail lending assets expanded by 14% year-over-year, spearheaded by secured gold loans and affordable housing advances. Gross NPA ratio contracted to 1.82%, reflecting improved underwriting quality. Liquidity buffers and capital adequacy ratios remain comfortable well above statutory guidelines.`,
  },
  {
    title: 'System Architecture',
    snippet: `Proposal for resilient LLM client integration: All egress HTTP calls to external AI providers must enforce a strict 20-second connection timeout, exponential backoff with jitter on 5xx responses, and schema normalization. Sensitive customer identifiers (PAN, account numbers) must be masked prior to transport to uphold financial regulatory compliance.`,
  },
];

export default function EntryForm({ onSubmit, isLoading, error, onClearError }) {
  const [text, setText] = useState('');
  const maxLimit = 10000;

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const clean = text.trim();
    if (!clean || isLoading) return;
    onSubmit(clean);
  };

  const handleReset = () => {
    setText('');
    if (onClearError) onClearError();
  };

  const applyExample = (sampleText) => {
    setText(sampleText);
    if (onClearError) onClearError();
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <h2 className="panel-title">Analyze Document or Transcript</h2>
        <p className="panel-desc">
          Paste notes, meeting transcripts, or articles. The assistant extracts a concise summary and exactly three structured tags.
        </p>
      </div>

      <div className="sample-bar">
        <span className="sample-bar-label">Examples</span>
        {PRESET_EXAMPLES.map((item, idx) => (
          <button
            key={idx}
            type="button"
            className="sample-button"
            onClick={() => applyExample(item.snippet)}
            disabled={isLoading}
          >
            {item.title}
          </button>
        ))}
      </div>

      <form onSubmit={handleFormSubmit}>
        <div className="textarea-container">
          <textarea
            className="editor-textarea"
            rows="6"
            placeholder="Type or paste your raw content here..."
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (error && onClearError) onClearError();
            }}
            disabled={isLoading}
            maxLength={maxLimit}
          />
          <div className="editor-meta">
            <span className={`char-limit ${text.length > maxLimit * 0.9 ? 'limit-warn' : ''}`}>
              {text.length.toLocaleString()} / {maxLimit.toLocaleString()} characters
            </span>
          </div>
        </div>

        {error && (
          <div className="error-banner">
            <div>
              <strong>Processing Error</strong>
              <div>{error}</div>
            </div>
          </div>
        )}

        <div className="panel-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={handleReset}
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
                <span className="loader-spinner"></span>
                <span>Generating Summary...</span>
              </>
            ) : (
              'Generate Summary & Tags'
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
