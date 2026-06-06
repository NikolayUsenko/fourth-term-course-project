import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Lesson typing hook — fixed content, no time limit.
 *
 * Rules identical to useTypingTest:
 *   - No backspace.
 *   - Accuracy = correct keystrokes / total keystrokes.
 *   - Ends when Space is pressed after the last word.
 *
 * Stats returned: cpm, accuracy, typos, duration.
 */
export function useLessonTyping(content) {
  const toWords = (c) => (c ? c.trim().split(/\s+/) : []);

  const [words, setWords] = useState(() => toWords(content));
  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [currentInput, setCurrentInput] = useState('');
  const [typedHistory, setTypedHistory] = useState([]);
  const [status, setStatus] = useState('idle');
  const [stats, setStats] = useState(null);

  const wordsRef = useRef(toWords(content));
  const currentWordIdxRef = useRef(0);
  const typedHistoryRef = useRef([]);
  const currentInputRef = useRef('');
  const statusRef = useRef('idle');
  const startTimeRef = useRef(null);
  const keystrokesRef = useRef({ total: 0, correct: 0 });

  wordsRef.current = words;
  currentWordIdxRef.current = currentWordIdx;
  typedHistoryRef.current = typedHistory;
  statusRef.current = status;

  // Stats
  const calcStats = useCallback(() => {
    if (!startTimeRef.current) return null;
    const duration = (Date.now() - startTimeRef.current) / 1000;
    const minutes = duration / 60;
    const ks = keystrokesRef.current;

    return {
      cpm: minutes > 0 ? Math.round(ks.correct / minutes * 10) / 10 : 0,
      accuracy: ks.total > 0 ? Math.round(ks.correct / ks.total * 1000) / 10 : 100,
      typos: ks.total - ks.correct,
      duration: Math.round(duration * 10) / 10,
    };
  }, []);

  const finish = useCallback(() => {
    statusRef.current = 'finished';
    setStatus('finished');
    setStats(calcStats());
  }, [calcStats]);

  // Restart (also called with new words when content changes)
  const restart = useCallback((customWords) => {
    const fresh = customWords ?? wordsRef.current;
    wordsRef.current = fresh;
    currentWordIdxRef.current = 0;
    typedHistoryRef.current = [];
    currentInputRef.current = '';
    statusRef.current = 'idle';
    startTimeRef.current = null;
    keystrokesRef.current = { total: 0, correct: 0 };

    setWords(fresh);
    setCurrentWordIdx(0);
    setCurrentInput('');
    setTypedHistory([]);
    setStatus('idle');
    setStats(null);
  }, []);

  // Reinitialise when lesson content changes
  useEffect(() => {
    restart(toWords(content));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  // Key handler
  const handleKeyDown = useCallback((e) => {
    if (statusRef.current === 'finished') return;
    const { key } = e;

    if (key === 'Tab') { e.preventDefault(); restart(); return; }
    if (key === 'Escape') { restart(); return; }

    if (key === ' ') {
      e.preventDefault();
      const input = currentInputRef.current;
      if (!input) return;

      const newHist = [...typedHistoryRef.current, input];
      typedHistoryRef.current = newHist;
      setTypedHistory(newHist);

      const nextIdx = currentWordIdxRef.current + 1;
      currentWordIdxRef.current = nextIdx;
      setCurrentWordIdx(nextIdx);

      currentInputRef.current = '';
      setCurrentInput('');

      if (nextIdx >= wordsRef.current.length) {
        finish();
      }
      return;
    }

    if (key.length === 1) {
      if (statusRef.current === 'idle') {
        statusRef.current = 'running';
        startTimeRef.current = Date.now();
        setStatus('running');
      }
      if (statusRef.current !== 'running') return;

      const currentWord = wordsRef.current[currentWordIdxRef.current] || '';
      const pos = currentInputRef.current.length;

      keystrokesRef.current.total++;
      if (pos < currentWord.length && key === currentWord[pos]) {
        keystrokesRef.current.correct++;
      }

      currentInputRef.current = currentInputRef.current + key;
      setCurrentInput(prev => prev + key);
    }
    // No Backspace — forward-only
  }, [restart, finish]);

  // Character to highlight on keyboard
  const nextChar = currentWordIdx < words.length
    ? (words[currentWordIdx] || '')[currentInput.length] ?? ''
    : '';

  return {
    words,
    currentWordIdx,
    currentInput,
    typedHistory,
    status,
    stats,
    handleKeyDown,
    restart: () => restart(),
    nextChar,
  };
}