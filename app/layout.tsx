import type {Metadata} from 'next';
import { Sora, Outfit } from 'next/font/google';
import './globals.css'; // Global styles

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'FutureFlow | Recurring Transactions Forecast',
  description: 'A futuristic, space-age personal cash-flow forecasting application tracking recurring incoming, outgoings, owings, and savings.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className="dark h-full">
      <body
        className={`${sora.variable} ${outfit.variable} font-sans antialiased bg-[#020203] text-zinc-100 min-h-full flex flex-col`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
