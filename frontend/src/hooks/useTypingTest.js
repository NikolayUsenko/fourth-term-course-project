import { useState, useEffect, useCallback, useRef } from 'react';
import { generateWords } from '../utils/wordGenerator';

/**
 * Core hook for both words-based and time-based typing tests.
 */
export function useTypingTest({ language, testType, wordCount, timeLimit }) {
  const [words, setWords] = useState([]);
  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [currentInput, setCurrentInput] = useState('');
  const [typedHistory, setTypedHistory] = useState([]);  // string per word
  const [status, setStatus] = useState('idle');
  const [timeLeft, setTimeLeft] = useState(timeLimit || 0);
  const [stats, setStats] = useState(null);

  // Refs to safely read latest state inside event callbacks
  const wordsRef = useRef([]);
  const currentWordIdxRef = useRef(0);
  const typedHistoryRef = useRef([]);
  const statusRef = useRef('idle');
  const startTimeRef = useRef(null);
  const timerRef = useRef(null);

  wordsRef.current = words;
  currentWordIdxRef.current = currentWordIdx;
  typedHistoryRef.current = typedHistory;
  statusRef.current = status;

  // Stats calculation
  const calcStats = useCallback((hist, wordsArr) => {
    if (!startTimeRef.current) return null;
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    const actualDuration = testType === 'time' ? timeLimit : elapsed;
    const mins = actualDuration / 60;

    let correctWords = 0, correctChars = 0, totalChars = 0, typos = 0;

    hist.forEach((typed, i) => {
      const word = wordsArr[i] || '';
      if (typed === word) correctWords++;
      for (let j = 0; j < Math.max(typed.length, word.length); j++) {
        totalChars++;
        if (j < typed.length && j < word.length && typed[j] === word[j]) {
          correctChars++;
        } else {
          typos++;
        }
      }
    });

    return {
      wpm: mins > 0 ? Math.round(correctWords / mins * 10) / 10 : 0,
      cpm: mins > 0 ? Math.round(correctChars / mins * 10) / 10 : 0,
      accuracy: totalChars > 0 ? Math.round(correctChars / totalChars * 1000) / 10 : 100,
      typos,
      duration: Math.round(actualDuration * 10) / 10,
    };
  }, [testType, timeLimit]);

  // Finish
  const finish = useCallback((hist, wordsArr) => {
    clearInterval(timerRef.current);
    statusRef.current = 'finished';
    setStatus('finished');
    setStats(calcStats(hist, wordsArr));
  }, [calcStats]);

  // Restart
  const restart = useCallback(() => {
    clearInterval(timerRef.current);
    const count = testType === 'words' ? wordCount : 300;
    const fresh = generateWords(language, count);

    wordsRef.current = fresh;
    currentWordIdxRef.current = 0;
    typedHistoryRef.current = [];
    statusRef.current = 'idle';
    startTimeRef.current = null;

    setWords(fresh);
    setCurrentWordIdx(0);
    setCurrentInput('');
    setTypedHistory([]);
    setStatus('idle');
    setTimeLeft(timeLimit || 0);
    setStats(null);
  }, [language, testType, wordCount, timeLimit]);

  useEffect(() => { restart(); }, [restart]);

  // Keyboard handler
  const handleKeyDown = useCallback((e) => {
    if (statusRef.current === 'finished') return;
    const { key } = e;

    if (key === 'Tab') { e.preventDefault(); restart(); return; }
    if (key === 'Escape') { restart(); return; }

    // Start timer on first printable character
    if (key.length === 1 && statusRef.current === 'idle') {
      statusRef.current = 'running';
      startTimeRef.current = Date.now();
      setStatus('running');

      if (testType === 'time') {
        timerRef.current = setInterval(() => {
          setTimeLeft(prev => {
            if (prev <= 1) {
              clearInterval(timerRef.current);
              finish(typedHistoryRef.current, wordsRef.current);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }

    if (statusRef.current !== 'running') return;

    if (key === 'Backspace') {
      setCurrentInput(prev => prev.slice(0, -1));
      return;
    }

    if (key === ' ') {
      e.preventDefault();
      setCurrentInput(prev => {
        if (!prev) return prev;  // ignore leading space

        const newHist = [...typedHistoryRef.current, prev];
        typedHistoryRef.current = newHist;
        setTypedHistory(newHist);

        const nextIdx = currentWordIdxRef.current + 1;
        currentWordIdxRef.current = nextIdx;
        setCurrentWordIdx(nextIdx);

        if (testType === 'words' && nextIdx >= wordsRef.current.length) {
          finish(newHist, wordsRef.current);
        }

        return '';
      });
      return;
    }

    if (key.length === 1) {
      setCurrentInput(prev => prev + key);
    }
  }, [restart, testType, finish]);

  return {
    words,
    currentWordIdx,
    currentInput,
    typedHistory,
    status,
    timeLeft,
    stats,
    handleKeyDown,
    restart,
  };
}