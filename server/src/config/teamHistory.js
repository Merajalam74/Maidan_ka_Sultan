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
    titleBadge: 'Season 4 Semi-Finalists & Top 4 Powerhouse',
    description: 'The tactical stalwarts of the league and Season 4 semi-finalists. Highly disciplined with deep all-round strength and composed match finishes.',
    achievements: [
      'Season 4 Semi-Finalists',
      'Tournament Fairplay Award Winners (Season 4)',
      'Best Spin Bowling Average in League History',
      'Consistent Top 4 Qualification Record',
    ],
    motto: 'Steadfast Strength & Tactical Masterclass',
  },
  'Paltan XI': {
    championshipTitles: ['Season 2 Finalists'],
    yearsWon: [],
    trophyCount: 0,
    titleBadge: 'Season 2 Finalists & High-Voltage Brigade',
    description: 'The passionate brotherhood squad and Season 2 finalists. Celebrated for electric fan support, miracle comebacks, and infectious energy on the field.',
    achievements: [
      'Season 2 Finalists (Runners-Up)',
      'Super-Over Thriller Victors',
      'Best Catch of the Tournament (Season 2)',
      'Most Loyal Fan Army Across All 5 Seasons',
    ],
    motto: 'One Brotherhood, One Roar',
  },
};

export function getTeamHistoryData(teamName) {
  if (!teamName) return null;
  const clean = teamName.trim();
  // Exact or case-insensitive match
  const foundKey = Object.keys(TEAM_HISTORIES).find(
    (k) => k.toLowerCase() === clean.toLowerCase()
  );
  return foundKey ? TEAM_HISTORIES[foundKey] : null;
}
