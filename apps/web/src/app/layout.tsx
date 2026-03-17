import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ErrorWatch - Error Monitoring",
  description: "Self-hosted error monitoring for modern applications",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
