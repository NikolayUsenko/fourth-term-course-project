import React from 'react';

export default function LessonResultModal({ stats, layout, onNext, onRetry, onList }) {
  if (!stats) return null;

  const layoutLabel = layout === 'jcuken' ? 'ЙЦУКЕН' : 'QWERTY';

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal__title">Lesson complete</div>

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
            <div className="modal__stat-value">{stats.typos}</div>
            <div className="modal__stat-label">Typos</div>
          </div>
          <div className="modal__stat modal__stat--secondary">
            <div className="modal__stat-value">{stats.duration}s</div>
            <div className="modal__stat-label">Duration</div>
          </div>
        </div>

        <div className="modal__meta">{layoutLabel}</div>

        <div className="modal__actions">
          <button className="btn btn--ghost" onClick={onList}>All Lessons</button>
          <button className="btn btn--secondary" onClick={onRetry}>Retry</button>
          {onNext && (
            <button className="btn btn--primary" onClick={onNext}>Next Lesson →</button>
          )}
        </div>
      </div>
    </div>
  );
}