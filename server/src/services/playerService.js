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
 * Normalizes Google Drive and image URLs to direct high-res CDN thumbnail links
 */
export function normalizeDrivePhotoUrl(url) {
  if (!url) return '';
  const str = String(url).trim();
  if (str.includes('drive.google.com')) {
    const idMatch = str.match(/[?&]id=([a-zA-Z0-9_-]+)/) || str.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (idMatch && idMatch[1]) {
      return `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
    }
  }
  return str;
}

/**
 * Case-insensitive & fuzzy column reader supporting misspellings like PHHONE NUMBER
 */
export function getRowField(row, mappedHeader, fallbackKeywords) {
  if (mappedHeader && row[mappedHeader] !== undefined && String(row[mappedHeader]).trim() !== '') {
    return String(row[mappedHeader]).trim();
  }
  const rowKeys = Object.keys(row || {});
  // 1. Exact case-insensitive match (stripping spaces and punctuation)
  for (const keyword of fallbackKeywords) {
    const cleanKw = keyword.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const rk of rowKeys) {
      const cleanRk = rk.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanRk === cleanKw) {
        if (row[rk] !== undefined && String(row[rk]).trim() !== '') {
          return String(row[rk]).trim();
        }
      }
    }
  }
  // 2. Substring match
  for (const keyword of fallbackKeywords) {
    const cleanKw = keyword.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!cleanKw) continue;
    for (const rk of rowKeys) {
      const cleanRk = rk.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanRk.includes(cleanKw) || cleanKw.includes(cleanRk)) {
        if (row[rk] !== undefined && String(row[rk]).trim() !== '') {
          return String(row[rk]).trim();
        }
      }
    }
  }
  return '';
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
export async function previewPlayerImport({ tournamentId, rawRows, mapping = {} }) {
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

    // Extract fields via mapping or smart fuzzy fallback
    const rawId = getRowField(row, mapping.externalId, ['registration/player id', 'registration id', 'player id', 'reg id', 'reg no', 'id', 'roll']);
    const rawName = getRowField(row, mapping.name, ['fullname', 'full name', 'name', 'player name', 'player']);
    const rawPhone = getRowField(row, mapping.phoneNumber, ['phhone number', 'phone number', 'phone', 'phhone', 'mobile', 'whatsapp', 'contact']);
    const rawRole = getRowField(row, mapping.role, ['primary playing role', 'playing role', 'primary role', 'role', 'speciality', 'position']);
    const rawBasePrice = getRowField(row, mapping.basePrice, ['base price', 'base price credits', 'price', 'credits', 'base']);
    const rawPhoto = getRowField(row, mapping.photoUrl, ['player photograph link', 'photograph link', 'photo link', 'photo url', 'photo', 'image', 'picture', 'link']);
    const rawDept = getRowField(row, mapping.department, ['department', 'dept', 'branch', 'college', 'course']);
    const rawYear = getRowField(row, mapping.academicYear, ['academic year', 'year', 'batch', 'standing']);
    const rawCat = getRowField(row, mapping.category, ['player category', 'category', 'tier', 'group']);
    const rawBat = getRowField(row, mapping.battingStyle, ['batting style', 'batting', 'batsman style']);
    const rawBowl = getRowField(row, mapping.bowlingStyle, ['bowling style', 'bowling', 'bowler style']);

    const name = String(rawName).trim();
    const externalId = String(rawId).trim();
    const phoneNumber = String(rawPhone).trim();
    const department = String(rawDept).trim() || 'General';
    const academicYear = String(rawYear).trim() || 'N/A';
    const role = normalizeRole(rawRole);
    const category = normalizeCategory(rawCat);
    const photoUrl = normalizeDrivePhotoUrl(rawPhoto);

    // Parse base price (defaults to 1 Credit if unspecified)
    let basePrice = Number(String(rawBasePrice).replace(/[^0-9.]/g, ''));
    if (isNaN(basePrice) || basePrice <= 0) {
      basePrice = 1;
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
      photoUrl: photoUrl || '',
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
