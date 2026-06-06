import React from 'react';

/** Format seconds → HH:MM:SS */
function fmt(totalSeconds) {
  const s = Math.floor(totalSeconds || 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map(v => String(v).padStart(2, '0')).join(':');
}

/**
 * Stats popup shown after a lesson.
 * Shows: CPM, Duration (HH:MM:SS), Accuracy, Typos, Language, Key Combination.
 * Buttons: All Lessons | Retry | Next Lesson →
 */
export default function LessonResultModal({ stats, language, keyCombo, onNext, onRetry, onList }) {
  if (!stats) return null;

  const langLabel = language === 'en' ? 'English' : 'Russian';

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal__title">Lesson Complete</div>

        <div className="modal__stats">
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