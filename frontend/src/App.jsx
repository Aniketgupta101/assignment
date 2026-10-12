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
  const [backendStatus, setBackendStatus] = useState({ online: false, provider: 'checking' });
  const [toastMessage, setToastMessage] = useState(null);

  // Load initial entries and check health
  useEffect(() => {
    loadEntries();
    checkHealth();
  }, []);

  const checkHealth = async () => {
    const health = await checkBackendHealth();
    if (health.healthy) {
      setBackendStatus({ online: true, provider: health.configured_provider || 'configured' });
    } else {
      setBackendStatus({ online: false, provider: 'offline' });
    }
  };

  const loadEntries = async () => {
    try {
      const data = await fetchEntries();
      setEntries(data);
    } catch (err) {
      console.error('Failed to load entries:', err);
    }
  };

  const handleSubmit = async (text) => {
    setIsLoading(true);
    setError(null);
    try {
      const newEntry = await createEntry(text);
      setEntries((prev) => [newEntry, ...prev]);
      setToastMessage('Summary generated & saved to database!');
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      setError(err.message || 'Something went wrong while communicating with the AI service.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* Navigation Header */}
      <header className="navbar">
        <div className="navbar-brand">
          <span className="brand-logo">✨</span>
          <div>
            <h1 className="brand-title">AI Content Assistant</h1>
            <p className="brand-subtitle">Automated Summaries & Tagging</p>
          </div>
        </div>

        <div className="status-indicator">
          <span className={`status-dot ${backendStatus.online ? 'online' : 'offline'}`}></span>
          <span className="status-text">
            {backendStatus.online
              ? `Backend Active (${backendStatus.provider})`
              : 'Backend Offline'}
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        {toastMessage && (
          <div className="toast-success">
            <span>✅ {toastMessage}</span>
          </div>
        )}

        <EntryForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          error={error}
          onClearError={() => setError(null)}
        />

        <EntryList
          entries={entries}
          onSelectEntry={(entry) => setSelectedEntry(entry)}
        />
      </main>

      {/* Detail View Modal */}
      {selectedEntry && (
        <EntryDetailModal
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
        />
      )}

      {/* Footer */}
      <footer className="footer">
        <p>AI Content Assistant &bull; Full Stack + Applied AI prototype</p>
      </footer>
    </div>
  );
}
