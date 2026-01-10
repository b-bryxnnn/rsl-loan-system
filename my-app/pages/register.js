import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { showLoading, showSuccess, showError, closeAlert } from '../utils/sweetAlert';

// ⚠️ อย่าลืมใส่ URL ที่ได้จากการ Deploy ล่าสุดตรงนี้นะครับ
const API_URL = "https://script.google.com/macros/s/AKfycbxKYoYSaGP3sEvDwSPM6L2bWxI8BR82_7-IZDn-2soQdJAHdo2iCultXLkjFtTgK52glw/exec"; 

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      showError('รหัสผ่านไม่ตรงกัน', 'กรุณาตรวจสอบรหัสผ่านอีกครั้ง');
      return;
    }

    showLoading('กำลังสร้างบัญชีผู้ใช้...');

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'register', ...formData }),
      });
      const result = await response.json();
      closeAlert();

      if (result.status === 'success') {
        showSuccess('ลงทะเบียนสำเร็จ', 'ระบบกำลังพาไปหน้ายืนยันตัวตน...');
        // ส่งไปหน้า Verify พร้อมอีเมล
        setTimeout(() => router.push(`/verify?email=${formData.email}`), 1500);
      } else {
        showError('ไม่สามารถสมัครได้', result.message);
      }
    } catch (error) {
      closeAlert();
      showError('เชื่อมต่อไม่ได้', 'กรุณาตรวจสอบอินเทอร์เน็ตหรือ URL ของระบบ');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[url('https://scontent.fbkk12-1.fna.fbcdn.net/v/t39.30808-6/466664401_988322433330506_2614708189359165683_n.jpg')] bg-cover bg-center relative overflow-hidden">
      
      {/* Layer สีดำโปร่งแสงทับพื้นหลัง */}
      <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-sm z-0"></div>

      {/* --- Header แถบชื่อโรงเรียน (กดแล้วกลับหน้าแรก) --- */}
      <Link href="/" className="absolute top-0 left-0 w-full p-6 flex items-center gap-4 z-50 cursor-pointer group bg-gradient-to-b from-slate-900/90 to-transparent no-underline">
        <img 
          src="https://upload.wikimedia.org/wikipedia/commons/9/9f/RSL001.png" 
          alt="RSL Logo" 
          className="w-12 h-12 drop-shadow-md transition-transform duration-300 group-hover:scale-110"
        />
        <div className="flex flex-col">
          <span className="text-white text-lg font-medium tracking-wide drop-shadow-md group-hover:text-blue-200 transition-colors">
            โรงเรียนรัตนโกสินทร์สมโภชลาดกระบัง
          </span>
          <span className="text-slate-300 text-xs font-light tracking-wider">
            ระบบส่งเอกสาร กยศ. ออนไลน์
          </span>
        </div>
      </Link>

      {/* Card Register */}
      <div className="relative z-10 bg-slate-800/40 backdrop-blur-md w-full max-w-md p-8 rounded-2xl border border-slate-600/50 shadow-2xl mt-16 animate-fade-in-up">
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-light text-white tracking-wider mb-2">สร้างบัญชีใหม่</h2>
          <div className="h-1 w-20 bg-blue-500 mx-auto rounded-full opacity-80"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs text-blue-200 mb-2 block uppercase tracking-wider font-semibold">ชื่อ-นามสกุล</label>
            <input
              type="text" name="fullname" required placeholder="นายรักเรียน เพียรศึกษา"
              className="w-full px-4 py-3 rounded-lg text-sm bg-slate-900/60 border border-slate-600 focus:border-blue-400 text-white placeholder-slate-500 outline-none transition-all"
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="text-xs text-blue-200 mb-2 block uppercase tracking-wider font-semibold">อีเมล</label>
            <input
              type="email" name="email" required placeholder="student@rsl.ac.th"
              className="w-full px-4 py-3 rounded-lg text-sm bg-slate-900/60 border border-slate-600 focus:border-blue-400 text-white placeholder-slate-500 outline-none transition-all"
              onChange={handleChange}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-blue-200 mb-2 block uppercase tracking-wider font-semibold">รหัสผ่าน</label>
              <input
                type="password" name="password" required
                className="w-full px-4 py-3 rounded-lg text-sm bg-slate-900/60 border border-slate-600 focus:border-blue-400 text-white outline-none transition-all"
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="text-xs text-blue-200 mb-2 block uppercase tracking-wider font-semibold">ยืนยันรหัส</label>
              <input
                type="password" name="confirmPassword" required
                className="w-full px-4 py-3 rounded-lg text-sm bg-slate-900/60 border border-slate-600 focus:border-blue-400 text-white outline-none transition-all"
                onChange={handleChange}
              />
            </div>
          </div>

         <button
  type="submit"
  className="btn-luxury-slide w-full py-3 mt-4 tracking-wide"
>
  {/* ต้องมี span ครอบตัวหนังสือเสมอ */}
  <span>ลงทะเบียน</span>
</button>
        </form>

        <div className="mt-8 text-center pt-6 border-t border-slate-700/50">
          <p className="text-sm text-slate-400">
            มีบัญชีอยู่แล้ว? 
            <Link href="/login" className="ml-2 text-blue-400 hover:text-blue-300 font-medium transition-colors">
              เข้าสู่ระบบ
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}