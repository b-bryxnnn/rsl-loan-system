import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { showLoading, showSuccess, showError, closeAlert } from '../utils/sweetAlert';

const API_URL = "https://script.google.com/macros/s/AKfycbxKYoYSaGP3sEvDwSPM6L2bWxI8BR82_7-IZDn-2soQdJAHdo2iCultXLkjFtTgK52glw/exec"; // URL เดียวกัน

export default function Verify() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');

  useEffect(() => {
    if (router.query.email) setEmail(router.query.email);
  }, [router.query]);

  const handleVerify = async (e) => {
    e.preventDefault();
    showLoading('กำลังตรวจสอบรหัส OTP...');
    
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'verifyOtp', email, otp })
      });
      const result = await res.json();
      closeAlert();

      if(result.status === 'success') {
        showSuccess('ยืนยันตัวตนสำเร็จ', 'ระบบกำลังพาไปหน้าเข้าสู่ระบบ');
        setTimeout(() => router.push('/login'), 2000);
      } else {
        showError('ไม่ถูกต้อง', result.message);
      }
    } catch(err) {
      closeAlert();
      showError('Error', 'เชื่อมต่อระบบไม่ได้');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <div className="glass-card p-8 rounded-xl w-full max-w-sm text-center">
        <h2 className="text-2xl mb-4">ยืนยันตัวตน</h2>
        <p className="text-slate-400 mb-6 text-sm">กรุณากรอกรหัส 6 หลักที่ได้รับทางอีเมล <br/> {email}</p>
        <form onSubmit={handleVerify}>
          <input 
            type="text" maxLength="6" 
            className="text-center text-3xl tracking-[10px] bg-transparent border-b-2 border-slate-600 focus:border-blue-500 outline-none w-full py-2 mb-8"
            value={otp} onChange={(e) => setOtp(e.target.value)}
          />
          <button type="submit" className="w-full bg-blue-600 py-3 rounded-lg hover:bg-blue-500">ยืนยัน</button>
        </form>
      </div>
    </div>
  );
}
// 🔥 แปะส่วนนี้ไว้บรรทัดสุดท้ายของไฟล์ เพื่อแก้ Error ตอน Build ครับ
export async function getServerSideProps(context) {
  return {
    props: {},
  };
}