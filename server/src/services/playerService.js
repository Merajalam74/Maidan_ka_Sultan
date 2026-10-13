import Player from '../models/Player.js';
import { PLAYER_STATUS, PLAYER_ROLES, PLAYER_CATEGORIES } from '../config/constants.js';

/**
 * Robust CSV Line Parser handling quotes and commas
 */
export function parseCsvRows(csvText) {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line) => {
    const values = [];
    let current = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (insideQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  };

  const headers = parseLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const rawValues = parseLine(lines[i]);
    const rowObj = {};
    headers.forEach((h, idx) => {
      rowObj[h] = rawValues[idx] !== undefined ? rawValues[idx] : '';
    });
    rows.push(rowObj);
  }

  return { headers, rows };
}

/**
 * Normalizes role text into authoritative PLAYER_ROLES
 */
export function normalizeRole(roleStr) {
  if (!roleStr) return PLAYER_ROLES.ALL_ROUNDER;
  const lower = roleStr.toLowerCase().trim();
  if (lower.includes('keep') || lower.includes('wk')) return PLAYER_ROLES.WICKET_KEEPER;
  if (lower.includes('all') || lower.includes('ar')) return PLAYER_ROLES.ALL_ROUNDER;
  if (lower.includes('bowl') || lower.includes('bowl')) return PLAYER_ROLES.BOWLER;
  if (lower.includes('bat')) return PLAYER_ROLES.BATSMAN;
  return PLAYER_ROLES.ALL_ROUNDER;
}

/**
 * Normalizes category text into PLAYER_CATEGORIES
 */
export function normalizeCategory(catStr) {
  if (!catStr) return PLAYER_CATEGORIES.CATEGORY_A;
  const lower = catStr.toLowerCase().trim();
  if (lower.includes('marq')) return PLAYER_CATEGORIES.MARQUEE;
  if (lower.includes('b')) return PLAYER_CATEGORIES.CATEGORY_B;
  if (lower.includes('emerg') || lower.includes('c')) return PLAYER_CATEGORIES.EMERGING;
  return PLAYER_CATEGORIES.CATEGORY_A;
}

/**
 * Previews rows against column mapping and database validation
 */
