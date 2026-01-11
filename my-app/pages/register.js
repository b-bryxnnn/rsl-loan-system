import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { showLoading, showSuccess, showError, closeAlert } from '../utils/sweetAlert';
import { Eye, EyeOff, ShieldAlert, User, Home as HomeIcon } from 'lucide-react'; // เพิ่มไอคอน

// ⚠️ ใส่ URL ของพี่เอง
const API_URL = "https://script.google.com/macros/s/AKfycbxKYoYSaGP3sEvDwSPM6L2bWxI8BR82_7-IZDn-2soQdJAHdo2iCultXLkjFtTgK52glw/exec"; 

export default function Register() {
  const router = useRouter();
  // 🆕 เพิ่ม level (ชั้น) และ room (ห้อง)
  const [formData, setFormData] = useState({ fullname: '', email: '', password: '', confirmPassword: '', level: '4', room: '' });
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) { showError('รหัสผ่านไม่ตรงกัน', 'กรุณาตรวจสอบรหัสผ่านอีกครั้ง'); return; }
    
    showLoading('กำลังสร้างบัญชีผู้ใช้...');
    try {
      const response = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'register', ...formData }), });
      const result = await response.json();
      closeAlert();
      if (result.status === 'success') {
        showSuccess('ลงทะเบียนสำเร็จ', 'ระบบกำลังพาไปหน้ายืนยันตัวตน...');
        setTimeout(() => router.push(`/verify?email=${formData.email}`), 1500);
      } else { showError('ไม่สามารถสมัครได้', result.message); }
    } catch (error) { closeAlert(); showError('เชื่อมต่อไม่ได้', 'กรุณาตรวจสอบอินเทอร์เน็ตหรือ URL ของระบบ'); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[url('https://scontent.fbkk12-1.fna.fbcdn.net/v/t39.30808-6/466664401_988322433330506_2614708189359165683_n.jpg')] bg-cover bg-center relative overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-sm z-0"></div>
      <Link href="/" className="absolute top-0 left-0 w-full p-6 flex items-center gap-4 z-50 cursor-pointer group bg-gradient-to-b from-slate-900/90 to-transparent no-underline">
        <img src="https://upload.wikimedia.org/wikipedia/commons/9/9f/RSL001.png" alt="RSL Logo" className="w-12 h-12 drop-shadow-md transition-transform duration-300 group-hover:scale-110"/>
        <div className="flex flex-col"><span className="text-white text-lg font-medium tracking-wide drop-shadow-md group-hover:text-blue-200 transition-colors">โรงเรียนรัตนโกสินทร์สมโภชลาดกระบัง</span><span className="text-slate-300 text-xs font-light tracking-wider">ระบบส่งเอกสาร กยศ. ออนไลน์</span></div>
      </Link>

      <div className="relative z-10 bg-slate-800/40 backdrop-blur-md w-full max-w-md p-8 rounded-2xl border border-slate-600/50 shadow-2xl mt-16 animate-fade-in-up">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-light text-white tracking-wider mb-2">สร้างบัญชีใหม่</h2>
          <div className="h-1 w-20 bg-blue-500 mx-auto rounded-full opacity-80"></div>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-6 flex items-start gap-3">
            <ShieldAlert className="text-yellow-400 shrink-0" size={20} />
            <p className="text-xs text-yellow-200/90 leading-relaxed"><strong className="text-yellow-400 block mb-1">คำแนะนำ:</strong> กรุณาใช้ชื่อ-นามสกุลจริงภาษาไทย และระบุระดับชั้นให้ถูกต้องเพื่อผลประโยชน์ของท่าน</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="text-xs text-blue-200 mb-1 block uppercase tracking-wider font-semibold">ชื่อ-นามสกุล (ภาษาไทย)</label><input type="text" name="fullname" required placeholder="นายรักเรียน เพียรศึกษา" className="w-full px-4 py-2.5 rounded-lg text-sm bg-slate-900/60 border border-slate-600 focus:border-blue-400 text-white placeholder-slate-500 outline-none transition-all" onChange={handleChange}/></div>
          
          {/* 🆕 ส่วนเลือกระดับชั้นและห้อง */}
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="text-xs text-blue-200 mb-1 block uppercase tracking-wider font-semibold">ระดับชั้น</label>
                <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                    <select name="level" className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm bg-slate-900/60 border border-slate-600 focus:border-blue-400 text-white outline-none appearance-none" onChange={handleChange} value={formData.level}>
                        <option value="4">มัธยมศึกษาปีที่ 4</option>
                        <option value="5">มัธยมศึกษาปีที่ 5</option>
                        <option value="6">มัธยมศึกษาปีที่ 6</option>
                    </select>
                </div>
             </div>
             <div>
                <label className="text-xs text-blue-200 mb-1 block uppercase tracking-wider font-semibold">ห้อง</label>
                <div className="relative">
                    <HomeIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                    <input type="text" name="room" required placeholder="เช่น 2, 12" className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm bg-slate-900/60 border border-slate-600 focus:border-blue-400 text-white placeholder-slate-500 outline-none" onChange={handleChange}/>
                </div>
             </div>
          </div>

          <div><label className="text-xs text-blue-200 mb-1 block uppercase tracking-wider font-semibold">อีเมลโรงเรียน</label><input type="email" name="email" required placeholder="student@rsl.ac.th" className="w-full px-4 py-2.5 rounded-lg text-sm bg-slate-900/60 border border-slate-600 focus:border-blue-400 text-white placeholder-slate-500 outline-none transition-all" onChange={handleChange}/></div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-blue-200 mb-1 block uppercase tracking-wider font-semibold">รหัสผ่าน</label>
              <div className="relative">
                <input type={showPass ? "text" : "password"} name="password" required className="w-full px-4 py-2.5 rounded-lg text-sm bg-slate-900/60 border border-slate-600 focus:border-blue-400 text-white outline-none transition-all pr-8" onChange={handleChange}/>
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"><Eye size={14} /></button>
              </div>
            </div>
            <div>
              <label className="text-xs text-blue-200 mb-1 block uppercase tracking-wider font-semibold">ยืนยันรหัส</label>
              <div className="relative">
                <input type={showConfirmPass ? "text" : "password"} name="confirmPassword" required className="w-full px-4 py-2.5 rounded-lg text-sm bg-slate-900/60 border border-slate-600 focus:border-blue-400 text-white outline-none transition-all pr-8" onChange={handleChange}/>
                <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"><Eye size={14} /></button>
              </div>
            </div>
          </div>

          <button type="submit" className="btn-luxury-slide w-full py-3 mt-4 tracking-wide"><span>ลงทะเบียน</span></button>
        </form>

        <div className="mt-6 text-center pt-4 border-t border-slate-700/50">
          <p className="text-sm text-slate-400">มีบัญชีอยู่แล้ว? <Link href="/login" className="ml-2 text-blue-400 hover:text-blue-300 font-medium transition-colors">เข้าสู่ระบบ</Link></p>
        </div>
      </div>
    </div>
  );
}
export async function getServerSideProps(context) { return { props: {}, }; }