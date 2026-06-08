import { render, screen, act, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Notification from './Notification';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth } from '../contexts/AuthContext';

jest.mock('../hooks/useWebSocket', () => ({ useWebSocket: jest.fn() }));
jest.mock('../contexts/AuthContext', () => ({ useAuth: jest.fn() }));

const RECORD_EVENT = {
  type: 'new_record',
  data: { language: 'en', word_count: 25, wpm: 75.3, previous_best: 70.1 },
};

describe('Notification', () => {
  let trigger;

  beforeEach(() => {
    jest.useFakeTimers();
    useAuth.mockReturnValue({ user: { username: 'Nikolay' } });
    useWebSocket.mockImplementation(cb => { trigger = cb; });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('изначально ничего не отображается', () => {
    render(<Notification />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('событие new_record показывает уведомление', () => {
    render(<Notification />);
    act(() => trigger(RECORD_EVENT));
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('🏆 New Personal Record!')).toBeInTheDocument();
  });

  test('уведомление содержит WPM и предыдущий рекорд', () => {
    render(<Notification />);
    act(() => trigger(RECORD_EVENT));
    expect(screen.getByText(/75\.3 WPM/)).toBeInTheDocument();
    expect(screen.getByText(/70\.1/)).toBeInTheDocument();
  });

  test('клик по уведомлению закрывает его', () => {
    render(<Notification />);
    act(() => trigger(RECORD_EVENT));
    fireEvent.click(screen.getByRole('alert'));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('событие другого типа не показывает уведомление', () => {
    render(<Notification />);
    act(() => trigger({ type: 'ping', data: {} }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('неавторизованный пользователь не получает уведомлений', () => {
    useAuth.mockReturnValue({ user: null });
    render(<Notification />);
    act(() => trigger(RECORD_EVENT));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});