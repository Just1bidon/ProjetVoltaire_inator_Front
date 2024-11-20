import "@/ui/globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="">
      <body className="">
        <main className="">{children}</main>
      </body>
    </html>
  );
}
