import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { showLoading, showSuccess, showError, closeAlert } from '../utils/sweetAlert';
import { Eye, EyeOff } from 'lucide-react';

// ⚠️ ใส่ URL ของพี่เอง
const API_URL = "https://script.google.com/macros/s/AKfycbxKYoYSaGP3sEvDwSPM6L2bWxI8BR82_7-IZDn-2soQdJAHdo2iCultXLkjFtTgK52glw/exec"; 

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    showLoading('กำลังเข้าสู่ระบบอย่างปลอดภัย...');

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'login', ...formData })
      });
      const result = await res.json();
      closeAlert();

      if (result.status === 'success') {
        localStorage.setItem('user_token', result.token);
        localStorage.setItem('user_data', JSON.stringify(result.user));
        showSuccess('ยินดีต้อนรับ', `คุณ ${result.user.fullname}`);
        router.push('/');
      } else {
        showError('เข้าสู่ระบบไม่สำเร็จ', result.message);
      }
    } catch (error) {
      closeAlert();
      showError('เชื่อมต่อไม่ได้', 'กรุณาตรวจสอบอินเทอร์เน็ตหรือ URL ของระบบ');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[url('https://scontent.fbkk12-1.fna.fbcdn.net/v/t39.30808-6/466664401_988322433330506_2614708189359165683_n.jpg')] bg-cover bg-center relative overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-sm z-0"></div>

      <Link href="/" className="absolute top-0 left-0 w-full p-6 flex items-center gap-4 z-50 cursor-pointer group bg-gradient-to-b from-slate-900/90 to-transparent no-underline">
        <img src="https://upload.wikimedia.org/wikipedia/commons/9/9f/RSL001.png" alt="RSL Logo" className="w-12 h-12 drop-shadow-md transition-transform duration-300 group-hover:scale-110"/>
        <div className="flex flex-col">
          <span className="text-white text-lg font-medium tracking-wide drop-shadow-md group-hover:text-blue-200 transition-colors">โรงเรียนรัตนโกสินทร์สมโภชลาดกระบัง</span>
          <span className="text-slate-300 text-xs font-light tracking-wider">ระบบส่งเอกสาร กยศ. ออนไลน์</span>
        </div>
      </Link>

      <div className="relative z-10 bg-slate-800/40 backdrop-blur-md w-full max-w-md p-8 rounded-2xl border border-slate-600/50 shadow-2xl mt-16 animate-fade-in-up">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-light text-white tracking-wider mb-2">เข้าสู่ระบบ</h2>
          <div className="h-1 w-20 bg-blue-500 mx-auto rounded-full opacity-80"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-xs text-blue-200 mb-2 block uppercase tracking-wider font-semibold">อีเมล</label>
            <input type="email" name="email" required placeholder="example@rsl.ac.th" className="w-full px-4 py-3 rounded-lg text-sm bg-slate-900/60 border border-slate-600 focus:border-blue-400 text-white placeholder-slate-500 outline-none transition-all" onChange={handleChange}/>
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs text-blue-200 uppercase tracking-wider font-semibold">รหัสผ่าน</label>
              {/* 🔥 ลิงก์ตรงไปหน้า forgot-password */}
              <Link href="/forgot-password">
                <span className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors cursor-pointer">
                  ลืมรหัสผ่าน?
                </span>
              </Link>
            </div>
            
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password" required placeholder="••••••••"
                className="w-full px-4 py-3 rounded-lg text-sm bg-slate-900/60 border border-slate-600 focus:border-blue-400 text-white placeholder-slate-500 outline-none transition-all pr-10"
                onChange={handleChange}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-luxury-slide w-full py-3 mt-4 tracking-wide">
            <span>เข้าสู่ระบบ</span>
          </button>
        </form>

        <div className="mt-8 text-center pt-6 border-t border-slate-700/50">
          <p className="text-sm text-slate-400">ยังไม่มีบัญชีใช่ไหม? <Link href="/register" className="ml-2 text-blue-400 hover:text-blue-300 font-medium transition-colors">สร้างบัญชีใหม่</Link></p>
        </div>
      </div>
    </div>
  );
}

// 🔥 FIX SSR (ห้ามลบ)
export async function getServerSideProps(context) { return { props: {}, }; }