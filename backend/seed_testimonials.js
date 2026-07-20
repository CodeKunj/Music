import { supabase } from './lib/supabase.js';

const testimonials = [
  {
    name: 'Shivam Pandey',
    role: 'Independent Artist',
    quote: "Honestly didn't expect this level of quality. Sent Kunj a rough demo with like zero production on it and he handed back something that genuinely gave me chills. The mix was so clean, every element had its own space. He actually listens to what you're going for emotionally and captures it. 100% booking again.",
    rating: 5,
    is_active: true
  },
  {
    name: 'Shiv Malukar',
    role: 'Music Producer',
    quote: "Kunj mixed and mastered two of my originals and bro the difference is night and day. My tracks were sounding muddy in the low mids and he sorted it without making it sound over-processed. Turnaround was fast too, didn't have to chase him for updates. If you're an indie artist trying to sound professional, this is the guy.",
    rating: 5,
    is_active: true
  },
  {
    name: 'Khushi Upadhyay',
    role: 'Singer-Songwriter',
    quote: "I was a bit nervous handing over my first serious project but Kunj made the whole process so comfortable. He explained every decision he made during the mix which really helped me learn too. The final master sounded amazing on Spotify — punchy, warm, and loud enough to compete. Best decision for my music career.",
    rating: 5,
    is_active: true
  },
  {
    name: 'Sudarshan',
    role: 'Indie Musician',
    quote: "Been working with a few mixing engineers over the past year and Kunj stands out for one simple reason — he treats your music like it's his own. Suggested arrangement tweaks that made the track 10x better. The mastered version hit straight to my playlist. Solid guy, solid work.",
    rating: 5,
    is_active: true
  },
  {
    name: 'Chirasha Rawal',
    role: 'Hindi Pop Vocalist',
    quote: "I came to Kunj with a Hindi pop track that had tricky layering and pitch issues in the vocal takes. He handled all of it seamlessly — the vocal tuning was natural, not robotic, and the mix had beautiful clarity I'd struggled to achieve for months. Super responsive and genuinely passionate about music.",
    rating: 5,
    is_active: true
  }
];

async function seed() {
  console.log('Clearing existing testimonials...');
  const { error: delError } = await supabase.from('testimonials').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // delete all
  if (delError) {
    console.error('Error deleting:', delError);
    process.exit(1);
  }

  console.log('Inserting new testimonials...');
  const { data, error } = await supabase.from('testimonials').insert(testimonials).select();
  if (error) {
    console.error('Error inserting:', error);
  } else {
    console.log(`Inserted ${data.length} testimonials successfully.`);
  }
  process.exit(0);
}

seed();
