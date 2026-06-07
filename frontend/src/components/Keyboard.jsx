import React from 'react';

const LAYOUTS = {
  qwerty: [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
    [' '],
  ],
  jcuken: [
    ['й', 'ц', 'у', 'к', 'е', 'н', 'г', 'ш', 'щ', 'з', 'х', 'ъ'],
    ['ф', 'ы', 'в', 'а', 'п', 'р', 'о', 'л', 'д', 'ж', 'э'],
    ['я', 'ч', 'с', 'м', 'и', 'т', 'ь', 'б', 'ю'],
    [' '],
  ],
};

export default function Keyboard({ layout = 'qwerty', highlightChar = '' }) {
  const rows = LAYOUTS[layout] || LAYOUTS.qwerty;
  const target = highlightChar.toLowerCase();

  return (
    <div className="keyboard">
      {rows.map((row, ri) => (
        <div key={ri} className="keyboard-row">
          {row.map((key, ki) => {
            const isSpace = key === ' ';
            const isHighlight = isSpace
              ? target === ' '
              : key === target;
            return (
              <div
                key={ki}
                className={
                  'key' +
                  (isSpace ? ' key--space' : '') +
                  (isHighlight ? ' key--highlight' : '')
                }
              >
                {isSpace ? 'space' : key}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}