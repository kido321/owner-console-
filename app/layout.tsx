// app/layout.tsx
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css"; // <-- make sure this line exists

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="min-h-screen">{children}</body>
      </html>
    </ClerkProvider>
  );
}
