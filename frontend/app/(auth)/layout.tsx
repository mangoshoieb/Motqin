import Nav from "@/components/Navbar/Nav";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <main>
          {/* <Nav/> */}
          {children}
        </main>
      </body>
    </html>
  );
}
