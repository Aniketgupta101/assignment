import React from 'react';

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export default function EntryList({ entries, onSelectEntry }) {
  return (
    <section className="entries-section">
      <div className="section-header">
        <h2>Saved Entries</h2>
        <span className="badge-counter">{entries.length} {entries.length === 1 ? 'entry' : 'entries'}</span>
      </div>

      {entries.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h3>No entries saved yet</h3>
          <p>Submit text using the form above to generate an AI summary and tags.</p>
        </div>
      ) : (
        <div className="entry-grid">
          {entries.map((entry) => (
            <div key={entry.id} className="entry-card" onClick={() => onSelectEntry(entry)}>
              <div className="entry-card-header">
                <span className="entry-id">#{entry.id}</span>
                <span className="entry-date">{formatDate(entry.created_at)}</span>
              </div>

              <div className="entry-summary">
                <p>{entry.summary}</p>
              </div>

              <div className="entry-tags">
                {entry.tags.map((tag, idx) => (
                  <span key={idx} className="tag-pill">
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="entry-footer">
                <button
                  type="button"
                  className="btn-link"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectEntry(entry);
                  }}
                >
                  View Details &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
