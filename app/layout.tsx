import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Control de Gastos',
  description: 'Control de Gastos',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ES-es" className="min-h-screen">
      <head>
        <title>Control de Gastos</title>
        <meta name="description" content="Control de Gastos" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="robots" content="noindex, nofollow" />
        <meta name="google" content="notranslate" />
        <style>{`
html {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
        `}</style>
      </head>
      <body className="min-h-screen bg-gradient-to-br from-[#17191D] to-[#121315]">{children}</body>
    </html>
  )
}
