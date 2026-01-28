import Link from 'next/link';
import { branding } from '@/lib/config';

export default function NotFound() {
  return (
    <main 
      className="flex min-h-screen flex-col items-center justify-center p-8"
      style={{ background: branding.backgroundGradient }}
    >
      <div className="text-center">
        <div className="text-6xl mb-6">{branding.logo}</div>
        <h1 className="text-3xl font-bold mb-4 text-white">Recommendation Not Found</h1>
        <p className="text-gray-400 mb-8">
          This recommendation link may have expired or is invalid.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-bold px-6 py-3 rounded-full transition-opacity hover:opacity-90"
          style={{ background: branding.buttonGradient, color: branding.primaryColor }}
        >
          Go Home
        </Link>
      </div>
    </main>
  );
}
