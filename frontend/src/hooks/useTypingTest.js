import { useState, useEffect, useCallback, useRef } from 'react';
import { generateWords } from '../utils/wordGenerator';

/**
 * Words-only typing test hook.
 *
 * Rules:
 *   - No backspace — forward-only typing.
 *   - Accuracy = correct keystrokes / total keystrokes (keystroke level).
 *   - Test ends when Space is pressed after the LAST word.
 *   - Words are lowercase.
 */
export function useTypingTest({ language, wordCount }) {
  const [words, setWords] = useState(() => generateWords(language, wordCount));
  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [currentInput, setCurrentInput] = useState('');
  const [typedHistory, setTypedHistory] = useState([]); // one string per submitted word
  const [status, setStatus] = useState('idle'); // 'idle' | 'running' | 'finished'
  const [stats, setStats] = useState(null);

  // Refs for safe access inside event handlers (no stale closures)
  const wordsRef = useRef(words);
  const currentWordIdxRef = useRef(0);
  const typedHistoryRef = useRef([]);
  const currentInputRef = useRef('');
  const statusRef = useRef('idle');
  const startTimeRef = useRef(null);
  /** @type {{ total: number, correct: number }} */
  const keystrokesRef = useRef({ total: 0, correct: 0 });

  // Keep refs in sync with state on every render
  wordsRef.current = words;
  currentWordIdxRef.current = currentWordIdx;
  typedHistoryRef.current = typedHistory;
  statusRef.current = status;

  // Stats
  const calcStats = useCallback((hist, wordsArr) => {
    if (!startTimeRef.current) return null;
    const duration = (Date.now() - startTimeRef.current) / 1000;
    const minutes = duration / 60;
    const ks = keystrokesRef.current;

    // WPM — only fully-correct words count
    const correctWords = hist.filter((typed, i) => typed === (wordsArr[i] || '')).length;
    const wpm = minutes > 0 ? correctWords / minutes : 0;

    // CPM — correct keystrokes per minute
    const cpm = minutes > 0 ? ks.correct / minutes : 0;

    // Accuracy — keystroke level
    const accuracy = ks.total > 0 ? (ks.correct / ks.total) * 100 : 100;
    const typos = ks.total - ks.correct;

    return {
      wpm: Math.round(wpm * 10) / 10,
      cpm: Math.round(cpm * 10) / 10,
      accuracy: Math.round(accuracy * 10) / 10,
      typos,
      duration: Math.round(duration * 10) / 10,
    };
  }, []);

  // Finish
  const finish = useCallback((hist, wordsArr) => {
    statusRef.current = 'finished';
    setStatus('finished');
    setStats(calcStats(hist, wordsArr));
  }, [calcStats]);

  // Restart
  const restart = useCallback(() => {
    const fresh = generateWords(language, wordCount);

    // Reset refs synchronously so event handler sees new state immediately
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
  }, [language, wordCount]);

  // Reinitialise when language or wordCount changes (skip mount — useState handles it)
  useEffect(() => {
    restart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, wordCount]);

  // Key handler
  const handleKeyDown = useCallback((e) => {
    if (statusRef.current === 'finished') return;
    const { key } = e;

    // Quick restart shortcuts
    if (key === 'Tab') { e.preventDefault(); restart(); return; }
    if (key === 'Escape') { restart(); return; }

    // Space: submit current word
    if (key === ' ') {
      e.preventDefault();
      const input = currentInputRef.current;
      if (!input) return; // ignore leading space, don't advance

      const newHist = [...typedHistoryRef.current, input];
      typedHistoryRef.current = newHist;
      setTypedHistory(newHist);

      const nextIdx = currentWordIdxRef.current + 1;
      currentWordIdxRef.current = nextIdx;
      setCurrentWordIdx(nextIdx);

      currentInputRef.current = '';
      setCurrentInput('');

      // ← Test ends here (on space after last word)
      if (nextIdx >= wordsRef.current.length) {
        finish(newHist, wordsRef.current);
      }
      return;
    }

    // Printable character
    if (key.length === 1) {
      // Start on first character press
      if (statusRef.current === 'idle') {
        statusRef.current = 'running';
        startTimeRef.current = Date.now();
        setStatus('running');
      }
      if (statusRef.current !== 'running') return;

      const currentWord = wordsRef.current[currentWordIdxRef.current] || '';
      const pos = currentInputRef.current.length; // position in current word

      // Keystroke-level accuracy tracking
      keystrokesRef.current.total++;
      if (pos < currentWord.length && key === currentWord[pos]) {
        keystrokesRef.current.correct++;
      }
      // Extra characters beyond word length → total++ but not correct++

      currentInputRef.current = currentInputRef.current + key;
      setCurrentInput(prev => prev + key);
    }

    // Backspace is intentionally NOT handled — forward-only typing
  }, [restart, finish]);

  return {
    words,
    currentWordIdx,
    currentInput,
    typedHistory,
    status,
    stats,
    handleKeyDown,
    restart,
  };
}