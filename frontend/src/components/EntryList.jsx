import React, { useState } from 'react';

function formatTimestamp(raw) {
  if (!raw) return '';
  try {
    const d = new Date(raw);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return raw;
  }
}

export default function EntryList({ entries, onSelectEntry }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTagFilter, setActiveTagFilter] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const handleCopySummary = (e, entry) => {
    e.stopPropagation();
    navigator.clipboard.writeText(entry.summary);
    setCopiedId(entry.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTagClick = (e, tag) => {
    e.stopPropagation();
    if (activeTagFilter === tag) {
      setActiveTagFilter(null);
    } else {
      setActiveTagFilter(tag);
    }
  };

  // Filter entries based on search and active tag
  const filteredEntries = entries.filter((item) => {
    const matchesTag = activeTagFilter ? item.tags.includes(activeTagFilter) : true;
    const query = searchQuery.trim().toLowerCase();
    if (!query) return matchesTag;

    const matchesQuery =
      item.summary.toLowerCase().includes(query) ||
      item.original_text.toLowerCase().includes(query) ||
      item.tags.some((t) => t.toLowerCase().includes(query));

    return matchesTag && matchesQuery;
  });

  return (
    <section>
      <div className="feed-header">
        <div className="feed-header-left">
          <h2 className="feed-title">Saved Entries</h2>
          <span className="feed-count">{filteredEntries.length} of {entries.length}</span>
        </div>

        <div className="filter-search-box">
          {activeTagFilter && (
            <div className="active-filter-pill">
              <span>#{activeTagFilter}</span>
              <button
                className="filter-clear-btn"
                onClick={() => setActiveTagFilter(null)}
                title="Clear tag filter"
              >
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
        <div className="empty-placeholder">
          <div className="empty-icon">📄</div>
          <h3>No records saved yet</h3>
          <p>Submit text using the editor above to generate and persist your first summary.</p>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="empty-placeholder">
          <h3>No matching entries found</h3>
          <p>Try adjusting your search query or clear the active tag filter.</p>
        </div>
      ) : (
        <div className="feed-grid">
          {filteredEntries.map((entry) => (
            <article
              key={entry.id}
              className="feed-card"
              onClick={() => onSelectEntry(entry)}
            >
              <div className="card-top">
                <div className="card-identifier">
                  <span className="id-badge">#{entry.id}</span>
                  <span className="card-time">{formatTimestamp(entry.created_at)}</span>
                </div>
              </div>

              <div className="card-summary">
                <p>{entry.summary}</p>
              </div>

              <div className="card-tags">
                {entry.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className={`tag-badge ${activeTagFilter === tag ? 'active' : ''}`}
                    onClick={(e) => handleTagClick(e, tag)}
                    title={`Filter by #${tag}`}
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="card-bottom">
                <button
                  type="button"
                  className="copy-btn"
                  onClick={(e) => handleCopySummary(e, entry)}
                >
                  {copiedId === entry.id ? '✓ Copied' : '📋 Copy summary'}
                </button>
                <span className="view-action">
                  Inspect &rarr;
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
