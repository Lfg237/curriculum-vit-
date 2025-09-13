import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://chgyzvowfsblodxbagfa.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoZ3l6dm93ZnNibG9keGJhZ2ZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3NjA2MjQsImV4cCI6MjA3MzMzNjYyNH0.JEg_WFTJlB3gNBI8-oaP35N68tu9p6TGl6vM3sYPL4Y';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req, res) {
  const { method, body, query } = req;

  if (method === 'GET') {
    const { user1, user2 } = query;
    const { data, error } = await supabase.from('private_messages')
      .select('*')
      .or(`user_from.eq.${user1},user_to.eq.${user2}`)
      .order('timestamp', { ascending: true });
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (method === 'POST') {
    const { user_from, user_to, text, media_url, media_type } = body;
    const { data, error } = await supabase.from('private_messages').insert([{
      user_from, user_to, text, media_url, media_type, likes: 0, liked_by: [], timestamp: new Date().toISOString()
    }]);
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json(data);
  }

  return res.status(405).json({ error: 'Méthode non autorisée' });
}
"ajout api private"