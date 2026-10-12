import React, { useEffect, useState } from 'react';

function formatTimestamp(raw) {
  if (!raw) return '';
  try {
    const d = new Date(raw);
    return d.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return raw;
  }
}

export default function EntryDetailModal({ entry, onClose }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  if (!entry) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(entry.summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-layer" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-top">
          <div>
            <h3>Entry #{entry.id}</h3>
            <div className="modal-date">Saved on {formatTimestamp(entry.created_at)}</div>
          </div>
          <button className="modal-close-icon" onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        </div>

        <div className="modal-content-area">
          <div>
            <span className="section-label">Categorization Tags</span>
            <div className="card-tags">
              {entry.tags.map((tag, idx) => (
                <span key={idx} className="tag-badge active">
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          <div>
            <span className="section-label">Generated Summary</span>
            <div className="summary-callout">
              <p>{entry.summary}</p>
            </div>
          </div>

          <div>
            <span className="section-label">Original Source Text</span>
            <div className="transcript-viewport">
              <pre>{entry.original_text}</pre>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={handleCopy}>
            {copied ? '✓ Summary Copied' : '📋 Copy Summary'}
          </button>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
