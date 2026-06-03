import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

import Navbar from './components/Navbar';
import Notification from './components/Notification';
import ProtectedRoute from './components/ProtectedRoute';

import TestPage from './pages/TestPage';
import LessonsPage from './pages/LessonsPage';
import LessonPracticePage from './pages/LessonPracticePage';
import StatsPage from './pages/StatsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

export default function App() {
  return (
    <div className="app">
      <Navbar />
      <Notification />
      <Routes>
        <Route path="/" element={<TestPage />} />
        <Route path="/lessons" element={<LessonsPage />} />
        <Route path="/lessons/:id" element={<LessonPracticePage />} />
        <Route path="/stats" element={<ProtectedRoute><StatsPage /></ProtectedRoute>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}