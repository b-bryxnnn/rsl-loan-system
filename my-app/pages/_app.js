import '../styles/globals.css'; // หรือ import styles ของน้อง
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";

// ⚠️ ใส่ Site Key ที่ได้จาก Google ตรงนี้
const RECAPTCHA_SITE_KEY = "6LfH0kYsAAAAALoNfbljPSj9hjByQMhIv8uz7Muq"; 

function MyApp({ Component, pageProps }) {
  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={RECAPTCHA_SITE_KEY}
      scriptProps={{
        async: false,
        defer: false,
        appendTo: "head",
        nonce: undefined,
      }}
    >
      <Component {...pageProps} />
    </GoogleReCaptchaProvider>
  );
}

export default MyApp;