import './globals.css';

export const metadata = {
  title: 'CloudMart',
  description: 'CloudMart — microservices e-commerce demo',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header>
          <nav>
            <a href="/">CloudMart</a>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
