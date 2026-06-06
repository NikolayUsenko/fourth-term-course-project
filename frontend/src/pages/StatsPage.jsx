import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

const fetchStats = () => api.get('/stats/').then(r => r.data);

const WORD_COLS = [10, 25, 50, 100];

/** Format seconds → HH:MM:SS */
function fmt(totalSeconds) {
  const s = Math.floor(totalSeconds || 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map(v => String(v).padStart(2, '0')).join(':');
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
  const dash = <span style={{ color: 'var(--sub)' }}>—</span>;

  return (
    <div className="page">
      <div className="stats-page__header">
        <h1 className="stats-page__title">My Statistics</h1>
      </div>

      {/* Overview */}
      <div className="stats-overview">
        <div className="overview-card">
          <div className="overview-card__value">{stats.total_tests}</div>
          <div className="overview-card__label">Tests Completed</div>
        </div>
        <div className="overview-card">
          <div className="overview-card__value">{fmt(stats.total_time)}</div>
          <div className="overview-card__label">Total Time</div>
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

      {stats.total_tests === 0 ? (
        <div className="stats-empty">Complete some tests to see your statistics here.</div>
      ) : (
        <>
          {/* Language tabs */}
          <div className="stats-lang-tabs">
            {[['en', 'English'], ['ru', 'Russian']].map(([val, label]) => (
              <button
                key={val}
                className={'layout-tab' + (langTab === val ? ' active' : '')}
                onClick={() => setLangTab(val)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Per-word-count breakdown */}
          <table className="stats-table">
            <thead>
              <tr>
                <th>Words</th>
                <th>Avg WPM</th>
                <th>Avg Accuracy</th>
                <th>Attempts</th>
              </tr>
            </thead>
            <tbody>
              {WORD_COLS.map(n => {
                const row = lang[`words_${n}`];
                return (
                  <tr key={n}>
                    <td>{n}</td>
                    <td>{row ? row.avg_wpm : dash}</td>
                    <td>{row ? `${row.avg_accuracy}%` : dash}</td>
                    <td>{row ? row.attempts : dash}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}