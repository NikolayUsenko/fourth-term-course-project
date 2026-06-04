import { useState, useCallback, useRef, useMemo } from 'react';

/**
 * Typing hook for lessons (fixed text, no time limit).
 * content: the lesson text (words separated by spaces)
 */
export function useLessonTyping(content) {
  const words = useMemo(() => {
    return content ? content.trim().split(/\s+/) : [];
  }, [content]);

  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [currentInput, setCurrentInput] = useState('');
  const [typedHistory, setTypedHistory] = useState([]);
  const [status, setStatus] = useState('idle');
  const [stats, setStats] = useState(null);

  const currentWordIdxRef = useRef(0);
  const typedHistoryRef = useRef([]);
  const statusRef = useRef('idle');
  const startTimeRef = useRef(null);

  currentWordIdxRef.current = currentWordIdx;
  typedHistoryRef.current = typedHistory;
  statusRef.current = status;

  const calcStats = useCallback((hist) => {
    if (!startTimeRef.current) return null;
    const duration = (Date.now() - startTimeRef.current) / 1000;
    const mins = duration / 60;
    let correctChars = 0, totalChars = 0, typos = 0;

    hist.forEach((typed, i) => {
      const word = words[i] || '';
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
      cpm: mins > 0 ? Math.round(correctChars / mins * 10) / 10 : 0,
      accuracy: totalChars > 0 ? Math.round(correctChars / totalChars * 1000) / 10 : 100,
      typos,
      duration: Math.round(duration * 10) / 10,
    };
  }, [words]);

  const restart = useCallback(() => {
    currentWordIdxRef.current = 0;
    typedHistoryRef.current = [];
    statusRef.current = 'idle';
    startTimeRef.current = null;
    setCurrentWordIdx(0);
    setCurrentInput('');
    setTypedHistory([]);
    setStatus('idle');
    setStats(null);
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (statusRef.current === 'finished') return;
    const { key } = e;

    if (key === 'Tab') { e.preventDefault(); restart(); return; }
    if (key === 'Escape') { restart(); return; }

    if (key.length === 1 && statusRef.current === 'idle') {
      statusRef.current = 'running';
      startTimeRef.current = Date.now();
      setStatus('running');
    }

    if (statusRef.current !== 'running') return;

    if (key === 'Backspace') { setCurrentInput(p => p.slice(0, -1)); return; }

    if (key === ' ') {
      e.preventDefault();
      setCurrentInput(prev => {
        if (!prev) return prev;
        const newHist = [...typedHistoryRef.current, prev];
        typedHistoryRef.current = newHist;
        setTypedHistory(newHist);

        const nextIdx = currentWordIdxRef.current + 1;
        currentWordIdxRef.current = nextIdx;
        setCurrentWordIdx(nextIdx);

        if (nextIdx >= words.length) {
          statusRef.current = 'finished';
          setStatus('finished');
          setStats(calcStats(newHist));
        }
        return '';
      });
      return;
    }

    if (key.length === 1) setCurrentInput(p => p + key);
  }, [restart, words.length, calcStats]);

  const nextChar = currentWordIdx < words.length
    ? (words[currentWordIdx] || '')[currentInput.length]
    : null;

  return {
    words,
    currentWordIdx,
    currentInput,
    typedHistory,
    status,
    stats,
    handleKeyDown,
    restart,
    nextChar,
  };
}