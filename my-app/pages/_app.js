import '../styles/globals.css'; 
import dynamic from 'next/dynamic';

// ⚠️ ใส่ Site Key ของพี่ตรงนี้
const RECAPTCHA_SITE_KEY = "6LfH0kYsAAAAALoNfbljPSj9hjByQMhIv8uz7Muq"; 

// 🔥 เทคนิคสำคัญ: โหลด Provider แบบ Dynamic และปิด SSR (Server-Side Rendering)
// วิธีนี้จะทำให้มันไม่รันตอน Build (แก้ปัญหา Error 404/Prerender ได้ 100%)
const ClientGoogleReCaptchaProvider = dynamic(
  () => import('react-google-recaptcha-v3').then((mod) => mod.GoogleReCaptchaProvider),
  { ssr: false }
);

function MyApp({ Component, pageProps }) {
  return (
    <ClientGoogleReCaptchaProvider
      reCaptchaKey={RECAPTCHA_SITE_KEY}
      scriptProps={{
        async: false,
        defer: false,
        appendTo: "head",
        nonce: undefined,
      }}
    >
      <Component {...pageProps} />
    </ClientGoogleReCaptchaProvider>
  );
}

export default MyApp;