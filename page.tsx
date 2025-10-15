'use client';

import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-4">Settings</h1>
      <p className="text-lg mb-8">This page is under construction.</p>
      <button onClick={() => router.back()} className="px-4 py-2 bg-blue-600 text-white rounded-md">Go Back</button>
    </main>
  );
}