export async function previewPlayerImport({ tournamentId, rawRows, mapping }) {
  const existingPlayers = await Player.find({ tournamentId });
  const existingMapByName = new Map();
  const existingMapById = new Map();

  existingPlayers.forEach((p) => {
    existingMapByName.set(p.name.toLowerCase().trim(), p);
    if (p.externalId) existingMapById.set(p.externalId.trim(), p);
  });

  const preview = [];
  const seenInBatch = new Set();

  for (let idx = 0; idx < rawRows.length; idx++) {
    const row = rawRows[idx];

    // Extract fields via mapping
    const rawId = mapping.externalId ? row[mapping.externalId] : row['Player ID'] || row['ID'] || '';
    const rawName = mapping.name ? row[mapping.name] : row['Full Name'] || row['Name'] || row['Player Name'] || '';
    const rawRole = mapping.role ? row[mapping.role] : row['Role'] || row['Playing Role'] || '';
    const rawBasePrice = mapping.basePrice ? row[mapping.basePrice] : row['Base Price'] || row['Price'] || '';
    const rawPhoto = mapping.photoUrl ? row[mapping.photoUrl] : row['Photo'] || row['Photo URL'] || row['Image'] || '';
    const rawDept = mapping.department ? row[mapping.department] : row['Department'] || row['Dept'] || '';
    const rawYear = mapping.academicYear ? row[mapping.academicYear] : row['Year'] || row['Academic Year'] || '';
    const rawBat = mapping.battingStyle ? row[mapping.battingStyle] : row['Batting Style'] || row['Batting'] || '';
    const rawBowl = mapping.bowlingStyle ? row[mapping.bowlingStyle] : row['Bowling Style'] || row['Bowling'] || '';
    const rawCat = mapping.category ? row[mapping.category] : row['Category'] || '';

    const name = String(rawName).trim();
    const externalId = String(rawId).trim();
    const role = normalizeRole(rawRole);
    const category = normalizeCategory(rawCat);

    // Parse base price
    let basePrice = Number(String(rawBasePrice).replace(/[^0-9.]/g, ''));
    if (isNaN(basePrice) || basePrice <= 0) {
      basePrice = 100000; // Default ₹1,00,000 if not specified
    }

    const issues = [];
    let isDuplicate = false;
    let isSoldAlready = false;

    if (!name) {
      issues.push('Missing player name');
    }

    // Check duplicate within the uploaded sheet
    const batchKey = externalId ? `id:${externalId}` : `name:${name.toLowerCase()}`;
    if (seenInBatch.has(batchKey)) {
      issues.push('Duplicate entry within the same spreadsheet');
      isDuplicate = true;
    } else {
      seenInBatch.add(batchKey);
    }

    // Check existing in DB
    const existing = (externalId && existingMapById.get(externalId)) || existingMapByName.get(name.toLowerCase());
    if (existing) {
      if (existing.status === PLAYER_STATUS.SOLD) {
        issues.push(`Player is already SOLD to a team for ₹${existing.soldPrice?.toLocaleString('en-IN') || 0}. Record will NOT be overwritten.`);
        isSoldAlready = true;
      } else {
        issues.push('Player already exists in database (will update record)');
      }
    }

    preview.push({
      rowIndex: idx + 1,
      name,
      externalId,
      role,
      category,
      basePrice,
      photoUrl: String(rawPhoto).trim(),
      department: String(rawDept).trim() || 'General',
      academicYear: String(rawYear).trim() || 'N/A',
      battingStyle: String(rawBat).trim() || 'Right-hand bat',
      bowlingStyle: String(rawBowl).trim() || 'Right-arm medium',
      isValid: issues.filter((i) => !i.includes('will update')).length === 0,
      isSoldAlready,
      isDuplicate,
      existingId: existing ? existing._id : null,
      issues,
    });
  }

  return {
    totalRows: rawRows.length,
    validCount: preview.filter((p) => p.isValid && !p.isSoldAlready).length,
    soldCount: preview.filter((p) => p.isSoldAlready).length,
    errorCount: preview.filter((p) => !p.isValid).length,
    preview,
  };
}

/**
 * Commits the validated player batch to MongoDB
 */
export async function commitPlayerImport({ tournamentId, mappedRows }) {
  let imported = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;
  const errors = [];

  for (const item of mappedRows) {
    try {
      if (!item.name || item.isSoldAlready) {
        skipped++;
        continue;
      }

      // Check if existing
      let player = null;
      if (item.existingId) {
        player = await Player.findById(item.existingId);
      } else if (item.externalId) {
        player = await Player.findOne({ tournamentId, externalId: item.externalId });
      } else {
        player = await Player.findOne({ tournamentId, name: new RegExp(`^${item.name}$`, 'i') });
      }

      // Never overwrite a sold player
      if (player && player.status === PLAYER_STATUS.SOLD) {
        skipped++;
        continue;
      }

      if (player) {
        // Update existing available or unsold player
        player.externalId = item.externalId || player.externalId;
        player.role = item.role || player.role;
        player.category = item.category || player.category;
        player.basePrice = item.basePrice || player.basePrice;
        player.photoUrl = item.photoUrl || player.photoUrl;
        player.department = item.department || player.department;
        player.academicYear = item.academicYear || player.academicYear;
        player.battingStyle = item.battingStyle || player.battingStyle;
        player.bowlingStyle = item.bowlingStyle || player.bowlingStyle;
        await player.save();
        updated++;
      } else {
        // Create new player
        await Player.create({
          tournamentId,
          externalId: item.externalId || '',
          name: item.name,
          role: item.role,
          category: item.category,
          basePrice: item.basePrice,
          photoUrl: item.photoUrl || '',
          department: item.department || 'General',
          academicYear: item.academicYear || 'N/A',
          battingStyle: item.battingStyle || 'Right-hand bat',
          bowlingStyle: item.bowlingStyle || 'Right-arm medium',
          status: PLAYER_STATUS.AVAILABLE,
        });
        imported++;
      }
    } catch (err) {
      failed++;
      errors.push({ name: item.name, error: err.message });
    }
  }

  return {
    success: true,
    total: mappedRows.length,
    imported,
    updated,
    skipped,
    failed,
    errors,
  };
}
