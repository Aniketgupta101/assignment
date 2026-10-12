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
  const [isOnline, setIsOnline] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadSavedEntries();
    verifyHealth();
  }, []);

  const verifyHealth = async () => {
    const res = await checkBackendHealth();
    setIsOnline(res.healthy);
  };

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
          <h1 className="brand-title">AI Content Assistant</h1>
          <p className="brand-description">Turn long text, meeting notes, or memos into concise summaries and tags</p>
        </div>

        <div className="system-status">
          <span className={`status-indicator-dot ${isOnline ? '' : 'offline'}`}></span>
          <span>{isOnline ? 'Online' : 'Offline'}</span>
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
