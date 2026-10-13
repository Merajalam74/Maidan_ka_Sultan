/**
 * Google Sheets Service for fetching spreadsheet rows via Google Sheets API or Direct CSV Export
 */
import https from 'node:https';
import http from 'node:http';

/**
 * Extracts Google Spreadsheet ID from a standard sharing URL or ID string
 */
export function extractSheetId(urlOrId) {
  if (!urlOrId) return null;
  const match = urlOrId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match) return match[1];
  if (/^[a-zA-Z0-9-_]+$/.test(urlOrId.trim())) return urlOrId.trim();
  return null;
}

/**
 * Fetches raw CSV text from a Google Spreadsheet export URL
 */
export async function fetchGoogleSheetAsCsv(sheetUrlOrId, gid = '0') {
  const sheetId = extractSheetId(sheetUrlOrId);
  if (!sheetId) {
    throw new Error('Invalid Google Sheet URL or ID format.');
  }

  const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;

  return new Promise((resolve, reject) => {
    https.get(exportUrl, (res) => {
      // Follow redirect if 301, 302, 307
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        https.get(res.headers.location, (redirectRes) => {
          let data = '';
          redirectRes.on('data', (chunk) => (data += chunk));
          redirectRes.on('end', () => resolve(data));
        }).on('error', reject);
        return;
      }

      if (res.statusCode !== 200) {
        return reject(
          new Error(
            `Unable to fetch Google Sheet. Server returned HTTP ${res.statusCode}. Ensure the sheet has 'Anyone with the link can view' permissions or export a CSV.`
          )
        );
      }

      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}
