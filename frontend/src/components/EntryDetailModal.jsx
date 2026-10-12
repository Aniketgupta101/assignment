import React, { useEffect } from 'react';

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return dateStr;
  }
}

export default function EntryDetailModal({ entry, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!entry) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>Entry Details #{entry.id}</h3>
            <span className="modal-subtitle">Created on {formatDate(entry.created_at)}</span>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        </div>

        <div className="modal-body">
          <div className="detail-group">
            <label className="detail-label">AI Generated Tags</label>
            <div className="entry-tags">
              {entry.tags.map((tag, idx) => (
                <span key={idx} className="tag-pill tag-pill-accent">
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          <div className="detail-group">
            <label className="detail-label">AI Summary</label>
            <div className="summary-box">
              <p>{entry.summary}</p>
            </div>
          </div>

          <div className="detail-group">
            <label className="detail-label">Original Submitted Text</label>
            <div className="original-text-box">
              <pre>{entry.original_text}</pre>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
