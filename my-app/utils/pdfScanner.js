// ⚠️ ลบ import ด้านบนออกให้หมด เพื่อป้องกัน Server รันแล้วพัง
// เราจะย้ายไป import ข้างในฟังก์ชันแทนครับ

export const scanBarcodesInPdf = async (file, pagesToCheck) => {
  // 1. Dynamic Import: โหลด Library เฉพาะตอนเรียกใช้ฟังก์ชัน (Client-side Only)
  const pdfjsLib = await import('pdfjs-dist/build/pdf');
  const { BrowserMultiFormatReader, NotFoundException } = await import('@zxing/library');

  // 2. ตั้งค่า Worker (ต้องทำหลังจาก import เสร็จ)
  // ใช้ Worker ผ่าน CDN เพื่อลดปัญหาการตั้งค่า Webpack/Turbopack
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

  // --- เริ่มกระบวนการอ่านไฟล์ ---
  const fileURL = URL.createObjectURL(file);
  const loadingTask = pdfjsLib.getDocument(fileURL);
  const pdf = await loadingTask.promise;
  
  const codeReader = new BrowserMultiFormatReader();
  const results = [];

  // วนลูปตรวจสอบทีละหน้าตามที่กำหนด
  for (let i = 1; i <= Math.min(pdf.numPages, pagesToCheck); i++) {
    try {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 }); // Scale 2.0 เพื่อให้ภาพชัดพออ่านบาร์โค้ด
      
      // สร้าง Canvas ในหน่วยความจำ
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({ canvasContext: context, viewport: viewport }).promise;

      // สแกนบาร์โค้ดจาก Canvas
      try {
        // ใช้ codeReader ที่ import มาแบบ dynamic
        const result = await codeReader.decodeFromCanvas(canvas);
        results.push({ page: i, status: 'found', text: result.getText() });
      } catch (err) {
        if (err instanceof NotFoundException) {
          results.push({ page: i, status: 'missing', error: 'ไม่พบบาร์โค้ด' });
        } else {
           results.push({ page: i, status: 'error', error: 'อ่านค่าไม่ได้' });
        }
      }
    } catch (err) {
      results.push({ page: i, status: 'error', error: 'ไม่สามารถประมวลผลหน้านี้ได้' });
    }
  }

  URL.revokeObjectURL(fileURL); // คืน Memory
  return { totalPages: pdf.numPages, results };
};