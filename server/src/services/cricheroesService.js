import https from 'node:https';

/**
 * CricHeroes Player Stats Scraper & Lookup Service
 * Inspired by https://github.com/pupattan/cricheroes
 * Lookups player stats by phone number or profile.
 * If stats are not available or phone number not found, returns 'nan' for all fields.
 */

export async function fetchCricHeroesStatsByPhone(phoneNumber, playerName = '') {
  const cleanPhone = String(phoneNumber || '').replace(/[^0-9]/g, '');

  // If phone number is missing or less than 10 digits
  if (!cleanPhone || cleanPhone.length < 10) {
    return {
      matches: 'nan',
      runs: 'nan',
      wickets: 'nan',
      strikeRate: 'nan',
      economy: 'nan',
      highestScore: 'nan',
      bestBowling: 'nan',
      found: false,
      message: 'Phone number missing or invalid; stats set to nan',
    };
  }

  try {
    // Attempt CricHeroes API / profile query
    const result = await queryCricHeroesAPI(cleanPhone, playerName);
    if (result && result.found) {
      return {
        matches: result.matches ?? 'nan',
        runs: result.runs ?? 'nan',
        wickets: result.wickets ?? 'nan',
        strikeRate: result.strikeRate ?? 'nan',
        economy: result.economy ?? 'nan',
        highestScore: result.highestScore ?? 'nan',
        bestBowling: result.bestBowling ?? 'nan',
        found: true,
        profileUrl: result.profileUrl || '',
      };
    }
  } catch (err) {
    console.warn(`[CricHeroes] Scraping error for phone ${cleanPhone}:`, err.message);
  }

  // Fallback: If stats not available, return 'nan' as specified
  return {
    matches: 'nan',
    runs: 'nan',
    wickets: 'nan',
    strikeRate: 'nan',
    economy: 'nan',
    highestScore: 'nan',
    bestBowling: 'nan',
    found: false,
    message: 'Profile not found on CricHeroes; stats set to nan',
  };
}

/**
 * Queries CricHeroes public search or endpoint
 */
function queryCricHeroesAPI(phone, name) {
  return new Promise((resolve) => {
    // Timeout safeguard after 4 seconds
    const timeout = setTimeout(() => {
      resolve({ found: false });
    }, 4000);

    const options = {
      hostname: 'cricheroes.in',
      port: 443,
      path: `/api/v1/search/players?search=${encodeURIComponent(phone)}`,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        clearTimeout(timeout);
        try {
          if (res.statusCode === 200) {
            const parsed = JSON.parse(data);
            if (parsed.data && parsed.data.length > 0) {
              const player = parsed.data[0];
              const stats = player.stats || player.career_stats || {};
              return resolve({
                found: true,
                matches: stats.matches ?? stats.innings ?? 'nan',
                runs: stats.total_runs ?? stats.runs ?? 'nan',
                wickets: stats.total_wickets ?? stats.wickets ?? 'nan',
                strikeRate: stats.strike_rate ? Number(stats.strike_rate).toFixed(1) : 'nan',
                economy: stats.economy ? Number(stats.economy).toFixed(2) : 'nan',
                highestScore: stats.highest_score ? String(stats.highest_score) : 'nan',
                bestBowling: stats.best_bowling ? String(stats.best_bowling) : 'nan',
                profileUrl: player.profile_url || `https://cricheroes.in/player-profile/${player.id}`,
              });
            }
          }
        } catch (e) {
          // JSON parse failed or html returned
        }
        resolve({ found: false });
      });
    });

    req.on('error', () => {
      clearTimeout(timeout);
      resolve({ found: false });
    });

    req.end();
  });
}
