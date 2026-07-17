const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.from('tracks').select('title, audio_url').order('created_at', { ascending: false }).limit(5);
  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
}
run();
