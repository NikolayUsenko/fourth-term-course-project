import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Keyboard from './Keyboard';

describe('Keyboard', () => {
  test('отображает раскладку QWERTY', () => {
    render(<Keyboard layout="qwerty" />);
    expect(screen.getByText('q')).toBeInTheDocument();
    expect(screen.getByText('a')).toBeInTheDocument();
    expect(screen.getByText('z')).toBeInTheDocument();
    expect(screen.getByText('space')).toBeInTheDocument();
  });

  test('отображает раскладку ЙЦУКЕН', () => {
    render(<Keyboard layout="jcuken" />);
    expect(screen.getByText('й')).toBeInTheDocument();
    expect(screen.getByText('ф')).toBeInTheDocument();
    expect(screen.getByText('я')).toBeInTheDocument();
  });

  test('подсвечивает клавишу, соответствующую highlightChar', () => {
    render(<Keyboard layout="qwerty" highlightChar="f" />);
    expect(screen.getByText('f')).toHaveClass('key--highlight');
    expect(screen.getByText('a')).not.toHaveClass('key--highlight');
  });

  test('подсвечивает клавишу пробела', () => {
    render(<Keyboard layout="qwerty" highlightChar=" " />);
    expect(screen.getByText('space')).toHaveClass('key--highlight');
  });

  test('неизвестная раскладка — fallback на QWERTY', () => {
    render(<Keyboard layout="dvorak" />);
    expect(screen.getByText('q')).toBeInTheDocument();
  });
});