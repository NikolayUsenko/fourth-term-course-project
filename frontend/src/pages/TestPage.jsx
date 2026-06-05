import React, { useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTypingTest } from '../hooks/useTypingTest';
import TestResultModal from '../components/TestResultModal';
import api from '../services/api';

const LANGUAGES = ['en', 'ru'];
const WORD_COUNTS = [10, 25, 50, 100];
const TIME_LIMITS = [15, 30, 60, 120];

export default function TestPage() {
  const { user } = useAuth();

  // Config state (persisted in sessionStorage for UX)
  const [language, setLanguage] = React.useState('en');
  const [testType, setTestType] = React.useState('words');
  const [wordCount, setWordCount] = React.useState(25);
  const [timeLimit, setTimeLimit] = React.useState(30);
  const [savedStats, setSavedStats] = React.useState(null);
  const [saveError, setSaveError] = React.useState('');

  const config = { language, testType, wordCount, timeLimit };

  const {
    words, currentWordIdx, currentInput, typedHistory,
    status, timeLeft, stats,
    handleKeyDown, restart,
  } = useTypingTest(config);

  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Focus invisible input when clicking the words area
  const focusInput = useCallback(() => inputRef.current?.focus(), []);

  useEffect(() => {
    if (status === 'running' || status === 'idle') focusInput();
  }, [status, focusInput]);

  // Save result when finished
  useEffect(() => {
    if (status !== 'finished' || !stats || !user) return;
    setSavedStats(null);
    setSaveError('');

    const payload = {
      language,
      test_type: testType,
      word_count: testType === 'words' ? wordCount : null,
      time_limit: testType === 'time' ? timeLimit : null,
      wpm: stats.wpm,
      cpm: stats.cpm,
      accuracy: stats.accuracy,
      typos: stats.typos,
      duration: stats.duration,
    };

    api.post('/results/', payload)
      .then(res => setSavedStats(res.data))
      .catch(() => setSaveError('Could not save result.'));
  }, [status, stats]);

  // Config change: restart immediately
  const handleLanguage = v => { setLanguage(v); };
  const handleTestType = v => { setTestType(v); };
  const handleWordCount = v => { setWordCount(v); };
  const handleTimeLimit = v => { setTimeLimit(v); };

  // Render helpers
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
            let cls = 'char';
            if (ci < typed.length) cls += typed[ci] === c ? ' char--correct' : ' char--incorrect';
            return <span key={ci} className={cls}>{c}</span>;
          })}
          {typed.length > word.length && (
            typed.slice(word.length).split('').map((c, ci) => (
              <span key={`e${ci}`} className="char char--incorrect char--extra">{c}</span>
            ))
          )}
        </span>
      );
    }

    if (wIdx === currentWordIdx) {
      return (
        <span key={wIdx} className="word word--active">
          {word.split('').map((c, ci) => renderChar(c, ci, currentInput))}
          {currentInput.length > word.length && (
            currentInput.slice(word.length).split('').map((c, ci) => (
              <span key={`e${ci}`} className="char char--incorrect char--extra">{c}</span>
            ))
          )}
        </span>
      );
    }

    return (
      <span key={wIdx} className="word">
        {word.split('').map((c, ci) => <span key={ci} className="char">{c}</span>)}
      </span>
    );
  };

  // Live WPM (during test)
  const liveWpm = React.useMemo(() => {
    if (status !== 'running' || !words.length) return 0;
    // Approximate: correct completed words × 60 / elapsed
    return typedHistory.filter((t, i) => t === words[i]).length;
  }, [status, typedHistory, words]);

  return (
    <div className="page">
      {/* Config bar */}
      <div className="test-config">
        {/* Language */}
        <div className="mode-selector">
          {LANGUAGES.map(lang => (
            <button
              key={lang}
              className={'mode-btn' + (language === lang ? ' active' : '')}
              onClick={() => { handleLanguage(lang); restart(); }}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>

        <span className="mode-separator">|</span>

        {/* Test type */}
        <div className="mode-selector">
          <button
            className={'mode-btn' + (testType === 'words' ? ' active' : '')}
            onClick={() => { handleTestType('words'); restart(); }}
          >
            words
          </button>
          <button
            className={'mode-btn' + (testType === 'time' ? ' active' : '')}
            onClick={() => { handleTestType('time'); restart(); }}
          >
            time
          </button>
        </div>

        <span className="mode-separator">|</span>

        {/* Word count / time options */}
        <div className="mode-selector">
          {testType === 'words'
            ? WORD_COUNTS.map(n => (
              <button
                key={n}
                className={'mode-btn' + (wordCount === n ? ' active' : '')}
                onClick={() => { handleWordCount(n); restart(); }}
              >{n}</button>
            ))
            : TIME_LIMITS.map(t => (
              <button
                key={t}
                className={'mode-btn' + (timeLimit === t ? ' active' : '')}
                onClick={() => { handleTimeLimit(t); restart(); }}
              >{t}</button>
            ))
          }
        </div>
      </div>

      {/* Timer (time mode) */}
      {testType === 'time' && status === 'running' && (
        <div className="timer-display">{timeLeft}</div>
      )}

      {/* Words area */}
      <div
        className="words-wrapper"
        ref={containerRef}
        onClick={focusInput}
      >
        <input
          ref={inputRef}
          className="hidden-input"
          onKeyDown={handleKeyDown}
          readOnly
          tabIndex={-1}
        />
        <div className={`words-container${status === 'idle' ? '' : ''}`}>
          {words.map((word, idx) => renderWord(word, idx))}
        </div>
      </div>

      {/* Hint */}
      {status === 'idle' && (
        <div className="test-hint">Click here and start typing · Tab — restart</div>
      )}

      {saveError && <div className="error-message" style={{ marginTop: '1rem' }}>{saveError}</div>}
      {user === null && status === 'finished' && (
        <div className="test-hint" style={{ marginTop: '0.5rem' }}>
          <span style={{ color: 'var(--sub)' }}>Log in to save your results.</span>
        </div>
      )}

      {/* Result modal */}
      {status === 'finished' && stats && (
        <TestResultModal
          stats={stats}
          config={config}
          onNewTest={() => {
            // randomize new words (change nothing else)
            restart();
          }}
          onRestart={restart}
        />
      )}
    </div>
  );
}