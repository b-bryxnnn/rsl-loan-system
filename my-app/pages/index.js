import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Swal from 'sweetalert2';
import { useGoogleReCaptcha } from "react-google-recaptcha-v3"; // 🆕 Import
import { showLoading, showSuccess, showError, closeAlert } from '../utils/sweetAlert';
import { scanBarcodesInPdf } from '../utils/pdfScanner';
import { Hourglass, UploadCloud, FileText, CheckCircle, AlertTriangle, LogIn, UserPlus, ShieldCheck, Eye } from 'lucide-react';
import Link from 'next/link';

// ⚠️ URL GAS ของน้อง
const API_URL = "https://script.google.com/macros/s/AKfycbxKYoYSaGP3sEvDwSPM6L2bWxI8BR82_7-IZDn-2soQdJAHdo2iCultXLkjFtTgK52glw/exec";

export default function Home() {
  const router = useRouter();
  const { executeRecaptcha } = useGoogleReCaptcha(); // 🆕 Hook
  const [user, setUser] = useState(null);
  const [myDocs, setMyDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  
  const [uploadType, setUploadType] = useState('contract'); 
  const [correctionType, setCorrectionType] = useState('contract');
  const [scanFailedCount, setScanFailedCount] = useState(0); 

  useEffect(() => {
    const storedUser = localStorage.getItem('user_data');
    if (storedUser && storedUser !== "undefined" && storedUser !== "null") {
      try {
        const u = JSON.parse(storedUser);
        setUser(u);
        fetchUserDocs(u.email);
      } catch (error) {
        localStorage.removeItem('user_data');
      }
    }
  }, []);

  const fetchUserDocs = async (email) => {
    try {
      const res = await fetch(API_URL, { 
        method: 'POST', 
        body: JSON.stringify({ action: 'getUserDocuments', email }) 
      });
      const result = await res.json();
      if(result.status === 'success') {
        setMyDocs(result.data);
      }
    } catch(e) { console.error(e); }
  };

  const LoadingOverlay = ({ message }) => (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-sm">
      <div className="text-blue-400 mb-6"><Hourglass size={64} className="hourglass-spin" /></div>
      <h3 className="text-2xl font-light text-white tracking-wide mb-2">ระบบกำลังทำงาน</h3>
      <p className="text-slate-400 text-sm animate-pulse">{message}</p>
    </div>
  );

  const logout = () => {
    localStorage.removeItem('user_data');
    localStorage.removeItem('user_token');
    setUser(null);
    router.push('/');
  };

  const handleFileUpload = async (e, skipScan = false) => {
    const file = e.target.files[0];
    if (!file) return;

    // 🆕 ตรวจสอบว่า reCAPTCHA พร้อมใช้งานไหม
    if (!executeRecaptcha) {
      showError('ระบบตรวจสอบบอทยังไม่พร้อม', 'กรุณารีเฟรชหน้าเว็บแล้วลองใหม่');
      return;
    }

    if (file.type !== 'application/pdf') {
      showError('ไฟล์ผิดประเภท', 'กรุณาอัปโหลดไฟล์ PDF เท่านั้น');
      return;
    }
    if (file.size > 10 * 1024 * 1024) { 
      showError('ไฟล์ใหญ่เกินไป', 'ขนาดไฟล์ต้องไม่เกิน 10 MB');
      return;
    }

    setLoading(true);
    setLoadingMsg('กำลังตรวจสอบไฟล์...');

    try {
      let currentType = uploadType;
      if (uploadType === 'correction') currentType = correctionType;

      const isContract = currentType === 'contract';
      const minPages = isContract ? 9 : 3;
      const pagesToCheck = isContract ? 7 : 1;
      const filePrefix = isContract ? 'C' : 'R';
      
      const regex = new RegExp(`^${filePrefix}\\d{3}\\s.+`, 'i');
      if (!regex.test(file.name)) {
        throw new Error(`ชื่อไฟล์ไม่ถูกต้อง! ต้องขึ้นต้นด้วย ${filePrefix} ตามด้วยเลข 3 หลัก เว้นวรรค และชื่อ-นามสกุล`);
      }

      if (!skipScan) {
        setLoadingMsg(`กำลังสแกนบาร์โค้ด...`);
        try {
          const scanResult = await scanBarcodesInPdf(file, pagesToCheck);
          if (scanResult.totalPages < minPages) throw new Error(`เอกสารไม่ครบ! ต้องมีอย่างน้อย ${minPages} หน้า`);
          const found = scanResult.results.some(r => r.status === 'found');
          if (!found) throw new Error('ไม่พบบาร์โค้ดในหน้าที่กำหนด หรือบาร์โค้ดไม่ชัดเจน');
        } catch (scanErr) {
           setScanFailedCount(prev => prev + 1);
           throw new Error(scanErr.message);
        }
      }

      setLoadingMsg('ตรวจสอบผ่านแล้ว! กำลังส่งข้อมูล...');
      
      // 🆕 สร้าง Token v3
      const token = await executeRecaptcha("uploadFile");

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
          isCorrection: uploadType === 'correction',
          captchaToken: token // 🆕 ส่ง Token ไปหลังบ้าน
        };

        const res = await fetch(API_URL, {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        const result = await res.json();
        
        setLoading(false);
        if (result.status === 'success') {
          showSuccess('สำเร็จ!', 'ส่งเอกสารเข้าสู่ระบบเรียบร้อยแล้ว');
          fetchUserDocs(user.email);
          setScanFailedCount(0);
          e.target.value = '';
        } else {
          showError('เกิดข้อผิดพลาด', result.message);
        }
      };

    } catch (error) {
      setLoading(false);
      if (scanFailedCount >= 0) {
         Swal.fire({
           title: 'สแกนบาร์โค้ดไม่ผ่าน',
           html: `<p class="text-red-400 mb-2">${error.message}</p>
                  <p class="text-sm text-slate-300">หากมั่นใจว่าไฟล์ถูกต้อง สามารถข้ามการตรวจได้</p>`,
           icon: 'warning',
           background: '#1e293b',
           color: '#fff',
           showCancelButton: true,
           confirmButtonText: 'ยืนยันส่ง (ข้ามการตรวจ)',
           confirmButtonColor: '#eab308',
           cancelButtonText: 'ยกเลิก',
         }).then((res) => {
           if(res.isConfirmed) {
             handleFileUpload(e, true); 
           } else {
             e.target.value = '';
           }
         });
      } else {
         showError('เอกสารมีปัญหา', error.message);
      }
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[url('https://scontent.fbkk12-1.fna.fbcdn.net/v/t39.30808-6/466664401_988322433330506_2614708189359165683_n.jpg')] bg-cover bg-center relative overflow-hidden">
        <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-sm z-0"></div>
        <div className="relative z-10 text-center animate-fade-in-up max-w-2xl px-6">
          <img src="https://upload.wikimedia.org/wikipedia/commons/9/9f/RSL001.png" alt="Logo" className="w-32 h-32 mx-auto mb-6 drop-shadow-[0_0_25px_rgba(56,189,248,0.6)]" />
          <h1 className="text-4xl md:text-5xl font-semibold text-white mb-4 leading-tight">ระบบส่งเอกสาร กยศ. ออนไลน์</h1>
          <p className="text-lg text-slate-300 mb-10 font-light">โรงเรียนรัตนโกสินทร์สมโภชลาดกระบัง</p>
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
          <div className="mt-12 text-slate-500 text-xs font-light">&copy; 2026 Student Loan System. All rights reserved.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white font-prompt pb-20">
      {loading && <LoadingOverlay message={loadingMsg} />}
      <nav className="bg-slate-800/50 backdrop-blur-md border-b border-slate-700 p-4 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
             <img src="https://upload.wikimedia.org/wikipedia/commons/9/9f/RSL001.png" className="w-10 h-10" />
             <div>
               <h1 className="text-sm font-semibold text-blue-100">ระบบส่งเอกสาร กยศ.</h1>
               <p className="text-xs text-slate-400">โรงเรียนรัตนโกสินทร์สมโภชลาดกระบัง</p>
             </div>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-300 hidden md:block">ผู้ใช้: {user.fullname}</span>
            {user.role === 'admin' && (
              <Link href="/admin">
                <button className="flex items-center gap-2 bg-yellow-500/10 text-yellow-400 text-sm hover:bg-yellow-500/20 px-3 py-1 rounded-full border border-yellow-500/20 transition-all">
                  <ShieldCheck size={16} />
                  <span className="hidden md:inline">เจ้าหน้าที่</span>
                </button>
              </Link>
            )}
            <button onClick={logout} className="text-red-400 text-sm hover:text-red-300 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20 transition-all hover:bg-red-500/20">ออกจากระบบ</button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto mt-10 p-4">
        <div className="text-center mb-10 animate-fade-in-up">
          <h2 className="text-3xl font-light mb-2">ยินดีต้อนรับ, {user.fullname}</h2>
          <p className="text-slate-400">เลือกเมนูที่ต้องการดำเนินการ</p>
        </div>

        <div className="bg-slate-800/60 rounded-xl p-6 mb-8 border border-slate-700 animate-fade-in-up">
           <h3 className="text-xl mb-4 flex items-center gap-2 text-blue-300"><Eye className="text-blue-400"/> ประวัติการส่งเอกสาร</h3>
           <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
             {myDocs.length === 0 ? (
               <div className="text-slate-500 text-center py-4 bg-slate-900/30 rounded-lg">ยังไม่มีประวัติการส่งเอกสาร</div>
             ) : (
               myDocs.map((doc, i) => (
                 <div key={i} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-900/50 p-4 rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors">
                    <div className="mb-2 sm:mb-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${doc.docType.includes('สัญญา') ? 'text-blue-200' : 'text-indigo-200'}`}>{doc.docType}</span>
                        {doc.status === 'Replaced' && <span className="text-[10px] bg-slate-700 text-slate-400 px-1 rounded">ถูกแทนที่</span>}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">ส่งเมื่อ: {new Date(doc.timestamp).toLocaleString('th-TH')}</p>
                      {doc.status === 'Rejected' && <p className="text-xs text-red-300 mt-1 bg-red-500/10 p-1 rounded inline-block border border-red-500/20">❌ เหตุผล: {doc.reason}</p>}
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      doc.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                      doc.status === 'Approved' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                      doc.status === 'Replaced' ? 'bg-slate-700/50 text-slate-400 border-slate-600' :
                      'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {doc.status === 'Pending' ? 'รอตรวจสอบ' : doc.status === 'Approved' ? 'ผ่านแล้ว' : doc.status === 'Replaced' ? 'ถูกแทนที่' : 'ต้องแก้ไข'}
                    </div>
                 </div>
               ))
             )}
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button onClick={() => setUploadType('contract')} className={`p-6 rounded-2xl border transition-all transform hover:-translate-y-1 ${uploadType === 'contract' ? 'bg-blue-600 border-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}>
            <FileText size={32} className="mb-4 mx-auto text-white" />
            <h3 className="text-lg font-medium text-white">1. สัญญากู้ยืมเงิน</h3>
            <p className="text-xs text-blue-200 mt-2 opacity-80">ไฟล์ Cxxx... (9 หน้า+)</p>
          </button>
          <button onClick={() => setUploadType('confirm')} className={`p-6 rounded-2xl border transition-all transform hover:-translate-y-1 ${uploadType === 'confirm' ? 'bg-indigo-600 border-indigo-400 shadow-[0_0_20px_rgba(79,70,229,0.4)]' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}>
            <CheckCircle size={32} className="mb-4 mx-auto text-white" />
            <h3 className="text-lg font-medium text-white">2. แบบยืนยันการกู้ยืม</h3>
            <p className="text-xs text-indigo-200 mt-2 opacity-80">ไฟล์ Rxxx... (3 หน้า+)</p>
          </button>
          <button onClick={() => setUploadType('correction')} className={`p-6 rounded-2xl border transition-all transform hover:-translate-y-1 ${uploadType === 'correction' ? 'bg-orange-600 border-orange-400 shadow-[0_0_20px_rgba(234,88,12,0.4)]' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}>
            <AlertTriangle size={32} className="mb-4 mx-auto text-white" />
            <h3 className="text-lg font-medium text-white">3. ส่งเอกสารแก้ไข</h3>
            <p className="text-xs text-orange-200 mt-2 opacity-80">เฉพาะที่ถูกตีกลับ</p>
          </button>
        </div>

        <div className="bg-slate-800/40 border border-slate-700 rounded-3xl p-8 backdrop-blur-sm animate-fade-in-up">
           {uploadType === 'correction' && (
              <div className="mb-6 w-full max-w-lg mx-auto text-center">
                 <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl mb-6 text-sm text-red-200 text-left">
                    <div className="flex items-center gap-2 mb-2 font-bold text-red-400">
                        <AlertTriangle size={18} />
                        <span>คำเตือนสำคัญ</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 opacity-90">
                        <li>ใช้เมนูนี้เฉพาะ <b>เอกสารที่ถูกตีกลับ</b> (สถานะสีแดง) เท่านั้น</li>
                        <li>หากส่งเข้ามา ระบบจะไปเปลี่ยนสถานะเอกสารเก่าให้เป็น "ถูกแทนที่" อัตโนมัติ</li>
                    </ul>
                 </div>
                <label className="text-sm text-slate-300 mb-2 block text-left">เลือกประเภทเอกสารที่แก้ไข:</label>
                <select className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white focus:border-blue-500 outline-none" value={correctionType} onChange={(e) => setCorrectionType(e.target.value)}>
                  <option value="contract">สัญญากู้ยืม</option>
                  <option value="confirm">แบบยืนยัน</option>
                </select>
              </div>
           )}

           <div className="w-full max-w-lg mx-auto border-2 border-dashed border-slate-600 rounded-2xl p-10 text-center hover:border-blue-500 hover:bg-slate-800/50 transition-all cursor-pointer relative group">
              <input type="file" accept="application/pdf" onChange={(e) => handleFileUpload(e, false)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              <UploadCloud size={48} className="mx-auto text-slate-500 group-hover:text-blue-400 transition-colors mb-4 transform group-hover:scale-110 duration-300" />
              <h3 className="text-xl font-medium text-white mb-2 group-hover:text-blue-200">คลิกเพื่อเลือกไฟล์ PDF</h3>
              <p className="text-sm text-slate-400">
                {uploadType === 'contract' || (uploadType === 'correction' && correctionType === 'contract') ? 'ไฟล์ชื่อ Cxxx...' : 'ไฟล์ชื่อ Rxxx...'}
              </p>
              <div className="mt-4 text-xs text-green-400 bg-green-900/20 p-2 rounded inline-block border border-green-500/30">
                <ShieldCheck size={12} className="inline mr-1"/> ระบบป้องกันบอท (reCAPTCHA) ทำงานอัตโนมัติ
              </div>
           </div>
        </div>
      </main>
    </div>
  );
}
// 🔥 แปะส่วนนี้ไว้บรรทัดสุดท้ายของไฟล์ เพื่อแก้ Error ตอน Build ครับ
export async function getServerSideProps(context) {
  return {
    props: {},
  };
}