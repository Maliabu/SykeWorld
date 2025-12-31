'use client'

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';

const AutoLogout = ({ timeoutMinutes = 15 }) => {
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Logout function
  const logout = () => {
    localStorage.removeItem('token'); // or whatever you use
    // Optionally call API to mark isLoggedIn = false
    router.push('/login');
  };

  // Reset timer on any activity
  const resetTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(logout, timeoutMinutes * 60 * 1000);
  };

  useEffect(() => {
    // List of events that count as activity
    const events = ['mousemove', 'keydown', 'scroll', 'click'];

    // Add listeners
    events.forEach(event => window.addEventListener(event, resetTimer));

    // Start initial timer
    resetTimer();

    // Clean up on unmount
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, []);

  return null; // nothing visible
};

export default AutoLogout;