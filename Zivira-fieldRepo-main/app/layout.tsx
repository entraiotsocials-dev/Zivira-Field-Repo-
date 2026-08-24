import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zivira Labs Field Force",
  description: "Mobile-first field force portal for Zivira Labs"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
