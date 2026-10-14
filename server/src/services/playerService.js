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
 * Helper to compute composite duplicate key based on:
 * Mobile number + Name + Academic Year + Branch (Department)
 */
export function getCompositeKey(phone, name, year, dept) {
  const cp = String(phone || '').replace(/[^0-9]/g, '').slice(-10);
  const cn = String(name || '').trim().toLowerCase();
  const cy = String(year || '').trim().toLowerCase();
  const cd = String(dept || '').trim().toLowerCase();
  return `${cp}|${cn}|${cy}|${cd}`;
}

/**
 * Previews rows against column mapping and database validation
 */
export async function previewPlayerImport({ tournamentId, rawRows, mapping }) {
  const existingPlayers = await Player.find({ tournamentId });
  const existingCompositeMap = new Map();
  const existingMapByName = new Map();
  const existingMapById = new Map();

  existingPlayers.forEach((p) => {
    existingCompositeMap.set(getCompositeKey(p.phoneNumber, p.name, p.academicYear, p.department), p);
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
    const rawBasePrice = mapping.basePrice ? row[mapping.basePrice] : row['Base Price'] || row['Price'] || row['Base Price Credits'] || '';
    const rawPhoto = mapping.photoUrl ? row[mapping.photoUrl] : row['Photo'] || row['Photo URL'] || row['Image'] || '';
    const rawDept = mapping.department ? row[mapping.department] : row['Department'] || row['Dept'] || row['Branch'] || row['College'] || '';
    const rawYear = mapping.academicYear ? row[mapping.academicYear] : row['Year'] || row['Academic Year'] || '';
    const rawBat = mapping.battingStyle ? row[mapping.battingStyle] : row['Batting Style'] || row['Batting'] || '';
    const rawBowl = mapping.bowlingStyle ? row[mapping.bowlingStyle] : row['Bowling Style'] || row['Bowling'] || '';
    const rawCat = mapping.category ? row[mapping.category] : row['Category'] || '';
    const rawPhone = mapping.phoneNumber ? row[mapping.phoneNumber] : row['Phone'] || row['Phone Number'] || row['Mobile'] || row['WhatsApp'] || '';

    const name = String(rawName).trim();
    const externalId = String(rawId).trim();
    const phoneNumber = String(rawPhone).trim();
    const department = String(rawDept).trim() || 'General';
    const academicYear = String(rawYear).trim() || 'N/A';
    const role = normalizeRole(rawRole);
    const category = normalizeCategory(rawCat);

    // Parse base price
    let basePrice = Number(String(rawBasePrice).replace(/[^0-9.]/g, ''));
    if (isNaN(basePrice) || basePrice <= 0) {
      basePrice = 2; // Default 2 Credits minimum
    }

    const issues = [];
    let isDuplicate = false;
    let isSoldAlready = false;

    if (!name) {
      issues.push('Missing player name');
    }

    // 4-Factor composite duplicate check (Mobile + Name + Year + Branch)
    const compositeKey = getCompositeKey(phoneNumber, name, academicYear, department);

    if (seenInBatch.has(compositeKey)) {
      issues.push('Duplicate entry in spreadsheet (same Mobile, Name, Year, and Branch)');
      isDuplicate = true;
    } else {
      seenInBatch.add(compositeKey);
    }

    // Check existing in DB by 4-factor composite key
    const existing = existingCompositeMap.get(compositeKey) || (externalId && existingMapById.get(externalId));
    if (existing) {
      if (existing.status === PLAYER_STATUS.SOLD) {
        issues.push(`Player is already SOLD to a franchise. Record will NOT be overwritten.`);
        isSoldAlready = true;
      } else {
        issues.push('Duplicate player already in database (same Mobile, Name, Year, and Branch). Row will be skipped.');
        isDuplicate = true;
      }
    }

    preview.push({
      rowIndex: idx + 1,
      name,
      externalId,
      phoneNumber,
      role,
      category,
      basePrice,
      photoUrl: String(rawPhoto).trim(),
      department,
      academicYear,
      battingStyle: String(rawBat).trim() || 'Right-hand bat',
      bowlingStyle: String(rawBowl).trim() || 'Right-arm medium',
      isValid: issues.filter((i) => !i.includes('will update')).length === 0 && !isDuplicate,
      isSoldAlready,
      isDuplicate,
      existingId: existing ? existing._id : null,
      issues,
    });
  }

  return {
    totalRows: rawRows.length,
    validCount: preview.filter((p) => p.isValid && !p.isSoldAlready && !p.isDuplicate).length,
    soldCount: preview.filter((p) => p.isSoldAlready).length,
    duplicateCount: preview.filter((p) => p.isDuplicate).length,
    errorCount: preview.filter((p) => !p.isValid || p.isDuplicate).length,
    preview,
  };
}

/**
 * Commits the validated player batch to MongoDB
 */
export async function commitPlayerImport({ tournamentId, mappedRows }) {
  const existingPlayers = await Player.find({ tournamentId });
  const existingCompositeSet = new Set();
  existingPlayers.forEach((p) => {
    existingCompositeSet.add(getCompositeKey(p.phoneNumber, p.name, p.academicYear, p.department));
  });

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

      const compositeKey = getCompositeKey(item.phoneNumber, item.name, item.academicYear, item.department);

      // Check if duplicate existing in DB
      let player = null;
      if (item.existingId) {
        player = await Player.findById(item.existingId);
      } else if (existingCompositeSet.has(compositeKey)) {
        // Skip duplicate
        skipped++;
        continue;
      } else if (item.externalId) {
        player = await Player.findOne({ tournamentId, externalId: item.externalId });
      }

      // Never overwrite a sold player
      if (player && player.status === PLAYER_STATUS.SOLD) {
        skipped++;
        continue;
      }

      if (player) {
        // Update existing available or unsold player
        player.externalId = item.externalId || player.externalId;
        player.phoneNumber = item.phoneNumber || player.phoneNumber;
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
        // Create new player without external stats
        const count = await Player.countDocuments({ tournamentId });
        await Player.create({
          tournamentId,
          externalId: item.externalId || `MKS-P${String(count + 1).padStart(2, '0')}`,
          phoneNumber: item.phoneNumber || '',
          name: item.name,
          role: item.role,
          category: item.category,
          basePrice: item.basePrice,
          photoUrl: item.photoUrl || '',
          department: item.department || 'General',
          academicYear: item.academicYear || 'N/A',
          battingStyle: item.battingStyle || 'Right-hand bat',
          bowlingStyle: item.bowlingStyle || 'Right-arm medium',
          nominationOrder: count + 1,
          status: PLAYER_STATUS.AVAILABLE,
        });
        existingCompositeSet.add(compositeKey);
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
