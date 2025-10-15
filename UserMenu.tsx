'use client';

import React, { useState, useEffect, useRef } from 'react';
import { User, LogOut, Settings, UserCog } from 'lucide-react';
import { supabase } from './lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Session } from '@supabase/supabase-js';

/**
 * UserMenu provides a user icon in the top-right corner with a dropdown
 * for profile, settings, and logout actions. It only renders if a user
 * session exists.
 */
export default function UserMenu() {
  const [session, setSession] = useState<Session | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  // Fetch session and listen for auth changes
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsOpen(false);
    router.push('/auth');
  };

  // Don't render the menu if there is no active session
  if (!session) {
    return null;
  }

  return (
    <div className="absolute top-4 right-4 z-50" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors"
        aria-label="User menu"
      >
        <User className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 text-gray-800">
          <Link href="/enrollment" className="flex items-center px-4 py-2 text-sm hover:bg-gray-100" onClick={() => setIsOpen(false)}>
            <UserCog className="w-4 h-4 mr-2" />
            Profile
          </Link>
          <Link href="/settings" className="flex items-center px-4 py-2 text-sm hover:bg-gray-100" onClick={() => setIsOpen(false)}>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Link>
          <button onClick={handleLogout} className="w-full text-left flex items-center px-4 py-2 text-sm hover:bg-gray-100">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}