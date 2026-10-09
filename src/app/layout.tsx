import type { Metadata } from 'next'
import { Manrope } from 'next/font/google'
import './globals.css'
import { SPLASH_BOOT } from '@/lib/splash'

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-manrope',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    template: '%s | LoteCUU',
    default: 'LoteCUU — Autos usados en Chihuahua',
  },
  description: 'Encuentra tu próximo auto usado en Chihuahua. Contacto directo con vendedores por WhatsApp.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lotecuu.com'),
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // suppressHydrationWarning: the boot script may add "splash-seen" to <html> before React loads
    <html lang="es" className={manrope.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SPLASH_BOOT }} />
      </head>
      <body className="min-h-screen flex flex-col antialiased">
        {children}
      </body>
    </html>
  )
}
