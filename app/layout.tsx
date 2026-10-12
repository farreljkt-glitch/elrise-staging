import type {Metadata, Viewport} from 'next';
import './globals.css'; // Global styles
import { AuthProvider } from '@/lib/mock-auth';
import { ToastProvider } from '@/components/ui/Toast';
import { ThemeProvider, THEME_INIT_SCRIPT } from '@/lib/theme';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f4f7fa' },
    { media: '(prefers-color-scheme: dark)', color: '#07101c' },
  ],
};

export const metadata: Metadata = {
  icons: { icon: '/brand/favicon.png', apple: '/brand/apple-touch-icon.png' },
  title: 'Terhubung Gajiku — HRIS by elrise',
  description: 'Sistem HRIS multi-klien terhubung dengan Gajiku untuk Superadmin, Admin Klien, dan Pegawai.',
  openGraph: {
    title: 'Terhubung Gajiku — HRIS by elrise',
    description: 'Sistem HRIS multi-klien terhubung dengan Gajiku untuk Superadmin, Admin Klien, dan Pegawai.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Terhubung Gajiku — HRIS by elrise',
    description: 'Sistem HRIS multi-klien terhubung dengan Gajiku untuk Superadmin, Admin Klien, dan Pegawai.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body suppressHydrationWarning className="bg-[var(--bg)] text-[var(--text-primary)] antialiased">
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>{children}</ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
