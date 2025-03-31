import './globals.css';
import { Providers } from './providers';
import Header from './components/Header';

export const metadata = {
  title: 'Tier Master',
  description: '나만의 티어 랭킹을 만들고 공유하세요!',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <Providers> {/* ✅ 이제 여기서만 ThemeProvider, SessionProvider 적용 */}
          <Header />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}

//layout.tsx는 반드시 서버 컴포넌트여야 함 : 초기 HTML 렌더링 & SEO 

