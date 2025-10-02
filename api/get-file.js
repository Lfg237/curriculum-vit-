// api/get-file.js
import { kv } from "@vercel/kv";
import { jsPDF } from "jspdf";

export default async function handler(req, res){
  if(req.method !== 'POST') return res.status(405).json({ ok:false, reason:'method_not_allowed' });

  try {
    const { token, docName } = req.body || {};
    if(!token || !docName) return res.status(400).json({ ok:false, reason:'missing_params' });

    const tokenKey = `token:${token}`;
    const tokenData = await kv.get(tokenKey);
    if(!tokenData) return res.status(403).json({ ok:false, reason:'invalid_or_expired_token' });

    // Delete token to make it single-use
    await kv.del(tokenKey);

    // Generate PDF server-side
    const pdf = new jsPDF();
    // Simple example: you can expand / style the PDF generation
    pdf.setFontSize(14);
    pdf.text(`Mini Secrétariat - Document: ${docName}`, 10, 20);
    pdf.setFontSize(11);
    pdf.text(`Généré le: ${new Date().toLocaleString()}`, 10, 30);
    pdf.text(`Bénéficiaire: Loveline Wirnkar`, 10, 40);
    pdf.text(`Note: Ce PDF a été généré côté serveur après validation de paiement.`, 10, 50);

    // If you want to embed more content (fields, signature images), you must send them to /api/validate
    // or store them in KV and fetch here. This example makes a simple PDF.

    // Return PDF as data URI (base64)
    const pdfDataUri = pdf.output("datauristring");
    return res.json({ ok:true, pdf: pdfDataUri });
  } catch(err){
    console.error("get-file error:", err);
    return res.status(500).json({ ok:false, reason:'server_error' });
  }
}