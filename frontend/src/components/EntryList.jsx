import React, { useState } from 'react';

function formatDate(rawDate) {
  if (!rawDate) return '';
  try {
    const d = new Date(rawDate);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return rawDate;
  }
}

export default function EntryList({ entries, onSelectEntry }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (e, item) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.summary);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTagFilter = (e, tag) => {
    e.stopPropagation();
    setActiveTag(activeTag === tag ? null : tag);
  };

  const filtered = entries.filter((entry) => {
    const matchTag = activeTag ? entry.tags.includes(activeTag) : true;
    const query = searchQuery.trim().toLowerCase();
    if (!query) return matchTag;

    const matchQuery =
      entry.summary.toLowerCase().includes(query) ||
      entry.original_text.toLowerCase().includes(query) ||
      entry.tags.some((t) => t.toLowerCase().includes(query));

    return matchTag && matchQuery;
  });

  return (
    <section>
      <div className="entries-header">
        <div className="entries-header-title">
          <h2 className="entries-title">Saved Entries</h2>
          <span className="entries-badge">
            {filtered.length} of {entries.length}
          </span>
        </div>

        <div className="search-box-wrapper">
          {activeTag && (
            <div className="filter-tag-pill">
              <span>#{activeTag}</span>
              <button onClick={() => setActiveTag(null)} title="Clear filter">
                &times;
              </button>
            </div>
          )}

          <input
            type="text"
            className="search-input"
            placeholder="Search entries or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="empty-box">
          <div className="empty-box-icon">📝</div>
          <h3>No entries saved yet</h3>
          <p>Submit text using the form above to generate your first AI summary.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-box">
          <h3>No matching results</h3>
          <p>Try searching with another keyword or clear your active tag filter.</p>
        </div>
      ) : (
        <div className="entry-cards-list">
          {filtered.map((item) => (
            <article
              key={item.id}
              className="entry-item-card"
              onClick={() => onSelectEntry(item)}
            >
              <div className="entry-card-meta">
                <span className="entry-id-tag">#{item.id}</span>
                <span className="entry-date-text">{formatDate(item.created_at)}</span>
              </div>

              <div className="entry-summary-text">
                <p>{item.summary}</p>
              </div>

              <div className="entry-tags-row">
                {item.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className={`tag-chip ${activeTag === tag ? 'active' : ''}`}
                    onClick={(e) => handleTagFilter(e, tag)}
                    title={`Filter by #${tag}`}
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="entry-card-footer">
                <button
                  type="button"
                  className="btn-inline-action"
                  onClick={(e) => handleCopy(e, item)}
                >
                  {copiedId === item.id ? '✓ Copied' : '📋 Copy summary'}
                </button>
                <span className="inspect-link">
                  View details &rarr;
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
