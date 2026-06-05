import React, { useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { useLessonTyping } from '../hooks/useLessonTyping';
import LessonResultModal from '../components/LessonResultModal';
import Keyboard from '../components/Keyboard';

const fetchLesson = async (id) => {
  const res = await api.get(`/lessons/${id}/`);
  return res.data;
};

const fetchNextLesson = async (id, layout) => {
  const res = await api.get(`/lessons/?layout=${layout}&ordering=order`);
  const all = res.data.results ?? res.data;
  const idx = all.findIndex(l => l.id === Number(id));
  return idx >= 0 && idx + 1 < all.length ? all[idx + 1] : null;
};

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

  const { data: nextLesson } = useQuery({
    queryKey: ['next-lesson', id, lesson?.layout],
    queryFn: () => fetchNextLesson(id, lesson.layout),
    enabled: !!lesson && status === 'finished',
  });

  const focusInput = useCallback(() => inputRef.current?.focus(), []);

  useEffect(() => {
    if (status !== 'finished') focusInput();
  }, [status, focusInput]);

  const renderWord = (word, wIdx) => {
    if (wIdx < currentWordIdx) {
      const typed = typedHistory[wIdx] || '';
      const correct = typed === word;
      return (
        <span key={wIdx} className={`word ${correct ? 'word--done-correct' : 'word--done-incorrect'}`}>
          {word.split('').map((c, ci) => {
            let cls = 'char';
            if (ci < typed.length) cls += typed[ci] === c ? ' char--correct' : ' char--incorrect';
            return <span key={ci} className={cls}>{c}</span>;
          })}
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
              <span key={`e${ci}`} className="char char--incorrect char--extra">{c}</span>
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
        <div
          className="lesson-header__back"
          onClick={() => navigate('/lessons')}
          style={{ cursor: 'pointer' }}
        >
          ← Back to Lessons
        </div>
        <div className="lesson-header__title">{lesson.title}</div>
        {lesson.description && (
          <div className="lesson-header__desc">{lesson.description}</div>
        )}
      </div>

      {/* Words area */}
      <div className="words-wrapper" onClick={focusInput}>
        <input
          ref={inputRef}
          className="hidden-input"
          onKeyDown={handleKeyDown}
          readOnly
          tabIndex={-1}
        />
        <div className="words-container">
          {words.map((word, idx) => renderWord(word, idx))}
        </div>
      </div>

      {status === 'idle' && (
        <div className="test-hint">Click here and start typing · Tab — restart</div>
      )}

      {/* Keyboard visual */}
      <Keyboard
        layout={lesson.layout}
        highlightChar={status === 'running' ? (nextChar || '') : ''}
      />

      {/* Result modal */}
      {status === 'finished' && stats && (
        <LessonResultModal
          stats={stats}
          layout={lesson.layout}
          onRetry={restart}
          onNext={nextLesson ? () => navigate(`/lessons/${nextLesson.id}`) : null}
          onList={() => navigate('/lessons')}
        />
      )}
    </div>
  );
}