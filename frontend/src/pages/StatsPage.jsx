import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

const fetchStats = async () => {
  const res = await api.get('/stats/');
  return res.data;
};

const WORD_COLS = [10, 25, 50, 100];
const TIME_COLS = [15, 30, 60, 120];

function formatTime(seconds) {
  if (!seconds) return '0s';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export default function StatsPage() {
  const [langTab, setLangTab] = useState('en');

  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ['user-stats'],
    queryFn: fetchStats,
    staleTime: 1000 * 30,
  });

  if (isLoading) return <div className="loading page">Loading statistics…</div>;
  if (isError) return <div className="page"><div className="error-message">Failed to load statistics.</div></div>;

  const lang = stats?.languages?.[langTab] || {};

  return (
    <div className="page">
      <div className="stats-page__header">
        <h1 className="stats-page__title">My Statistics</h1>
      </div>

      {/* Overview cards */}
      <div className="stats-overview">
        <div className="overview-card">
          <div className="overview-card__value">{stats.total_tests}</div>
          <div className="overview-card__label">Tests</div>
        </div>
        <div className="overview-card">
          <div className="overview-card__value">{formatTime(stats.total_time)}</div>
          <div className="overview-card__label">Time Typing</div>
        </div>
        <div className="overview-card">
          <div className="overview-card__value">{stats.avg_wpm}</div>
          <div className="overview-card__label">Avg WPM</div>
        </div>
        <div className="overview-card">
          <div className="overview-card__value">{stats.avg_cpm}</div>
          <div className="overview-card__label">Avg CPM</div>
        </div>
        <div className="overview-card">
          <div className="overview-card__value">{stats.avg_accuracy}%</div>
          <div className="overview-card__label">Avg Accuracy</div>
        </div>
      </div>

      {/* Language tabs */}
      <div className="stats-lang-tabs">
        {['en', 'ru'].map(l => (
          <button
            key={l}
            className={'layout-tab' + (langTab === l ? ' active' : '')}
            onClick={() => setLangTab(l)}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Words table */}
      <h3 style={{ color: 'var(--sub)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.75rem' }}>
        Words
      </h3>
      <table className="stats-table" style={{ marginBottom: '2rem' }}>
        <thead>
          <tr>
            <th>Words</th>
            <th>Best WPM</th>
            <th>Best Accuracy</th>
            <th>Attempts</th>
          </tr>
        </thead>
        <tbody>
          {WORD_COLS.map(n => {
            const row = lang[`words_${n}`];
            return (
              <tr key={n}>
                <td>{n}</td>
                <td>{row ? row.best_wpm : <span style={{ color: 'var(--sub)' }}>—</span>}</td>
                <td>{row ? `${row.best_accuracy}%` : <span style={{ color: 'var(--sub)' }}>—</span>}</td>
                <td>{row ? row.attempts : <span style={{ color: 'var(--sub)' }}>—</span>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Time table */}
      <h3 style={{ color: 'var(--sub)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.75rem' }}>
        Time
      </h3>
      <table className="stats-table">
        <thead>
          <tr>
            <th>Seconds</th>
            <th>Best WPM</th>
            <th>Best Accuracy</th>
            <th>Attempts</th>
          </tr>
        </thead>
        <tbody>
          {TIME_COLS.map(t => {
            const row = lang[`time_${t}`];
            return (
              <tr key={t}>
                <td>{t}s</td>
                <td>{row ? row.best_wpm : <span style={{ color: 'var(--sub)' }}>—</span>}</td>
                <td>{row ? `${row.best_accuracy}%` : <span style={{ color: 'var(--sub)' }}>—</span>}</td>
                <td>{row ? row.attempts : <span style={{ color: 'var(--sub)' }}>—</span>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {stats.total_tests === 0 && (
        <div className="stats-empty">Complete some tests to see your statistics here.</div>
      )}
    </div>
  );
}