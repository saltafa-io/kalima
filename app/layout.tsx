// app/layout.tsx

import './globals.css';
import UserMenu from '@/components/auth/UserMenu';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="relative">
        <UserMenu />
        <main>{children}</main>
      </body>
    </html>
  );
}