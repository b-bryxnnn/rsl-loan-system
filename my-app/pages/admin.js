import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Swal from 'sweetalert2';
import { showLoading, showSuccess, showError, closeAlert } from '../utils/sweetAlert';
import { FileText, XCircle, CheckCircle, Clock, Settings, ArrowLeft, Download, ExternalLink, Power } from 'lucide-react';
import Link from 'next/link';

const API_URL = "https://script.google.com/macros/s/AKfycbxKYoYSaGP3sEvDwSPM6L2bWxI8BR82_7-IZDn-2soQdJAHdo2iCultXLkjFtTgK52glw/exec";

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [systemStatus, setSystemStatus] = useState({ isOpen: true, start: '', end: '', manualStatus: 'OPEN' });

  useEffect(() => {
    const storedUser = localStorage.getItem('user_data');
    if (storedUser) {
      const u = JSON.parse(storedUser);
      if (u.role !== 'admin') { router.push('/'); } else { setUser(u); fetchDocuments(); fetchSystemStatus(); }
    } else { router.push('/login'); }
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'getDocuments' }) });
      const result = await res.json();
      if (result.status === 'success') setDocuments(result.data.reverse());
    } catch(e) { console.error(e); }
  };

  const fetchSystemStatus = async () => {
    try {
      const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'checkSystemStatus' }) });
      const result = await res.json();
      if (result.status === 'success') setSystemStatus(result);
    } catch(e) {}
  };

  // 🆕 ปุ่มสวิตช์เปิด-ปิดระบบทันที
  const handleToggleSystem = async () => {
    const isCurrentlyClosed = systemStatus.manualStatus === 'CLOSED';
    const actionText = isCurrentlyClosed ? 'เปิดระบบ' : 'ปิดระบบ';
    
    const { isConfirmed } = await Swal.fire({
      title: `ยืนยัน${actionText}ทันที?`,
      text: isCurrentlyClosed ? 'นักเรียนจะสามารถส่งเอกสารได้ทันที' : 'นักเรียนจะไม่สามารถส่งเอกสารได้ จนกว่าคุณจะเปิดใหม่',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: `ใช่, ${actionText}เลย`,
      confirmButtonColor: isCurrentlyClosed ? '#22c55e' : '#ef4444',
      cancelButtonText: 'ยกเลิก',
      background: '#1e293b', color: '#fff'
    });

    if (isConfirmed) {
      showLoading('กำลังบันทึก...');
      await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'toggleSystem', status: isCurrentlyClosed ? 'OPEN' : 'CLOSED' })
      });
      closeAlert();
      fetchSystemStatus();
      showSuccess('เรียบร้อย', `ระบบถูก${actionText}แล้ว`);
    }
  };

  const handleReject = async (doc) => {
    const { value: reason } = await Swal.fire({
      title: 'ระบุเหตุผลที่ตีกลับ',
      input: 'textarea',
      inputPlaceholder: 'เช่น สัญญาไม่ชัดเจน, ขาดลายเซ็น...',
      showCancelButton: true,
      confirmButtonText: 'ตีกลับเอกสาร',
      confirmButtonColor: '#ef4444',
      background: '#1e293b', color: '#fff'
    });
    if (reason) {
      showLoading('กำลังตีกลับเอกสาร...');
      const res = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'rejectDocument', email: doc.email, docType: doc.docType, reason })
      });
      const result = await res.json();
      closeAlert();
      if (result.status === 'success') { showSuccess('เรียบร้อย', 'ตีกลับเอกสารแล้ว'); fetchDocuments(); } 
      else { showError('ผิดพลาด', result.message); }
    }
  };

  // 🆕 ฟังก์ชันอนุมัติเอกสาร (ถูกต้อง)
  const handleApprove = async (doc) => {
    const { isConfirmed } = await Swal.fire({
        title: 'ยืนยันความถูกต้อง?',
        text: `คุณตรวจสอบแล้วว่าเอกสาร ${doc.docType} ของ ${doc.fullname} ถูกต้องครบถ้วน?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'ถูกต้อง (อนุมัติ)',
        confirmButtonColor: '#22c55e',
        cancelButtonText: 'ยกเลิก',
        background: '#1e293b', color: '#fff'
    });

    if (isConfirmed) {
        showLoading('กำลังบันทึก...');
        const res = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'approveDocument', email: doc.email, docType: doc.docType })
        });
        const result = await res.json();
        closeAlert();
        if (result.status === 'success') { showSuccess('อนุมัติแล้ว', 'สถานะเอกสารเปลี่ยนเป็น "ผ่าน"'); fetchDocuments(); }
        else { showError('ผิดพลาด', result.message); }
    }
  };

  // 🆕 แก้ไข: เปิดไฟล์เฉยๆ (ไม่เน้นดาวน์โหลด)
  const handleOpenFile = async (doc) => {
    // ยังคง Log การเปิดไฟล์เหมือนเดิม แต่เปลี่ยน UI ให้เป็นแค่ "เปิดดู"
    fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({ 
          action: 'markAsDownloaded', 
          adminEmail: user.email, 
          studentEmail: doc.email,
          fileName: doc.fileName,
          fileId: doc.fileId
        })
    });
    window.open(doc.fileUrl, '_blank');
  };

  const handleSystemSettings = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'ตั้งค่าเวลาเปิด-ปิดอัตโนมัติ',
      html: '<label>เวลาเปิด:</label><input id="swal-start" type="datetime-local" class="swal2-input">' +
            '<label>เวลาปิด:</label><input id="swal-end" type="datetime-local" class="swal2-input">',
      focusConfirm: false,
      background: '#1e293b', color: '#fff',
      preConfirm: () => [document.getElementById('swal-start').value, document.getElementById('swal-end').value]
    });
    if (formValues) {
      showLoading('กำลังบันทึก...');
      await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'updateSystemSettings', start: formValues[0], end: formValues[1] }) });
      closeAlert();
      fetchSystemStatus();
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-900 text-white font-prompt">
      <nav className="bg-slate-800 border-b border-slate-700 p-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-slate-400 hover:text-white"><ArrowLeft /></Link>
            <h1 className="text-lg font-bold text-yellow-400">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            
            {/* 🆕 ปุ่มสวิตช์เปิด-ปิดระบบทันที */}
            <button 
                onClick={handleToggleSystem}
                className={`flex items-center gap-2 text-sm px-4 py-2 rounded-full font-bold transition-all border ${
                    systemStatus.isOpen 
                    ? 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30' 
                    : 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30'
                }`}
            >
                <Power size={16} />
                {systemStatus.isOpen ? 'ระบบเปิดอยู่' : 'ระบบปิดอยู่'}
            </button>

            <button onClick={handleSystemSettings} className="p-2 hover:bg-slate-700 rounded-full text-slate-400"><Settings size={20} /></button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-light">รายการเอกสารล่าสุด</h2>
          <button onClick={fetchDocuments} className="text-blue-400 hover:text-blue-300 text-sm">รีเฟรชข้อมูล</button>
        </div>

        <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/50 text-slate-100 uppercase text-xs">
                <tr>
                  <th className="p-4">วันที่ส่ง</th>
                  <th className="p-4">นักเรียน</th>
                  <th className="p-4">เอกสาร</th>
                  <th className="p-4">สถานะ</th>
                  <th className="p-4 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {documents.map((doc, i) => (
                  <tr key={i} className={`hover:bg-slate-700/30 transition-colors ${doc.status === 'Replaced' ? 'opacity-50' : ''}`}>
                    <td className="p-4 whitespace-nowrap">{new Date(doc.timestamp).toLocaleString('th-TH')}</td>
                    <td className="p-4">
                      <div className="font-medium text-white">{doc.fullname}</div>
                      <div className="text-xs text-slate-500">{doc.email}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs ${doc.docType.includes('สัญญา') ? 'bg-blue-500/10 text-blue-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                        {doc.docType}
                      </span>
                    </td>
                    <td className="p-4">
                      {doc.status === 'Pending' && <span className="text-yellow-400 flex items-center gap-1"><Clock size={14}/> รอตรวจ</span>}
                      {doc.status === 'Rejected' && <span className="text-red-400 flex items-center gap-1"><XCircle size={14}/> ตีกลับแล้ว</span>}
                      {doc.status === 'Replaced' && <span className="text-slate-400 flex items-center gap-1"> ถูกแทนที่</span>}
                      {doc.status === 'Approved' && <span className="text-green-400 flex items-center gap-1"><CheckCircle size={14}/> ผ่าน</span>}
                    </td>
                    <td className="p-4 text-center flex justify-center gap-2">
                      {/* 🆕 ปุ่มเปิดไฟล์ (ไม่มีคำว่าโหลด) */}
                      <button 
                        onClick={() => handleOpenFile(doc)} 
                        className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded text-xs flex items-center gap-1"
                        disabled={doc.status === 'Replaced'}
                      >
                        <ExternalLink size={14}/> เปิดไฟล์
                      </button>
                      
                      {doc.status === 'Pending' && (
                        <>
                            {/* 🆕 ปุ่มอนุมัติ (ถูกต้อง) */}
                            <button 
                                onClick={() => handleApprove(doc)}
                                className="bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1 rounded text-xs flex items-center gap-1"
                            >
                                <CheckCircle size={14} /> ถูกต้อง
                            </button>

                            {/* ปุ่มตีกลับ */}
                            <button 
                                onClick={() => handleReject(doc)}
                                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 rounded text-xs"
                            >
                                ตีกลับ
                            </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
export async function getServerSideProps(context) { return { props: {}, }; }