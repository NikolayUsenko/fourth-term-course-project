import { renderHook } from '@testing-library/react';
import { useTypingTest } from './useTypingTest';

const CONFIG = { language: 'en', wordCount: 3 };

describe('useTypingTest', () => {
  test('начальный статус — idle', () => {
    const { result } = renderHook(() => useTypingTest(CONFIG));
    expect(result.current.status).toBe('idle');
    expect(result.current.stats).toBeNull();
  });
});