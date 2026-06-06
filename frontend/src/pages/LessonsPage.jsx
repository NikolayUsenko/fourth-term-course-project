import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'ru', label: 'Russian' },
];

const fetchLessons = (language) =>
  api.get(`/lessons/?language=${language}&ordering=order`)
    .then(r => r.data.results ?? r.data);

export default function LessonsPage() {
  const [language, setLanguage] = useState('en');
  const navigate = useNavigate();

  const { data: lessons = [], isLoading, isError } = useQuery({
    queryKey: ['lessons', language],
    queryFn: () => fetchLessons(language),
    staleTime: 1000 * 60 * 10,
  });

  return (
    <div className="page">
      <h1 style={{ color: 'var(--text)', marginBottom: '1.5rem', fontSize: '1.5rem' }}>
        Lessons
      </h1>

      {/* Language tabs */}
      <div className="lessons-layout-tabs">
        {LANGUAGES.map(({ value, label }) => (
          <button
            key={value}
            className={'layout-tab' + (language === value ? ' active' : '')}
            onClick={() => setLanguage(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading && <div className="loading">Loading lessons…</div>}
      {isError && <div className="error-message">Failed to load lessons.</div>}

      {!isLoading && !isError && (
        lessons.length === 0
          ? <div className="stats-empty">No lessons available for this language yet.</div>
          : (
            <div className="lessons-grid">
              {lessons.map((lesson, idx) => (
                <div
                  key={lesson.id}
                  className="lesson-card"
                  onClick={() => navigate(`/lessons/${lesson.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && navigate(`/lessons/${lesson.id}`)}
                >
                  <div className="lesson-card__number">Lesson {idx + 1}</div>
                  <div className="lesson-card__title">{lesson.title}</div>
                  <div className="lesson-card__keys">
                    <span className="lesson-card__combo">{lesson.key_combination}</span>
                  </div>
                </div>
              ))}
            </div>
          )
      )}
    </div>
  );
}