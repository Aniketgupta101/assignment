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
  const [backendHealth, setBackendHealth] = useState({ online: false, provider: 'checking...' });
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadSavedEntries();
    verifyHealth();
  }, []);

  const verifyHealth = async () => {
    const res = await checkBackendHealth();
    if (res.healthy) {
      setBackendHealth({ online: true, provider: res.configured_provider || 'active' });
    } else {
      setBackendHealth({ online: false, provider: 'offline' });
    }
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
      setToast('Summary successfully generated and saved to database.');
      setTimeout(() => setToast(null), 4000);
    } catch (err) {
      setError(err.message || 'Failed to process text with AI provider.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-wrapper">
      {/* Top Header */}
      <header className="app-header">
        <div className="header-left">
          <div className="app-badge-icon">AI</div>
          <div>
            <h1 className="app-title">Content Assistant</h1>
            <p className="app-subtitle">Automated Summarization & Semantic Tagging</p>
          </div>
        </div>

        <div className="engine-pill">
          <span className={`status-dot ${backendHealth.online ? '' : 'offline'}`}></span>
          <span className="engine-name">
            {backendHealth.online
              ? `Engine: ${backendHealth.provider}`
              : 'Backend Disconnected'}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {toast && (
          <div className="toast-banner">
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

      {/* Inspector Modal */}
      {selectedEntry && (
        <EntryDetailModal
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
        />
      )}

      {/* Footer */}
      <footer className="app-footer">
        <p>IIFL Finance &bull; Full Stack + Applied AI Screening Prototype</p>
      </footer>
    </div>
  );
}
