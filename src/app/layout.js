import './globals.css';
import Providers from '../components/Providers';
import Header from '../components/Header';

export const metadata = {
  title: 'CloudMart',
  description: 'CloudMart — microservices e-commerce demo',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Header />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
