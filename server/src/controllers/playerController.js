import Player from '../models/Player.js';
import Tournament from '../models/Tournament.js';
import { parseCsvRows, previewPlayerImport, commitPlayerImport } from '../services/playerService.js';
import { fetchGoogleSheetAsCsv } from '../services/googleSheetsService.js';
import { PLAYER_STATUS } from '../config/constants.js';

/**
 * List all players with search, filters, pagination, and sorting
 */
export async function getPlayers(req, res, next) {
  try {
    let {
      tournamentId,
      search,
      role,
      category,
      status,
      department,
      sortBy = 'nominationOrder',
      order = 'asc',
      page = 1,
      limit = 100,
    } = req.query;

    if (!tournamentId) {
      const activeTournament = await Tournament.findOne().sort({ createdAt: -1 });
      if (activeTournament) tournamentId = activeTournament._id;
    }

    const filter = { tournamentId };

    if (search) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { externalId: { $regex: search.trim(), $options: 'i' } },
        { department: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    if (role && role !== 'all') filter.role = role;
    if (category && category !== 'all') filter.category = category;
    if (status && status !== 'all') filter.status = status;
    if (department && department !== 'all') filter.department = department;

    const sortOptions = {};
    sortOptions[sortBy] = order === 'desc' ? -1 : 1;

    const skip = (Number(page) - 1) * Number(limit);
    const [players, total] = await Promise.all([
      Player.find(filter)
        .populate('winningTeamId', 'name shortCode logoUrl primaryColor')
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit)),
      Player.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      players,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get player by ID
 */
export async function getPlayerById(req, res, next) {
  try {
    const player = await Player.findById(req.params.id)
      .populate('winningTeamId', 'name shortCode logoUrl primaryColor');

    if (!player) {
      return res.status(404).json({ success: false, message: 'Player not found' });
    }

    return res.json({ success: true, player });
  } catch (err) {
    next(err);
  }
}

/**
 * Create a new player
 */
export async function createPlayer(req, res, next) {
  try {
    const {
      tournamentId,
      name,
      role,
      basePrice,
      photoUrl,
      department,
      academicYear,
      battingStyle,
      bowlingStyle,
      category,
      externalId,
      notes,
    } = req.body;

    if (!name || !role || basePrice === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name, playing role, and base price are required.',
      });
    }

    const player = await Player.create({
      tournamentId,
      name: name.trim(),
      role,
      basePrice: Number(basePrice),
      photoUrl: photoUrl || '',
      department: department || 'General',
      academicYear: academicYear || 'N/A',
      battingStyle: battingStyle || 'Right-hand bat',
      bowlingStyle: bowlingStyle || 'Right-arm medium',
      category: category || 'Category A',
      externalId: externalId || '',
      notes: notes || '',
      status: PLAYER_STATUS.AVAILABLE,
    });

    return res.status(201).json({
      success: true,
      player,
      message: 'Player created successfully.',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update player information
 */
export async function updatePlayer(req, res, next) {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) {
      return res.status(404).json({ success: false, message: 'Player not found' });
    }

    if (player.status === PLAYER_STATUS.SOLD) {
      // Sensitive fields cannot be modified for a sold player
      const { notes, photoUrl, battingStyle, bowlingStyle } = req.body;
      if (notes !== undefined) player.notes = notes;
      if (photoUrl !== undefined) player.photoUrl = photoUrl;
      if (battingStyle !== undefined) player.battingStyle = battingStyle;
      if (bowlingStyle !== undefined) player.bowlingStyle = bowlingStyle;
      await player.save();

      return res.json({
        success: true,
        player,
        message: 'Updated non-financial player details (base price & ownership locked for sold players).',
      });
    }

    Object.assign(player, req.body);
    await player.save();

    return res.json({
      success: true,
      player,
      message: 'Player updated successfully.',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete player (only if not sold)
 */
export async function deletePlayer(req, res, next) {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) {
      return res.status(404).json({ success: false, message: 'Player not found' });
    }

    if (player.status === PLAYER_STATUS.SOLD) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a SOLD player. Please reverse the purchase transaction first.',
      });
    }

    await Player.findByIdAndDelete(req.params.id);
    return res.json({
      success: true,
      message: 'Player deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Preview import from CSV content or Google Sheet
 */
export async function previewImport(req, res, next) {
  try {
    let { csvContent, googleSheetUrl, mapping = {}, tournamentId } = req.body;

    if (!tournamentId) {
      const active = await Tournament.findOne().sort({ createdAt: -1 });
      if (active) tournamentId = active._id;
    }

    // If file was uploaded via multipart/form-data
    if (req.file) {
      csvContent = req.file.buffer.toString('utf-8');
    }

    // If Google Sheet URL provided, fetch CSV from it
    if (!csvContent && googleSheetUrl) {
      csvContent = await fetchGoogleSheetAsCsv(googleSheetUrl);
    }

    if (!csvContent || csvContent.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide CSV content, upload a file, or enter a valid Google Sheet URL.',
      });
    }

    const { headers, rows } = parseCsvRows(csvContent);
    if (headers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Could not extract valid headers from spreadsheet.',
      });
    }

    const previewResult = await previewPlayerImport({
      tournamentId,
      rawRows: rows,
      mapping,
    });

    return res.json({
      success: true,
      headers,
      totalRows: rows.length,
      ...previewResult,
      rawCsvContent: csvContent, // Sent back so client can confirm without re-upload
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Confirm and execute player import
 */
export async function confirmImport(req, res, next) {
  try {
    let { tournamentId, mappedRows } = req.body;

    if (!tournamentId) {
      const active = await Tournament.findOne().sort({ createdAt: -1 });
      if (active) tournamentId = active._id;
    }

    if (!mappedRows || !Array.isArray(mappedRows) || mappedRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid rows provided for import.',
      });
    }

    const importSummary = await commitPlayerImport({
      tournamentId,
      mappedRows,
    });

    return res.json({
      success: true,
      ...importSummary,
      message: `Successfully imported ${importSummary.imported} players, updated ${importSummary.updated}, skipped ${importSummary.skipped}.`,
    });
  } catch (err) {
    next(err);
  }
}
