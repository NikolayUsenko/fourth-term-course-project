import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTypingTest } from '../hooks/useTypingTest';
import TestResultModal from '../components/TestResultModal';
import Keyboard from '../components/Keyboard';
import api from '../services/api';

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'ru', label: 'Russian' },
];
const WORD_COUNTS = [10, 25, 50, 100];
const LANG_TO_LAYOUT = { en: 'qwerty', ru: 'jcuken' };
const WRAPPER_H = 112; // matches .words-wrapper height in CSS

export default function TestPage() {
  const { user } = useAuth();

  const [language, setLanguage] = useState('en');
  const [wordCount, setWordCount] = useState(25);
  const [saveError, setSaveError] = useState('');
  const [scrollOffset, setScrollOffset] = useState(0);

  const {
    words, currentWordIdx, currentInput, typedHistory,
    status, stats,
    handleKeyDown, restart,
  } = useTypingTest({ language, wordCount });

  const inputRef = useRef(null);
  const containerRef = useRef(null);

  const focusInput = useCallback(() => inputRef.current?.focus(), []);

  // Keep invisible input focused while test is active
  useEffect(() => {
    if (status !== 'finished') focusInput();
  }, [status, focusInput]);

  // Reset scroll when test resets to idle (config change or restart)
  useEffect(() => {
    if (status === 'idle') setScrollOffset(0);
  }, [status]);

  // Scroll words container so the active word is always visible
  useEffect(() => {
    if (!containerRef.current) return;
    const active = containerRef.current.querySelector('.word--active');
    if (!active) return;

    const wordTop = active.offsetTop;
    const wordBottom = wordTop + active.offsetHeight;

    setScrollOffset(prev => {
      if (wordBottom <= prev + WRAPPER_H) return prev; // already visible
      // Scroll up: keep one row of context above the active word
      const lineH = active.offsetHeight + 8;
      return Math.max(0, wordTop - lineH);
    });
  }, [currentWordIdx]);

  // Save result when finished (authenticated users only)
  useEffect(() => {
    if (status !== 'finished' || !stats || !user) return;
    setSaveError('');
    api.post('/results/', {
      language,
      word_count: wordCount,
      wpm: stats.wpm,
      cpm: stats.cpm,
      accuracy: stats.accuracy,
      typos: stats.typos,
      duration: stats.duration,
    }).catch(() => setSaveError('Could not save result. Please try again.'));
  }, [status, stats, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Next character for keyboard highlight
  const nextChar = useMemo(() => {
    if (status !== 'running') return '';
    const currentWord = words[currentWordIdx] || '';
    return currentInput.length < currentWord.length
      ? currentWord[currentInput.length]
      : ' ';
  }, [status, words, currentWordIdx, currentInput]);

  const handleRestart = () => {
    setSaveError('');
    setScrollOffset(0);
    restart();
  };

  // Word / character rendering
  const renderChar = (char, idx, typedWord) => {
    let cls = 'char';
    if (idx < typedWord.length) {
      cls += typedWord[idx] === char ? ' char--correct' : ' char--incorrect';
    } else if (idx === typedWord.length) {
      cls += ' char--cursor';
    }
    return <span key={idx} className={cls}>{char}</span>;
  };

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
          {word.split('').map((c, ci) => renderChar(c, ci, currentInput))}
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

  return (
    <div className="page">
      {/* Config bar */}
      <div className="test-config">
        <div className="mode-selector">
          {LANGUAGES.map(({ value, label }) => (
            <button
              key={value}
              className={'mode-btn' + (language === value ? ' active' : '')}
              onClick={() => { setLanguage(value); setSaveError(''); }}
            >
              {label}
            </button>
          ))}
        </div>

        <span className="mode-separator">|</span>

        <div className="mode-selector">
          {WORD_COUNTS.map(n => (
            <button
              key={n}
              className={'mode-btn' + (wordCount === n ? ' active' : '')}
              onClick={() => { setWordCount(n); setSaveError(''); }}
            >
              {n}
            </button>
          ))}
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
        <div
          className="words-container"
          ref={containerRef}
          style={{
            transform: `translateY(-${scrollOffset}px)`,
            transition: 'transform 0.25s ease',
          }}
        >
          {words.map((word, idx) => renderWord(word, idx))}
        </div>
      </div>

      {status === 'idle' && (
        <p className="test-hint">Click and start typing · Tab — restart</p>
      )}

      {saveError && (
        <div className="error-message" style={{ marginTop: '1rem' }}>{saveError}</div>
      )}

      {/* Keyboard */}
      <Keyboard
        layout={LANG_TO_LAYOUT[language]}
        highlightChar={nextChar}
      />

      {/* Result modal */}
      {status === 'finished' && stats && (
        <TestResultModal
          stats={stats}
          config={{ language, wordCount }}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}