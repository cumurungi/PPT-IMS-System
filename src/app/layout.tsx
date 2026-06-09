import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Integrated Management System",
  description: "IMS — Multi-department organizational management platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
