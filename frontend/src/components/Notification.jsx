import React, { useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth } from '../contexts/AuthContext';

let _id = 0;

export default function Notification() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);

  const dismiss = (id) => setItems(prev => prev.filter(n => n.id !== id));

  useWebSocket((msg) => {
    if (!user || msg.type !== 'new_record') return;
    const { data } = msg;
    const lang = data.language === 'en' ? 'English' : 'Russian';

    const notif = {
      id: ++_id,
      title: '🏆 New Personal Record!',
      body: `${lang} · ${data.word_count} words · ${data.wpm} WPM  (prev. ${data.previous_best})`,
    };

    setItems(prev => [...prev.slice(-3), notif]);
    setTimeout(() => dismiss(notif.id), 5000);
  });

  if (!items.length) return null;

  return (
    <div className="notifications-container">
      {items.map(n => (
        <div key={n.id} className="notification" onClick={() => dismiss(n.id)} role="alert">
          <div className="notification__title">{n.title}</div>
          <div className="notification__body">{n.body}</div>
        </div>
      ))}
    </div>
  );
}