const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const NAMA_MODEL = process.env.GEMINI_MODEL;
const BATAS_WAKTU_MS = 30000; // batas tunggu respons sebelum dianggap timeout

// Membatalkan pemanggilan yang terlalu lama agar sistem tidak menggantung
function denganBatasWaktu(promise) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), BATAS_WAKTU_MS)),
  ]);
}

// Ambil teks jawaban dan jumlah token yang terpakai (untuk statistik admin)
function ambilHasil(respons) {
  return { teks: respons.text, jumlahToken: respons.usageMetadata?.totalTokenCount || 0 };
}

// kirimPromptChat(prompt): { teks, jumlahToken }
async function kirimPromptChat(instruksiSistem, prompt) {
  const respons = await denganBatasWaktu(
    ai.models.generateContent({
      model: NAMA_MODEL,
      contents: prompt,
      config: { systemInstruction: instruksiSistem },
    })
  );
  return ambilHasil(respons);
}

// kirimPromptAnalisisFoto(prompt, foto): { teks, jumlahToken }
async function kirimPromptAnalisisFoto(instruksiSistem, prompt, fotoBase64, mimeType) {
  const respons = await denganBatasWaktu(
    ai.models.generateContent({
      model: NAMA_MODEL,
      contents: [{ inlineData: { mimeType, data: fotoBase64 } }, { text: prompt }],
      config: { systemInstruction: instruksiSistem },
    })
  );
  return ambilHasil(respons);
}

module.exports = { kirimPromptChat, kirimPromptAnalisisFoto };