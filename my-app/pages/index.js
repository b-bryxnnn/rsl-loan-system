import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { showLoading, showSuccess, showError, closeAlert } from '../utils/sweetAlert';
import { scanBarcodesInPdf } from '../utils/pdfScanner';
import { Hourglass, UploadCloud, FileText, CheckCircle, AlertTriangle, LogIn, UserPlus, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

// ⚠️ URL นี้เป็นตัวที่น้องส่งมาล่าสุด (ถ้ามีการ Deploy ใหม่ อย่าลืมมาเปลี่ยนตรงนี้นะครับ)
const API_URL = "https://script.google.com/macros/s/AKfycbxKYoYSaGP3sEvDwSPM6L2bWxI8BR82_7-IZDn-2soQdJAHdo2iCultXLkjFtTgK52glw/exec";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  
  const [uploadType, setUploadType] = useState('contract'); 
  const [correctionType, setCorrectionType] = useState('contract'); 

  // --- 1. ตรวจสอบสถานะล็อกอิน ---
  useEffect(() => {
    const storedUser = localStorage.getItem('user_data');
    if (storedUser && storedUser !== "undefined" && storedUser !== "null") {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error("User data corrupted", error);
        localStorage.removeItem('user_data');
      }
    }
  }, []);

  // --- Component ย่อย: หน้าจอนาฬิกาทราย ---
  const LoadingOverlay = ({ message }) => (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-sm">
      <div className="text-blue-400 mb-6">
        <Hourglass size={64} className="hourglass-spin" />
      </div>
      <h3 className="text-2xl font-light text-white tracking-wide mb-2">ระบบกำลังตรวจสอบเอกสาร</h3>
      <p className="text-slate-400 text-sm animate-pulse">{message}</p>
    </div>
  );

  // --- 2. ฟังก์ชันอัปโหลด (ใส่ไส้ในกลับมาให้ครบแล้วครับ!) ---
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // ตรวจสอบเบื้องต้น
    if (file.type !== 'application/pdf') {
      showError('ไฟล์ผิดประเภท', 'กรุณาอัปโหลดไฟล์ PDF เท่านั้น');
      return;
    }
    if (file.size > 10 * 1024 * 1024) { 
      showError('ไฟล์ใหญ่เกินไป', 'ขนาดไฟล์ต้องไม่เกิน 10 MB');
      return;
    }

    setLoading(true);
    setLoadingMsg('กำลังอ่านข้อมูล PDF และตรวจสอบเงื่อนไข...');

    try {
      // กำหนดเงื่อนไขตามประเภทเอกสาร
      let currentType = uploadType;
      if (uploadType === 'correction') currentType = correctionType;

      const isContract = currentType === 'contract';
      const minPages = isContract ? 9 : 3;
      const pagesToCheck = isContract ? 7 : 1;
      const filePrefix = isContract ? 'C' : 'R';
      
      // ตรวจสอบชื่อไฟล์ (Regex)
      const regex = new RegExp(`^${filePrefix}\\d{3}\\s.+`, 'i');
      if (!regex.test(file.name)) {
        throw new Error(`ชื่อไฟล์ไม่ถูกต้อง! ต้องขึ้นต้นด้วย ${filePrefix} ตามด้วยเลข 3 หลัก เว้นวรรค และชื่อ-นามสกุล`);
      }

      setLoadingMsg(`กำลังสแกนบาร์โค้ด... กรุณารอสักครู่`);
      
      // เรียกใช้ฟังก์ชันสแกนบาร์โค้ด
      const scanResult = await scanBarcodesInPdf(file, pagesToCheck);

      // เช็คจำนวนหน้า
      if (scanResult.totalPages < minPages) {
        throw new Error(`เอกสารไม่ครบ! ต้องมีอย่างน้อย ${minPages} หน้า (ไฟล์นี้มี ${scanResult.totalPages} หน้า)`);
      }

      // เช็คผลบาร์โค้ด
      const missingPages = scanResult.results.filter(r => r.status !== 'found');
      if (missingPages.length > 0) {
        // const missingPageList = missingPages.map(r => r.page).join(', '); // ไม่ต้องโชว์เลขหน้าก็ได้ถ้ากลัวงง
        throw new Error(`บาร์โค้ดไม่ชัดเจนหรือไม่พบในเอกสารบางหน้า กรุณาสแกนใหม่ให้ชัดเจน`);
      }

      // ผ่านทุกด่าน -> เตรียมส่งข้อมูล
      setLoadingMsg('ตรวจสอบผ่านแล้ว! กำลังอัปโหลดเข้าสู่ระบบ...');
      
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = reader.result.split(',')[1];
        
        const payload = {
          action: 'uploadFile',
          email: user.email,
          fullname: user.fullname,
          fileBase64: base64,
          fileName: file.name,
          docType: isContract ? 'สัญญากู้ยืม' : 'แบบยืนยัน',
          isCorrection: uploadType === 'correction'
        };

        const res = await fetch(API_URL, {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        const result = await res.json();
        
        setLoading(false);
        if (result.status === 'success') {
          showSuccess('อัปโหลดสำเร็จ!', 'เอกสารของคุณถูกส่งเข้าสู่ระบบเรียบร้อยแล้ว');
        } else {
          showError('เกิดข้อผิดพลาด', result.message);
        }
      };

    } catch (error) {
      setLoading(false);
      showError('เอกสารมีปัญหา', error.message);
    }
  };

  const logout = () => {
    localStorage.removeItem('user_data');
    localStorage.removeItem('user_token');
    setUser(null);
    router.push('/');
  };

  // ==========================================
  // 🟢 ส่วนที่ 3: หน้า Landing Page (ถ้ายังไม่ Login)
  // ==========================================
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[url('https://scontent.fbkk12-1.fna.fbcdn.net/v/t39.30808-6/466664401_988322433330506_2614708189359165683_n.jpg')] bg-cover bg-center relative overflow-hidden">
        
        {/* Layer สีดำโปร่งแสง */}
        <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-sm z-0"></div>

        <div className="relative z-10 text-center animate-fade-in-up max-w-2xl px-6">
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/9/9f/RSL001.png" 
            alt="Logo" 
            className="w-32 h-32 mx-auto mb-6 drop-shadow-[0_0_25px_rgba(56,189,248,0.6)]"
          />
          
          <h1 className="text-4xl md:text-5xl font-semibold text-white mb-4 leading-tight">
            ระบบส่งเอกสาร กยศ. ออนไลน์
          </h1>
          <p className="text-lg text-slate-300 mb-10 font-light">
            โรงเรียนรัตนโกสินทร์สมโภชลาดกระบัง
            <br/>
            สะดวก รวดเร็ว ปลอดภัย ตรวจสอบสถานะได้ทันที
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full">
            <Link href="/login" className="w-full sm:w-auto">
              <button className="btn-luxury-slide w-full sm:w-48 py-4 px-6 flex items-center justify-center gap-2 group">
                <LogIn size={20} className="group-hover:translate-x-1 transition-transform" />
                <span>เข้าสู่ระบบ</span>
              </button>
            </Link>
            
            <Link href="/register" className="w-full sm:w-auto">
              <button className="bg-slate-800/80 hover:bg-slate-700 border border-slate-600 text-white w-full sm:w-48 py-4 px-6 rounded-lg backdrop-blur-md flex items-center justify-center gap-2 transition-all hover:scale-105">
                <UserPlus size={20} />
                <span>สมัครสมาชิก</span>
              </button>
            </Link>
          </div>
          
          <div className="mt-12 text-slate-500 text-xs font-light">
            &copy; 2026 Student Loan System. All rights reserved.
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 🔵 ส่วนที่ 4: หน้า Dashboard (ถ้า Login แล้ว)
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-900 text-white font-prompt pb-20">
      {loading && <LoadingOverlay message={loadingMsg} />}

      {/* Navbar */}
      <nav className="bg-slate-800/50 backdrop-blur-md border-b border-slate-700 p-4 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          {/* ลิงก์หน้าหลัก (กดแล้วไม่เด้งออก) */}
          <Link href="/" className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
             <img src="https://upload.wikimedia.org/wikipedia/commons/9/9f/RSL001.png" className="w-10 h-10" />
             <div>
               <h1 className="text-sm font-semibold text-blue-100">ระบบส่งเอกสาร กยศ.</h1>
               <p className="text-xs text-slate-400">โรงเรียนรัตนโกสินทร์สมโภชลาดกระบัง</p>
             </div>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-300 hidden md:block">ผู้ใช้: {user.fullname}</span>
            
            {/* 👑 ปุ่มแอดมิน: โชว์เฉพาะคนที่เป็น admin (ดูจาก user.role) */}
            {user.role === 'admin' && (
              <Link href="/admin">
                <button className="flex items-center gap-2 bg-yellow-500/10 text-yellow-400 text-sm hover:bg-yellow-500/20 px-3 py-1 rounded-full border border-yellow-500/20 transition-all">
                  <ShieldCheck size={16} />
                  <span className="hidden md:inline">เจ้าหน้าที่</span>
                </button>
              </Link>
            )}

            <button onClick={logout} className="text-red-400 text-sm hover:text-red-300 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20 transition-all hover:bg-red-500/20">
              ออกจากระบบ
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto mt-10 p-4">
        <div className="text-center mb-10 animate-fade-in-up">
          <h2 className="text-3xl font-light mb-2">ยินดีต้อนรับ, {user.fullname}</h2>
          <p className="text-slate-400">เลือกเมนูที่ต้องการดำเนินการ</p>
        </div>

        {/* เมนูเลือกประเภท */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button 
            onClick={() => setUploadType('contract')}
            className={`p-6 rounded-2xl border transition-all transform hover:-translate-y-1 ${uploadType === 'contract' ? 'bg-blue-600 border-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}
          >
            <FileText size={32} className="mb-4 mx-auto text-white" />
            <h3 className="text-lg font-medium text-white">1. สัญญากู้ยืมเงิน</h3>
            <p className="text-xs text-blue-200 mt-2 opacity-80">ไฟล์ Cxxx... (9 หน้า+)</p>
          </button>

          <button 
            onClick={() => setUploadType('confirm')}
            className={`p-6 rounded-2xl border transition-all transform hover:-translate-y-1 ${uploadType === 'confirm' ? 'bg-indigo-600 border-indigo-400 shadow-[0_0_20px_rgba(79,70,229,0.4)]' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}
          >
            <CheckCircle size={32} className="mb-4 mx-auto text-white" />
            <h3 className="text-lg font-medium text-white">2. แบบยืนยันการกู้ยืม</h3>
            <p className="text-xs text-indigo-200 mt-2 opacity-80">ไฟล์ Rxxx... (3 หน้า+)</p>
          </button>

          <button 
            onClick={() => setUploadType('correction')}
            className={`p-6 rounded-2xl border transition-all transform hover:-translate-y-1 ${uploadType === 'correction' ? 'bg-orange-600 border-orange-400 shadow-[0_0_20px_rgba(234,88,12,0.4)]' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}
          >
            <AlertTriangle size={32} className="mb-4 mx-auto text-white" />
            <h3 className="text-lg font-medium text-white">3. ส่งเอกสารแก้ไข</h3>
            <p className="text-xs text-orange-200 mt-2 opacity-80">จากไลน์/ส่วนกลางตีกลับ</p>
          </button>
        </div>

        {/* พื้นที่อัปโหลด */}
        <div className="bg-slate-800/40 border border-slate-700 rounded-3xl p-8 backdrop-blur-sm animate-fade-in-up">
          <div className="flex flex-col items-center">
            
            {uploadType === 'correction' && (
              <div className="mb-6 w-full max-w-lg animate-fade-in-up text-center">
                 {/* ⚠️ กล่องเตือนสีแดง สำหรับกลุ่ม 3 */}
                 <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl mb-6 text-sm text-red-200 text-left">
                    <div className="flex items-center gap-2 mb-2 font-bold text-red-400">
                        <AlertTriangle size={18} />
                        <span>คำเตือนสำคัญ</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 opacity-90">
                        <li>เมนูนี้สำหรับผู้ที่ <b>เจ้าหน้าที่แจ้งชื่อให้แก้ไข</b> ทางไลน์/อีเมล เท่านั้น</li>
                        <li>หากถูกระบบปฏิเสธทันที ให้กลับไปส่งใน <b>กลุ่มที่ 1 หรือ 2</b> ใหม่</li>
                    </ul>
                 </div>

                <label className="text-sm text-slate-300 mb-2 block text-left">เลือกประเภทเอกสารที่แก้ไข:</label>
                <select 
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white focus:border-blue-500 outline-none"
                  value={correctionType}
                  onChange={(e) => setCorrectionType(e.target.value)}
                >
                  <option value="contract">สัญญากู้ยืม</option>
                  <option value="confirm">แบบยืนยัน</option>
                </select>
              </div>
            )}

            <div className="w-full max-w-lg border-2 border-dashed border-slate-600 rounded-2xl p-10 text-center hover:border-blue-500 hover:bg-slate-800/50 transition-all cursor-pointer relative group">
              <input 
                type="file" 
                accept="application/pdf"
                onChange={handleFileUpload} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <UploadCloud size={48} className="mx-auto text-slate-500 group-hover:text-blue-400 transition-colors mb-4 transform group-hover:scale-110 duration-300" />
              <h3 className="text-xl font-medium text-white mb-2 group-hover:text-blue-200">คลิกเพื่อเลือกไฟล์ PDF</h3>
              <p className="text-sm text-slate-400">ขนาดไม่เกิน 10 MB</p>
              
              <div className="mt-6 text-xs text-slate-500 bg-slate-900/50 p-3 rounded-lg text-left space-y-1">
                <p>✅ <b>ชื่อไฟล์:</b> {uploadType === 'contract' || (uploadType === 'correction' && correctionType === 'contract') ? 'Cxxx...' : 'Rxxx...'} ตามด้วยเลข 3 หลัก</p>
                <p>✅ <b>การตรวจสอบ:</b> ระบบจะสแกนบาร์โค้ดอัตโนมัติ</p>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}