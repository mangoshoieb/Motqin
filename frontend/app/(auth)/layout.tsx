import InviterCodeCapture from "./InviterCodeCapture";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <InviterCodeCapture />
      {children}
    </>
  );
}
