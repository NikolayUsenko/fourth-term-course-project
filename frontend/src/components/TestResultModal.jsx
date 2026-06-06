import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/** Format seconds → HH:MM:SS */
function fmt(totalSeconds) {
  const s = Math.floor(totalSeconds || 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map(v => String(v).padStart(2, '0')).join(':');
}

/**
 * Stats popup shown after a typing test.
 * - Authenticated: result is already saved by TestPage; just shows stats.
 * - Unauthenticated: shows stats + prompt to register / sign in.
 * One button only: Restart.
 */
export default function TestResultModal({ stats, config, onRestart }) {
  const { user } = useAuth();
  if (!stats) return null;

  const langLabel = config.language === 'en' ? 'English' : 'Russian';
  const testLabel = `${langLabel} · ${config.wordCount} words`;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal__title">Test Complete</div>

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
            <div className="modal__stat-value">{fmt(stats.duration)}</div>
            <div className="modal__stat-label">Duration</div>
          </div>
          <div className="modal__stat modal__stat--secondary">
            <div className="modal__stat-value">{stats.typos}</div>
            <div className="modal__stat-label">Typos</div>
          </div>
        </div>

        <div className="modal__meta">{testLabel}</div>

        {/* Only shown to guests */}
        {!user && (
          <div className="modal__auth-hint">
            <Link to="/register">Register</Link> or{' '}
            <Link to="/login">Sign in</Link> to save your statistics and track progress.
          </div>
        )}

        <div className="modal__actions">
          <button className="btn btn--primary" onClick={onRestart}>
            ↺ Restart
          </button>
        </div>
      </div>
    </div>
  );
}