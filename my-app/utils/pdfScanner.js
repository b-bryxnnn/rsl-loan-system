import { NotFoundException } from '@zxing/library';

export const scanBarcodesInPdf = async (file, pagesToCheck) => {
  // 1. Dynamic Import Library
  const pdfjsLib = await import('pdfjs-dist/build/pdf');
  const ZXing = await import('@zxing/library');

  // 2. ตั้งค่า Worker (ใช้ unpkg เพื่อความชัวร์เรื่องเวอร์ชันและลดปัญหา Fake worker failed)
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

  // 3. กำหนดประเภทบาร์โค้ดที่ต้องการหา (เน้น Code 128 และ QR Code สำหรับเอกสารราชการ)
  const hints = new Map();
  const formats = [
    ZXing.BarcodeFormat.CODE_128,
    ZXing.BarcodeFormat.QR_CODE,
    ZXing.BarcodeFormat.EAN_13,
    ZXing.BarcodeFormat.CODE_39
  ];
  hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, formats);
  hints.set(ZXing.DecodeHintType.TRY_HARDER, true); // พยายามอ่านให้ละเอียดขึ้น

  const codeReader = new ZXing.BrowserMultiFormatReader(hints);
  
  // --- เริ่มโหลดไฟล์ PDF ---
  const fileURL = URL.createObjectURL(file);
  const loadingTask = pdfjsLib.getDocument(fileURL);
  const pdf = await loadingTask.promise;
  
  const results = [];

  // วนลูปตรวจสอบทีละหน้า (ตามจำนวน pagesToCheck ที่กำหนด)
  for (let i = 1; i <= Math.min(pdf.numPages, pagesToCheck); i++) {
    try {
      const page = await pdf.getPage(i);
      
      // ✅ เพิ่ม Scale เป็น 3.0 ให้ภาพชัดขึ้น (อ่านบาร์โค้ดได้แม่นยำขึ้น)
      const scale = 3.0;
      const viewport = page.getViewport({ scale: scale });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // ✅ (จุดสำคัญ) ถมพื้นหลังสีขาวก่อนวาด PDF
      // เพราะ PDF กยศ. พื้นหลังใส ถ้าไม่ถมขาว เส้นบาร์โค้ดสีดำจะจมกับพื้นหลัง Canvas ที่เป็นสีดำ
      context.fillStyle = '#FFFFFF';
      context.fillRect(0, 0, canvas.width, canvas.height);

      // วาด PDF ลง Canvas (ปิด Font Rendering เพื่อความเร็วและลด Error)
      await page.render({ 
        canvasContext: context, 
        viewport: viewport,
        intent: 'print' 
      }).promise;

      // เริ่มสแกนหาบาร์โค้ดจาก Canvas
      try {
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
      console.error(`Page ${i} Render Error:`, err);
      results.push({ page: i, status: 'error', error: 'ไม่สามารถประมวลผลหน้านี้ได้' });
    }
  }

  // คืนหน่วยความจำ
  URL.revokeObjectURL(fileURL);
  
  return { totalPages: pdf.numPages, results };
};