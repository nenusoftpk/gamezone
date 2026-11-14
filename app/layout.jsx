import "./globals.css";
import { StoreProvider } from "@/lib/store";

export const metadata = { title: "Gaming Zone Manager", description: "PS5 station, wallet and session management" };
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body><StoreProvider>{children}</StoreProvider></body>
    </html>
  );
}
