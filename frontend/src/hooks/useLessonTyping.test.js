import { renderHook, act } from '@testing-library/react';
import { useLessonTyping } from './useLessonTyping';

function press(result, key) {
  act(() => {
    result.current.handleKeyDown({ key, preventDefault: jest.fn() });
  });
}

function typeWord(result, word) {
  [...word, ' '].forEach(k => press(result, k));
}

describe('useLessonTyping', () => {
  test('контент корректно разбивается на слова', () => {
    const { result } = renderHook(() => useLessonTyping('asdf asdf fads'));
    expect(result.current.words).toEqual(['asdf', 'asdf', 'fads']);
  });

  test('пробел после последнего слова завершает урок', () => {
    const { result } = renderHook(() => useLessonTyping('ab cd'));
    typeWord(result, 'ab');
    typeWord(result, 'cd');
    expect(result.current.status).toBe('finished');
  });

  test('все символы верные — accuracy 100%', () => {
    const { result } = renderHook(() => useLessonTyping('ab cd'));
    typeWord(result, 'ab');
    typeWord(result, 'cd');
    expect(result.current.stats.accuracy).toBe(100);
  });

  test('неверный символ снижает accuracy', () => {
    const { result } = renderHook(() => useLessonTyping('ab'));
    press(result, 'x');
    press(result, 'b');
    press(result, ' ');
    expect(result.current.stats.accuracy).toBeLessThan(100);
  });
});