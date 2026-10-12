import React, { useEffect, useState } from 'react';

function formatDate(raw) {
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
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!entry) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(entry.summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-bar">
          <div>
            <h3>Entry #{entry.id}</h3>
            <div className="modal-header-date">Saved on {formatDate(entry.created_at)}</div>
          </div>
          <button className="modal-close-button" onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        </div>

        <div className="modal-scroll-area">
          <div>
            <span className="detail-label-heading">Tags</span>
            <div className="entry-tags-row">
              {entry.tags.map((tag, idx) => (
                <span key={idx} className="tag-chip active">
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          <div>
            <span className="detail-label-heading">AI Generated Summary</span>
            <div className="modal-summary-box">
              <p>{entry.summary}</p>
            </div>
          </div>

          <div>
            <span className="detail-label-heading">Original Submitted Text</span>
            <div className="modal-source-text">
              <pre>{entry.original_text}</pre>
            </div>
          </div>
        </div>

        <div className="modal-footer-bar">
          <button type="button" className="btn btn-secondary" onClick={handleCopy}>
            {copied ? '✓ Copied' : '📋 Copy Summary'}
          </button>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
