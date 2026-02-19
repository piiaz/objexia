// utils/CsvHelpers.tsx

import { Group, Item, Milestone } from '../components/TimelineConstants';

// --- CSV HEADERS ---
const CSV_HEADERS = [
  'DataType', // 'group', 'item', or 'milestone'
  'ID',
  'Title',
  'StartDate', // For Items
  'EndDate',   // For Items
  'Date',      // For Milestones
  'GroupId',
  'Progress',
  'Description',
  'Color',
  'Icon',      // For Milestones
  'Type',      // For Groups (lane vs milestone)
  'TrackIndex'
].join(',');

// --- HELPER: ESCAPE TEXT FOR CSV ---
// Wraps text in quotes if it contains commas, quotes, or newlines
const escape = (text: string | number | undefined | null) => {
  if (text === undefined || text === null) return '';
  const str = String(text);
  // If it has special CSV characters, wrap in quotes and escape internal quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

// --- EXPORT FUNCTION ---
export const generateCsvContent = (groups: Group[], items: Item[], milestones: Milestone[]) => {
  let csvContent = CSV_HEADERS + '\n';

  // 1. Add Groups
  groups.forEach(g => {
    const row = [
      'group',
      escape(g.id),
      escape(g.title),
      '', '', '', // Dates empty
      '', // GroupId empty
      '', // Progress empty
      '', // Description empty
      escape(g.color),
      '', // Icon empty
      escape(g.type),
      '' // TrackIndex empty
    ];
    csvContent += row.join(',') + '\n';
  });

  // 2. Add Items
  items.forEach(i => {
    const row = [
      'item',
      escape(i.id),
      escape(i.title),
      escape(i.startDate),
      escape(i.endDate),
      '', // Single date empty
      escape(i.groupId),
      escape(i.progress),
      escape(i.description),
      '', // Color empty
      '', // Icon empty
      '', // Type empty
      escape(i.trackIndex)
    ];
    csvContent += row.join(',') + '\n';
  });

  // 3. Add Milestones
  milestones.forEach(m => {
    const row = [
      'milestone',
      escape(m.id),
      escape(m.title),
      '', '', // Start/End empty
      escape(m.date), // Single date
      escape(m.groupId),
      '', // Progress
      '', // Description
      escape(m.color),
      escape(m.icon),
      '', // Type
      escape(m.trackIndex)
    ];
    csvContent += row.join(',') + '\n';
  });

  return csvContent;
};

// --- HELPER: ROBUST CSV LINE SPLITTER ---
// This handles newlines inside quoted strings correctly
const splitCsvRows = (csvText: string): string[] => {
  const rows: string[] = [];
  let currentRow = '';
  let inQuotes = false;
  
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      inQuotes = !inQuotes;
    }

    // Identify a true row break: Newline NOT inside quotes
    if (!inQuotes && (char === '\n' || (char === '\r' && nextChar === '\n'))) {
      if (currentRow.trim()) rows.push(currentRow);
      currentRow = '';
      if (char === '\r') i++; // Skip next newline char
    } else {
      currentRow += char;
    }
  }
  if (currentRow.trim()) rows.push(currentRow);
  return rows;
}

// --- PARSE FUNCTION ---
export const parseCsvContent = (csvText: string) => {
  // Use the robust splitter instead of simple .split('\n')
  const lines = splitCsvRows(csvText);
  
  const groups: Group[] = [];
  const items: Item[] = [];
  const milestones: Milestone[] = [];

  // Start at index 1 to skip Headers
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Parser for individual cells
    const values: string[] = [];
    let inQuotes = false;
    let currentValue = '';
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      
      if (char === '"') {
        // Handle escaped quotes ("") inside quoted strings
        if (inQuotes && line[j + 1] === '"') {
          currentValue += '"';
          j++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(currentValue);
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue);

    // Map values to variables
    const [
      dataType, id, title, startDate, endDate, date, 
      groupId, progress, description, color, icon, type, trackIndex
    ] = values; // No need to regex replace quotes again, we handled it above

    if (dataType === 'group') {
      groups.push({
        id,
        title,
        color,
        type: (type as 'lane' | 'milestone') || 'lane'
      });
    } else if (dataType === 'item') {
      items.push({
        id,
        title,
        startDate,
        endDate,
        groupId,
        progress: Number(progress) || 0,
        description,
        trackIndex: Number(trackIndex) || 0
      });
    } else if (dataType === 'milestone') {
      milestones.push({
        id,
        title,
        date,
        groupId,
        color,
        icon,
        trackIndex: Number(trackIndex) || 0
      });
    }
  }

  return { groups, items, milestones };
};