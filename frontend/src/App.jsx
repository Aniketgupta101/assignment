import React, { useState, useEffect } from 'react';
import { fetchEntries, createEntry, checkBackendHealth } from './api';
import EntryForm from './components/EntryForm';
import EntryList from './components/EntryList';
import EntryDetailModal from './components/EntryDetailModal';

export default function App() {
  const [entries, setEntries] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadSavedEntries();
  }, []);

  const loadSavedEntries = async () => {
    try {
      const data = await fetchEntries();
      setEntries(data);
    } catch (err) {
      console.error('Failed to load entries:', err);
    }
  };

  const handleEntrySubmit = async (text) => {
    setIsLoading(true);
    setError(null);
    try {
      const newEntry = await createEntry(text);
      setEntries((prev) => [newEntry, ...prev]);
      setToast('Summary successfully generated and saved.');
      setTimeout(() => setToast(null), 4000);
    } catch (err) {
      setError(err.message || 'Failed to process text with AI provider.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="brand-section">
          <div className="brand-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
          </div>
          <div>
            <h1 className="brand-title">AI Content Assistant</h1>
            <p className="brand-description">Turn long text, meeting notes, or memos into concise summaries and tags</p>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main>
        {toast && (
          <div className="notification-banner">
            <span>✓</span>
            <span>{toast}</span>
          </div>
        )}

        <EntryForm
          onSubmit={handleEntrySubmit}
          isLoading={isLoading}
          error={error}
          onClearError={() => setError(null)}
        />

        <EntryList
          entries={entries}
          onSelectEntry={(entry) => setSelectedEntry(entry)}
        />
      </main>

      {/* Detail Modal */}
      {selectedEntry && (
        <EntryDetailModal
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
        />
      )}

      {/* Footer */}
      <footer className="app-footer">
        <p>AI Content Assistant &bull; Built with FastAPI, SQLite & React</p>
      </footer>
    </div>
  );
}
