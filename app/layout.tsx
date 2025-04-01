import './globals.css';
import { Providers } from './providers';
import Header from './components/Header';
import SideAdBanner from '@/components/SideAdBanner';


// export const metadata = {
//   title: 'Tier Master',
//   description: '나만의 티어 랭킹을 만들고 공유하세요!',
//};

// app/layout.tsx 또는 각 페이지의 metadata 객체 사용
export const metadata = {
  title: 'Tier Master - 투표 기반 티어 랭킹 서비스',
  description: '사람들이 좋아하는 것을 추천하고, 인기순으로 티어를 만드는 투표 기반 랭킹 서비스',
  keywords: '티어, 랭킹, 투표, 추천',
  openGraph: {
    title: 'Tier Master - 투표 기반 티어 랭킹 서비스',
    description: '사람들이 좋아하는 것을 추천하고, 인기순으로 티어를 만드는 투표 기반 랭킹 서비스',
    images: ['/images/og-image.png'],
    url: 'https://tiermaster.vercel.app/',
    siteName: 'Tier Master',
    type: 'website',
  },
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1676764275607571"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <Providers> {/* ✅ 이제 여기서만 ThemeProvider, SessionProvider 적용 */}
          <Header />
          <main>{children}</main>
          <SideAdBanner />
        </Providers>
      </body>
    </html>
  );
}

//layout.tsx는 반드시 서버 컴포넌트여야 함 : 초기 HTML 렌더링 & SEO 

