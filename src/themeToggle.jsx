import { useEffect, useState } from 'react';
import './components/button.css';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return (
    <button className='gh-btn gh-btn--navbar'
      onClick={() => setIsDark(!isDark)}
    >
      {isDark ? '☀️ LIGHT' : '🌙 DARK'}
    </button>
  );
}