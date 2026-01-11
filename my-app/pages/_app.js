import '../styles/globals.css';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

const RECAPTCHA_SITE_KEY = "6LfH0kYsAAAAALoNfbljPSj9hjByQMhIv8uz7Muq"; 

const ClientGoogleReCaptchaProvider = dynamic(
  () => import('react-google-recaptcha-v3').then((mod) => mod.GoogleReCaptchaProvider),
  { ssr: false }
);

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const handleStart = () => setIsTransitioning(true);
    const handleComplete = () => {
       // รอให้ Animation ปาดจอให้เสร็จก่อนค่อยเอาออก (ตั้งเวลาให้ match กับ CSS animation)
       setTimeout(() => setIsTransitioning(false), 800); 
    };

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router]);

  return (
    <>
      {/* 🔥 ตัวปาดหน้าจอ Luxury */}
      {isTransitioning && <div className="page-transition-enter page-transition-active"></div>}

      <ClientGoogleReCaptchaProvider
        reCaptchaKey={RECAPTCHA_SITE_KEY}
        scriptProps={{ async: false, defer: false, appendTo: "head", nonce: undefined }}
      >
        <Component {...pageProps} />
      </ClientGoogleReCaptchaProvider>
    </>
  );
}

export default MyApp;