/**
 * Authoritative Tournament History & Franchise Lore
 * Maidan ke Sultan - Seasons 1 through 5
 */

export const TEAM_HISTORIES = {
  'Jeb Katre': {
    championshipTitles: ['Season 1 Champions'],
    yearsWon: ['Season 1'],
    trophyCount: 1,
    titleBadge: 'Season 1 Champions (Inaugural Winners)',
    description: 'The inaugural champions of Maidan ke Sultan (Season 1). Renowned for aggressive batting starts, razor-sharp fielding, and high-pressure tournament grit.',
    achievements: [
      'Season 1 Champions (Inaugural Title)',
      'Highest Powerplay Score in League History (78/0 in 6 overs)',
      'Best Fielding Unit of Season 1',
      'Undefeated at Home Venue in Season 1',
    ],
    motto: 'Swift, Fearless & Unstoppable',
  },
  'Phurtile Sher': {
    championshipTitles: ['Season 2 Champions', 'Season 3 Champions'],
    yearsWon: ['Season 2', 'Season 3'],
    trophyCount: 2,
    titleBadge: 'Season 2 & Season 3 Champions (Back-to-Back 2x Winners)',
    description: 'The legendary back-to-back champions of Season 2 and Season 3. Feared for their ruthless pace bowling attack, supreme athleticism, and championship pedigree.',
    achievements: [
      'Season 2 Champions',
      'Season 3 Champions (Historic 2-Time Consecutive Winners)',
      'Fastest Team 100 Runs in Tournament History',
      'Most Wickets Taken Across Two Consecutive Seasons (102 Wickets)',
    ],
    motto: 'Hunting Down Every Target',
  },
  'Maqsad XI': {
    championshipTitles: ['Season 4 Champions'],
    yearsWon: ['Season 4'],
    trophyCount: 1,
    titleBadge: 'Season 4 Champions (Defending Title Holders)',
    description: 'The reigning defending champions of Season 4. Built on clinical run chases, strategic squad discipline, and an unwavering mission-first mentality.',
    achievements: [
      'Season 4 Champions (Defending Champions)',
      'Unbeaten Knockout Record in Season 4',
      'Best Death Overs Bowling Economy (6.8 RPO in Season 4)',
      'Highest Successful 200+ Run Chase in Finals',
    ],
    motto: 'Precision, Purpose & Victory',
  },
  'Khalnayak XI': {
    championshipTitles: ['Season 3 Finalists'],
    yearsWon: [],
    trophyCount: 0,
    titleBadge: 'Season 3 Finalists & Fan Favorite Contenders',
    description: "The league's fiercest rivals and Season 3 finalists. Renowned for theatrical six-hitting, intimidating fast bowling, and electrifying final-over finishes.",
    achievements: [
      'Season 3 Finalists (Runners-Up)',
      'Most Sixes Award (Season 3)',
      'Highest Individual Score Record (112* off 48 balls)',
      'Fan Choice Marquee Franchise of the Year',
    ],
    motto: 'The Bad Boys of Cricket',
  },
  'Dhurandar XI': {
    championshipTitles: ['Season 4 Semi-Finalists'],
    yearsWon: [],
    trophyCount: 0,
    titleBadge: 'Joined Last Year (Season 4 Semi-Finalists)',
    description: 'Joined the league last year in Season 4 and immediately stamped their authority by storming straight into the Semi-Finals in their debut campaign. Known for calculated tactics, disciplined all-round depth, and composed match finishes.',
    achievements: [
      'Joined the League Last Year (Season 4)',
      'Season 4 Semi-Finalists in Debut Campaign',
      'Tournament Fairplay Award Winners (Season 4)',
      'Tactical Discipline & Top 4 Playoff Pedigree',
    ],
    motto: 'Steadfast Strength & Tactical Masterclass',
  },
  'Paltan XI': {
    championshipTitles: ['Season 5 Debutants'],
    yearsWon: [],
    trophyCount: 0,
    titleBadge: 'New Team (Playing This Year - Season 5 Debut)',
    description: 'A brand-new franchise playing this year only in Season 5. Driven by fearless young talent, high-octane energy, and ambitious goals to make an immediate championship statement in their maiden campaign.',
    achievements: [
      'New Team (Playing This Year in Season 5)',
      'Official Tournament Debutants',
      'High-Voltage Young & Fearless Squad',
      'Targeting a Historic Maiden Campaign',
    ],
    motto: 'New Blood, Fearless Ambition',
  },
};

// Aliases for alternate spellings
TEAM_HISTORIES['Dhurandhar XI'] = TEAM_HISTORIES['Dhurandar XI'];

export function getTeamHistoryData(teamName) {
  if (!teamName) return null;
  const clean = teamName.trim();
  // Exact or case-insensitive match
  const foundKey = Object.keys(TEAM_HISTORIES).find(
    (k) => k.toLowerCase() === clean.toLowerCase()
  );
  if (foundKey) return TEAM_HISTORIES[foundKey];

  // Phonetic/normalized matching
  const norm = clean.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (norm.includes('dhurand')) return TEAM_HISTORIES['Dhurandar XI'];
  if (norm.includes('paltan')) return TEAM_HISTORIES['Paltan XI'];
  if (norm.includes('jeb')) return TEAM_HISTORIES['Jeb Katre'];
  if (norm.includes('phurtile')) return TEAM_HISTORIES['Phurtile Sher'];
  if (norm.includes('maqsad')) return TEAM_HISTORIES['Maqsad XI'];
  if (norm.includes('khalnayak')) return TEAM_HISTORIES['Khalnayak XI'];

  return null;
}

