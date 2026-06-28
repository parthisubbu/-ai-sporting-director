const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getCareerAndGenerateReport() {
  // Get the Manchester United career
  const { data: careers, error: careersError } = await supabase
    .from('careers')
    .select('*')
    .eq('career_name', 'Manchester United Career')
    .limit(1);

  if (careersError) {
    console.error('❌ Error fetching career:', careersError);
    process.exit(1);
  }

  if (!careers || careers.length === 0) {
    console.error('❌ No Manchester United career found');
    process.exit(1);
  }

  const career = careers[0];
  console.log('✅ Found career:', career.id, '-', career.career_name);
  console.log('   Club:', career.club_name, '|', career.league);
  console.log('');

  // Get player count
  const { data: players, error: playersError } = await supabase
    .from('players')
    .select('id', { count: 'exact' })
    .eq('career_id', career.id);

  console.log('✅ Players in career:', players?.length || 0);

  // Get club count
  const { data: clubs } = await supabase
    .from('clubs')
    .select('*')
    .eq('career_id', career.id);

  console.log('✅ Clubs in career:', clubs?.length || 0);
  console.log('');

  return career.id;
}

getCareerAndGenerateReport().catch(console.error);
