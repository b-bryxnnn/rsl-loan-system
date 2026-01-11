// utils/pdfScanner.js
import { NotFoundException } from '@zxing/library';

export const scanBarcodesInPdf = async (file, pagesToCheck) => {
  // 1. โหลด Library
  const pdfjsLib = await import('pdfjs-dist/build/pdf');
  const ZXing = await import('@zxing/library');

  // ⚠️ 2. (จุดแก้ที่สำคัญที่สุด) เปลี่ยน Worker เป็น unpkg เพื่อแก้ Error ในรูป
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

  // 3. ตั้งค่าการอ่านบาร์โค้ด (เน้น Code 128 และ QR Code ของ กยศ.)
  const hints = new Map();
  const formats = [
    ZXing.BarcodeFormat.CODE_128,
    ZXing.BarcodeFormat.QR_CODE,
    ZXing.BarcodeFormat.EAN_13
  ];
  hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, formats);
  hints.set(ZXing.DecodeHintType.TRY_HARDER, true); // พยายามอ่านให้ละเอียดขึ้น

  const codeReader = new ZXing.BrowserMultiFormatReader(hints);
  
  // --- เริ่มโหลดไฟล์ ---
  const fileURL = URL.createObjectURL(file);
  const loadingTask = pdfjsLib.getDocument(fileURL);
  const pdf = await loadingTask.promise;
  
  const results = [];

  for (let i = 1; i <= Math.min(pdf.numPages, pagesToCheck); i++) {
    try {
      const page = await pdf.getPage(i);
      
      // ✅ เพิ่ม Scale เป็น 3.0 ให้ภาพชัดขึ้น (อ่านง่ายขึ้น)
      const viewport = page.getViewport({ scale: 3.0 });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // ✅ (จุดแก้สำคัญ) ถมพื้นหลังสีขาวก่อน! ไม่งั้นบาร์โค้ดจะจมกับพื้นหลังสีดำ
      context.fillStyle = '#FFFFFF';
      context.fillRect(0, 0, canvas.width, canvas.height);

      // วาด PDF ลง Canvas
      await page.render({ 
        canvasContext: context, 
        viewport: viewport 
      }).promise;

      // สแกนหาบาร์โค้ด
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
      results.push({ page: i, status: 'error', error: 'ไม่สามารถประมวลผลหน้านี้ได้' });
    }
  }

  URL.revokeObjectURL(fileURL);
  return { totalPages: pdf.numPages, results };
};