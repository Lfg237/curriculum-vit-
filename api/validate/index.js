 // api/validate.js
import { kv } from "@vercel/kv";

/**
 * Validator API pour Vercel (utilise Vercel KV)
 * - ADMIN_CODE doit être dans les Environment Variables Vercel
 * - Vercel KV doit être activé dans ton projet
 */

function parseMomoMessage(msg){
  try {
    const txIdMatch = msg.match(/Financial Transaction Id:\s*(\d+)/i);
    const dateMatch = msg.match(/à\s*(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/);
    const senderMatch = msg.match(/de\s+([A-ZÀ-Ÿa-zà-ÿ'\s]+)\s+\((\d+)\)/);
    if(!txIdMatch || !dateMatch || !senderMatch) return null;
    return {
      name: senderMatch[1].trim(),
      number: senderMatch[2].trim(),
      txId: txIdMatch[1].trim(),
      date: new Date(dateMatch[1].trim())
    };
  } catch(e){
    return null;
  }
}

export default async function handler(req, res){
  if(req.method !== 'POST') return res.status(405).json({ ok:false, reason:'method_not_allowed' });

  const ADMIN_CODE = process.env.ADMIN_CODE; // ← configure dans Vercel (secret)
  const BENEFICIARY_NAME = "Loveline Wirnkar";
  const BENEFICIARY_MOMO = "676353859";
  const { adminCode, momoMessage, doc } = req.body || {};

  try {
    // 1) Méthode admin (code caché côté serveur)
    if(adminCode && ADMIN_CODE && adminCode === ADMIN_CODE){
      // incrément atomique du compteur
      const downloads = await kv.incr("downloadCount");
      // get multiplier (si absent, on fixe 1)
      const rawMultiplier = await kv.get("multiplier");
      const multiplier = rawMultiplier ? Number(rawMultiplier) : 1;
      return res.json({ ok:true, method:'admin', downloads, multiplier });
    }

    // 2) Méthode Mobile Money (analyse du message)
    if(momoMessage){
      const parsed = parseMomoMessage(momoMessage);
      if(!parsed) return res.json({ ok:false, reason:'format_message_invalide' });

      // vérifier bénéficiaire (nom partiel + numéro)
      if(!parsed.name.includes(BENEFICIARY_NAME.split(' ')[0]) || !parsed.number.includes(BENEFICIARY_MOMO)){
        return res.json({ ok:false, reason:'beneficiaire_mismatch' });
      }

      // vérif doublon via KV : clé "tx:<txId>"
      const txKey = `tx:${parsed.txId}`;
      const exists = await kv.get(txKey);
      if(exists) return res.json({ ok:false, reason:'tx_duplicate' });

      // vérif date <= 10 minutes
      const now = new Date();
      const diffMin = (now - parsed.date) / (1000*60);
      if(diffMin > 10) return res.json({ ok:false, reason:'tx_trop_vieux' });

      // OK : marquer txId dans KV (on mets un TTL, ex. 30 jours)
      // Note: set with TTL may depend sur la version de @vercel/kv. On peut stocker la date.
      // Ici on stocke et on met une clé simple; pour TTL, Vercel KV propose expire via EXPIRE cmd.
      await kv.set(txKey, String(Date.now()));
      // Optionnel : si tu veux un TTL (en secondes), tu peux faire kv.expire(txKey, 60*60*24*30)
      // incrémenter compteur
      const downloads = await kv.incr("downloadCount");
      const rawMultiplier = await kv.get("multiplier");
      const multiplier = rawMultiplier ? Number(rawMultiplier) : 1;
      return res.json({ ok:true, method:'momo', downloads, multiplier });
    }

    return res.json({ ok:false, reason:'aucune_methode' });

  } catch (err) {
    console.error("validate error:", err);
    return res.status(500).json({ ok:false, reason:'server_error' });
  }
}