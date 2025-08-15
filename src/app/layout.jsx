import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/providers/SessionProvider";
import QueryProvider from "@/components/providers/QueryClientProvider";
import AppInitializer from "@/components/system/AppInitializer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Work Management System",
  description: "Manage work orders, invoices, and reports efficiently",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <AuthProvider>
            <AppInitializer />
            {children}
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
