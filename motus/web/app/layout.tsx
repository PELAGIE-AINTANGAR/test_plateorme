export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <title>Motus</title>
        <link rel="stylesheet" href="/app/globals.css" />
      </head>
      <body className="min-h-screen">
        <div className="max-w-3xl mx-auto p-6">{children}</div>
      </body>
    </html>
  );
}
