import { useState } from 'react';
import { useRouter } from 'next/router';
import Swal from 'sweetalert2';
import { showLoading, showSuccess, showError, closeAlert } from '../utils/sweetAlert';
import { Mail, Key, ArrowRight, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

const API_URL = "https://script.google.com/macros/s/AKfycbxKYoYSaGP3sEvDwSPM6L2bWxI8BR82_7-IZDn-2soQdJAHdo2iCultXLkjFtTgK52glw/exec";

export default function ForgotPassword() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1=กรอกเมล, 2=กรอก OTP
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // ส่งอีเมลขอ OTP
  const requestOtp = async (e) => {
    e.preventDefault();
    if(!email) return;
    showLoading('กำลังตรวจสอบอีเมลและส่ง OTP...');
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        // ต้องตรงกับใน Code.gs
        body: JSON.stringify({ action: 'requestPasswordReset', email })
      });
      const result = await res.json();
      closeAlert();
      
      if(result.status === 'success') {
        // 🔥 สำคัญ: เปลี่ยนหน้าเป็น Step 2 ทันทีที่ส่งสำเร็จ
        setStep(2);
        showSuccess('ส่ง OTP แล้ว', 'กรุณาตรวจสอบรหัส OTP ในอีเมลของคุณ แล้วนำมากรอกช่องด้านล่าง');
      } else {
        showError('ไม่พบข้อมูล', result.message);
      }
    } catch(err) { showError('System Error', err.message); }
  };

  // เปลี่ยนรหัสผ่าน
  const resetPass = async (e) => {
    e.preventDefault();
    if(!otp || !newPassword) return;
    showLoading('กำลังบันทึกรหัสผ่านใหม่...');
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'resetPassword', email, otp, newPassword })
      });
      const result = await res.json();
      closeAlert();
      
      if(result.status === 'success') {
        await Swal.fire({ title: 'สำเร็จ!', text: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว กรุณาเข้าสู่ระบบใหม่', icon: 'success', confirmButtonText: 'ไปหน้าเข้าสู่ระบบ', confirmButtonColor: '#2563eb'});
        router.push('/login');
      } else {
        showError('ผิดพลาด', result.message);
      }
    } catch(err) { showError('System Error', err.message); }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-prompt">
      <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 w-full max-w-md shadow-2xl relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl"></div>

        <h2 className="text-2xl font-bold text-white mb-2 text-center">กู้คืนรหัสผ่าน</h2>
        <p className="text-slate-400 text-center text-sm mb-6">ระบบส่งเอกสาร กยศ.</p>
        
        {step === 1 ? (
          // --- Step 1: กรอกอีเมล ---
          <form onSubmit={requestOtp} className="space-y-4 relative z-10 animate-fade-in-up">
            <div>
              <label className="text-slate-400 text-sm">อีเมลที่ใช้ลงทะเบียน</label>
              <div className="flex items-center bg-slate-900 border border-slate-600 rounded-lg px-3 mt-1 focus-within:border-blue-500 transition-colors">
                <Mail size={20} className="text-slate-500" />
                <input type="email" required className="bg-transparent w-full p-3 text-white outline-none placeholder-slate-600" placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>
            <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-500/30 transition-all transform hover:scale-[1.02] flex justify-center items-center gap-2">
              <span>ส่งรหัส OTP</span> <ArrowRight size={18}/>
            </button>
          </form>
        ) : (
          // --- Step 2: กรอก OTP + รหัสใหม่ ---
          <form onSubmit={resetPass} className="space-y-4 relative z-10 animate-fade-in-up">
            <div className="text-center bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4">
              <p className="text-xs text-blue-200">OTP ถูกส่งไปที่:</p>
              <p className="text-sm font-bold text-white mt-1">{email}</p>
              <button type="button" onClick={() => setStep(1)} className="text-xs text-slate-400 underline mt-2 hover:text-white">แก้ไขอีเมล</button>
            </div>
            
            <div>
              <label className="text-slate-400 text-sm">รหัส OTP (6 หลัก)</label>
              <input type="text" required className="bg-slate-900 border border-slate-600 rounded-lg w-full p-3 text-white text-center text-xl tracking-[0.5em] font-bold mt-1 focus:border-blue-500 outline-none" maxLength={6} value={otp} onChange={e => setOtp(e.target.value)} placeholder="XXXXXX" />
            </div>
            
            <div>
              <label className="text-slate-400 text-sm">ตั้งรหัสผ่านใหม่</label>
              <div className="flex items-center bg-slate-900 border border-slate-600 rounded-lg px-3 mt-1 focus-within:border-blue-500 transition-colors relative">
                <Key size={20} className="text-slate-500 shrink-0" />
                <input type={showPassword ? "text" : "password"} required className="bg-transparent w-full p-3 text-white outline-none pr-8" placeholder="กรอกรหัสผ่านใหม่" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 text-slate-400 hover:text-white"><Eye size={18} /></button>
              </div>
            </div>
            
            <button className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-green-500/30 transition-all transform hover:scale-[1.02]">
              ยืนยันการเปลี่ยนรหัส
            </button>
          </form>
        )}
        
        <div className="text-center mt-6 pt-4 border-t border-slate-700">
           <Link href="/login" className="text-slate-400 hover:text-white text-sm transition-colors">กลับไปหน้าเข้าสู่ระบบ</Link>
        </div>
      </div>
    </div>
  );
}

// 🔥 FIX SSR
export async function getServerSideProps(context) { return { props: {}, }; }