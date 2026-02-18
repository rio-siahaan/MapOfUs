import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import "./animations.css";

const poppins = Poppins({
  subsets: ['latin'],
  display: 'swap', // 'swap' ensures text is visible while the font loads
  variable: '--font-poppins', // Assign a CSS variable
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'], // Specify desired weights
});

export const metadata: Metadata = {
  title: "Map of Us",
  description: "A map for our memory.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
