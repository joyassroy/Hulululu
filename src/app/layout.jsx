import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider"; // আমাদের AuthProvider ইমপোর্ট করলাম

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Hulululu - Realtime Chat",
  description: "A lag-free realtime chat application",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* AuthProvider দিয়ে পুরো অ্যাপ মুড়িয়ে দিলাম */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}