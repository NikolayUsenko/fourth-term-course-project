import React from 'react';

export default function TestResultModal({ stats, config, onNewTest, onRestart }) {
  if (!stats) return null;

  const typeLabel = config.testType === 'words'
    ? `${config.wordCount} words`
    : `${config.timeLimit}s`;

  const date = new Date().toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal__title">Test complete</div>

        <div className="modal__stats">
          <div className="modal__stat">
            <div className="modal__stat-value">{stats.wpm}</div>
            <div className="modal__stat-label">WPM</div>
          </div>
          <div className="modal__stat">
            <div className="modal__stat-value">{stats.cpm}</div>
            <div className="modal__stat-label">CPM</div>
          </div>
          <div className="modal__stat">
            <div className="modal__stat-value">{stats.accuracy}%</div>
            <div className="modal__stat-label">Accuracy</div>
          </div>
          <div className="modal__stat">
            <div className="modal__stat-value">{stats.typos}</div>
            <div className="modal__stat-label">Typos</div>
          </div>
          <div className="modal__stat modal__stat--secondary">
            <div className="modal__stat-value">{stats.duration}s</div>
            <div className="modal__stat-label">Duration</div>
          </div>
        </div>

        <div className="modal__meta">
          {config.language.toUpperCase()} · {typeLabel} · {date}
        </div>

        <div className="modal__actions">
          <button className="btn btn--secondary" onClick={onNewTest}>New Test</button>
          <button className="btn btn--primary" onClick={onRestart}>Restart</button>
        </div>
      </div>
    </div>
  );
}