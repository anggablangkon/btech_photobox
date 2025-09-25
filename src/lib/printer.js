// src/lib/server/printer.js
import ipp from "ipp";
import { Buffer } from "buffer";

/**
 * Print image to IPP printer
 * @param {string} base64Image
 * @param {number} copies
 */
export async function printToIPP(base64Image, copies = 1) {
  // decode base64
  const imageBuffer = Buffer.from(base64Image.split(",")[1], "base64");

  // ganti URL printer sesuai network kamu
  const printerUrl = "http://192.168.0.123:631/printers/MyPrinter";
  const printer = ipp.Printer(printerUrl);

  const msg = {
    "operation-attributes-tag": {
      "requesting-user-name": "Syahrul",
      "job-name": "Canvas Print",
      "document-format": "image/png",
      copies: copies,
      // Ini untuk ukuran kertas 4R
      media: "na_index-4x6_4x6in",
    },
    data: imageBuffer,
  };

  return new Promise((resolve, reject) => {
    printer.execute("Print-Job", msg, (err, res) => {
      if (err) reject(err);
      else resolve(res);
    });
  });
}
