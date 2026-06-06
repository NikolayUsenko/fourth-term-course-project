import React from 'react';

function fmt(totalSeconds) {
  const s = Math.floor(totalSeconds || 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map(v => String(v).padStart(2, '0')).join(':');
}

export default function LessonResultModal({ stats, language, keyCombo, onNext, onRetry, onList }) {
  if (!stats) return null;
  const langLabel = language === 'en' ? 'English' : 'Russian';

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal__title">Lesson Complete</div>

        <div className="modal__stats">
          {/* Строка 1: CPM, Accuracy — по центру */}
          <div className="modal__stats-primary">
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

        <div className="modal__meta">
          {langLabel}
          {' · '}
          <span className="modal__combo">{keyCombo}</span>
        </div>

        <div className="modal__actions">
          <button className="btn btn--ghost" onClick={onList}>All Lessons</button>
          <button className="btn btn--secondary" onClick={onRetry}>↺ Retry</button>
          {onNext && (
            <button className="btn btn--primary" onClick={onNext}>Next →</button>
          )}
        </div>
      </div>
    </div>
  );
}