import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { useLessonTyping } from '../hooks/useLessonTyping';
import LessonResultModal from '../components/LessonResultModal';
import Keyboard from '../components/Keyboard';

const fetchLesson = (id) => api.get(`/lessons/${id}/`).then(r => r.data);
const fetchAllLessons = (lang) =>
  api.get(`/lessons/?language=${lang}&ordering=order`).then(r => r.data.results ?? r.data);

/** Map lesson language to Keyboard component layout prop */
const LANG_TO_LAYOUT = { en: 'qwerty', ru: 'jcuken' };

export default function LessonPracticePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const { data: lesson, isLoading, isError } = useQuery({
    queryKey: ['lesson', id],
    queryFn: () => fetchLesson(id),
    staleTime: 1000 * 60 * 10,
  });

  const {
    words, currentWordIdx, currentInput, typedHistory,
    status, stats,
    handleKeyDown, restart, nextChar,
  } = useLessonTyping(lesson?.content || '');

  // Fetch full lesson list to find the next lesson (only when finished)
  const { data: allLessons } = useQuery({
    queryKey: ['lessons-all', lesson?.language],
    queryFn: () => fetchAllLessons(lesson.language),
    enabled: !!lesson && status === 'finished',
    staleTime: 1000 * 60 * 10,
  });

  const nextLesson = useMemo(() => {
    if (!allLessons || !lesson) return null;
    const idx = allLessons.findIndex(l => l.id === Number(id));
    return idx >= 0 && idx + 1 < allLessons.length ? allLessons[idx + 1] : null;
  }, [allLessons, lesson, id]);

  const focusInput = useCallback(() => inputRef.current?.focus(), []);

  useEffect(() => {
    if (status !== 'finished') focusInput();
  }, [status, focusInput]);

  // Word rendering
  const renderWord = (word, wIdx) => {
    if (wIdx < currentWordIdx) {
      const typed = typedHistory[wIdx] || '';
      const correct = typed === word;
      return (
        <span key={wIdx} className={`word ${correct ? 'word--done-correct' : 'word--done-incorrect'}`}>
          {word.split('').map((c, ci) => {
            const state = ci < typed.length
              ? (typed[ci] === c ? ' char--correct' : ' char--incorrect')
              : '';
            return <span key={ci} className={`char${state}`}>{c}</span>;
          })}
          {typed.length > word.length &&
            typed.slice(word.length).split('').map((c, ci) => (
              <span key={`x${ci}`} className="char char--incorrect char--extra">{c}</span>
            ))
          }
        </span>
      );
    }

    if (wIdx === currentWordIdx) {
      return (
        <span key={wIdx} className="word word--active">
          {word.split('').map((c, ci) => {
            let cls = 'char';
            if (ci < currentInput.length) cls += currentInput[ci] === c ? ' char--correct' : ' char--incorrect';
            else if (ci === currentInput.length) cls += ' char--cursor';
            return <span key={ci} className={cls}>{c}</span>;
          })}
          {currentInput.length > word.length &&
            currentInput.slice(word.length).split('').map((c, ci) => (
              <span key={`x${ci}`} className="char char--incorrect char--extra">{c}</span>
            ))
          }
        </span>
      );
    }

    return (
      <span key={wIdx} className="word">
        {word.split('').map((c, ci) => <span key={ci} className="char">{c}</span>)}
      </span>
    );
  };

  if (isLoading) return <div className="loading page">Loading lesson…</div>;
  if (isError) return <div className="page"><div className="error-message">Lesson not found.</div></div>;

  return (
    <div className="page">
      {/* Header */}
      <div className="lesson-header">
        <button
          className="lesson-header__back btn btn--ghost btn--sm"
          onClick={() => navigate('/lessons')}
        >
          ← Back to Lessons
        </button>
        <div className="lesson-header__title">{lesson.title}</div>
        <div className="lesson-header__meta">
          <span className="lesson-header__lang">
            {lesson.language === 'en' ? 'English' : 'Russian'}
          </span>
          {' · '}
          <span className="lesson-header__combo">{lesson.key_combination}</span>
        </div>
      </div>

      {/* Words area */}
      <div className="words-wrapper" onClick={focusInput}>
        <input
          ref={inputRef}
          className="hidden-input"
          onKeyDown={handleKeyDown}
          readOnly
          tabIndex={-1}
          aria-hidden="true"
        />
        <div className="words-container">
          {words.map((word, idx) => renderWord(word, idx))}
        </div>
      </div>

      {status === 'idle' && (
        <p className="test-hint">Click and start typing · Tab — restart</p>
      )}

      {/* Keyboard visualisation */}
      <Keyboard
        layout={LANG_TO_LAYOUT[lesson.language] || 'qwerty'}
        highlightChar={status === 'running' ? nextChar : ''}
      />

      {/* Result modal */}
      {status === 'finished' && stats && (
        <LessonResultModal
          stats={stats}
          language={lesson.language}
          keyCombo={lesson.key_combination}
          onRetry={restart}
          onNext={nextLesson ? () => navigate(`/lessons/${nextLesson.id}`) : null}
          onList={() => navigate('/lessons')}
        />
      )}
    </div>
  );
}