import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function fmt(totalSeconds) {
  const s = Math.floor(totalSeconds || 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map(v => String(v).padStart(2, '0')).join(':');
}

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
          {/* Строка 1: WPM, CPM, Accuracy — по центру */}
          <div className="modal__stats-primary">
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
          </div>

          {/* Строка 2: Duration — на всю ширину */}
          <div className="modal__stat modal__stat--full">
            <div className="modal__stat-value">{fmt(stats.duration)}</div>
            <div className="modal__stat-label">Duration</div>
          </div>
        </div>

        <div className="modal__meta">{testLabel}</div>

        {!user && (
          <div className="modal__auth-hint">
            <Link to="/register">Register</Link> or{' '}
            <Link to="/login">Sign in</Link> to save your statistics and track progress.
          </div>
        )}

        <div className="modal__actions">
          <button className="btn btn--primary" onClick={onRestart}>↺ Restart</button>
        </div>
      </div>
    </div>
  );
}