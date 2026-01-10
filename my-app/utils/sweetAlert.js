import Swal from 'sweetalert2';

// ธีมป๊อปอัพแบบเรียบหรู
const luxuryMixin = Swal.mixin({
  background: '#1e293b',
  color: '#e2e8f0',
  customClass: {
    popup: 'rounded-2xl border border-slate-600 shadow-2xl backdrop-blur-xl',
    title: 'text-xl font-light tracking-wide',
    htmlContainer: 'text-slate-300 font-light',
    // ใช้ Tailwind จัด Flex ให้คำอยู่ตรงกลาง
    confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg mx-2 flex justify-center items-center',
    cancelButton: 'bg-slate-600 hover:bg-slate-700 text-white rounded-lg shadow-lg mx-2 flex justify-center items-center',
  },
  buttonsStyling: false,
  // *** จุดแก้ปัญหา: บังคับ CSS ตรงนี้ทับทุกอย่าง ***
  didOpen: (popup) => {
    const confirmBtn = popup.querySelector('.swal2-confirm');
    const cancelBtn = popup.querySelector('.swal2-cancel');
    
    if (confirmBtn) {
      confirmBtn.style.minWidth = '140px'; // บังคับกว้าง 140px
      confirmBtn.style.padding = '12px 24px'; // เพิ่ม Padding
    }
    if (cancelBtn) {
      cancelBtn.style.minWidth = '140px';
      cancelBtn.style.padding = '12px 24px';
    }
  }
});

export const showLoading = (msg = 'กำลังดำเนินการ...') => {
  luxuryMixin.fire({
    title: '',
    html: `<div class="flex flex-col items-center py-4">
             <div class="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
             <p class="text-slate-300 font-light">${msg}</p>
           </div>`,
    showConfirmButton: false,
    allowOutsideClick: false
  });
};

export const showSuccess = (title, text) => {
  luxuryMixin.fire({
    icon: 'success',
    title: title,
    text: text,
    confirmButtonText: 'ตกลง',
    iconColor: '#4ade80'
  });
};

export const showError = (title, text) => {
  luxuryMixin.fire({
    icon: 'error',
    title: title,
    text: text,
    confirmButtonText: 'ปิด', // ปุ่มนี้จะกว้าง 140px แน่นอน
    iconColor: '#f87171'
  });
};

export const closeAlert = () => Swal.close();