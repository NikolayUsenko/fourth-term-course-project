import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

const LAYOUTS = [
  { value: 'qwerty', label: 'QWERTY' },
  { value: 'jcuken', label: 'ЙЦУКЕН' },
];

const fetchLessons = async (layout) => {
  const res = await api.get(`/lessons/?layout=${layout}&ordering=order`);
  return res.data.results ?? res.data;
};

export default function LessonsPage() {
  const [layout, setLayout] = useState('qwerty');
  const navigate = useNavigate();

  const { data: lessons = [], isLoading, isError } = useQuery({
    queryKey: ['lessons', layout],
    queryFn: () => fetchLessons(layout),
    staleTime: 1000 * 60 * 10,
  });

  return (
    <div className="page">
      <h1 style={{ color: 'var(--text)', marginBottom: '1.5rem', fontSize: '1.5rem' }}>
        Lessons
      </h1>

      {/* Layout tabs */}
      <div className="lessons-layout-tabs">
        {LAYOUTS.map(l => (
          <button
            key={l.value}
            className={'layout-tab' + (layout === l.value ? ' active' : '')}
            onClick={() => setLayout(l.value)}
          >
            {l.label}
          </button>
        ))}
      </div>

      {isLoading && <div className="loading">Loading lessons…</div>}
      {isError && <div className="error-message">Failed to load lessons.</div>}

      {!isLoading && !isError && (
        lessons.length === 0
          ? <div className="stats-empty">No lessons yet.</div>
          : (
            <div className="lessons-grid">
              {lessons.map((lesson, idx) => (
                <div
                  key={lesson.id}
                  className="lesson-card"
                  onClick={() => navigate(`/lessons/${lesson.id}`)}
                >
                  <div className="lesson-card__number">Lesson {idx + 1}</div>
                  <div className="lesson-card__title">{lesson.title}</div>
                  <div className="lesson-card__desc">
                    {lesson.description || lesson.content.slice(0, 60) + '…'}
                  </div>
                </div>
              ))}
            </div>
          )
      )}
    </div>
  );
}