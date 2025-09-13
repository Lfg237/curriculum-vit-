import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://chgyzvowfsblodxbagfa.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoZ3l6dm93ZnNibG9keGJhZ2ZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3NjA2MjQsImV4cCI6MjA3MzMzNjYyNH0.JEg_WFTJlB3gNBI8-oaP35N68tu9p6TGl6vM3sYPL4Y';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req, res) {
  const { method, body } = req;

  if (method === 'GET') {
    const { data, error } = await supabase.from('groups').select('*');
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (method === 'POST') {
    const { name, userId } = body;
    const { data, error } = await supabase.from('groups').insert([{ name, members: [userId], messages: [] }]);
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (method === 'PUT') {
    const { groupId, message } = body;
    const { data: group, error: fetchErr } = await supabase.from('groups').select('*').eq('id', groupId).single();
    if (fetchErr) return res.status(400).json({ error: fetchErr.message });

    let messages = group.messages || [];
    messages.push(message);

    const { data, error } = await supabase.from('groups').update({ messages }).eq('id', groupId);
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json(data);
  }

  return res.status(405).json({ error: 'Méthode non autorisée' });
}
"ajout api groupe '