import Nav from "@/components/Navbar/Nav";
import { Providers } from "../providers/providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <main>
          <Providers>
            <Nav />
            {children}
          </Providers>
        </main>
      </body>
    </html>
  );
}
