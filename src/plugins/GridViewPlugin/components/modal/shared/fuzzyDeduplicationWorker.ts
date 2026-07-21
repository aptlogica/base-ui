// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com

export interface FuzzyWorkerInput {
  records: Record<string, any>[];
  selectedColumnKeys: string[];
  threshold: number;
  keepRule: string;
  deduplicationMode?: string;
  rowActions?: Record<string, 'keep' | 'delete' | 'clear' | 'none'>;
}

const getRowId = (row: Record<string, any>, index: number): string => {
  if (row == null) return `row_${index}`;
  const idCandidates = [row.id, row._id, row.rowId, row.row_id, row.uuid, row.key];
  for (const candidate of idCandidates) {
    if (candidate != null && String(candidate).trim() !== '') {
      return String(candidate);
    }
  }
  return `row_${index}`;
};

const normalizeRow = (row: Record<string, any>): Record<string, any> => {
  if (row == null || typeof row !== 'object') return {};
  const normalized: Record<string, any> = {};
  Object.keys(row).forEach((key) => {
    normalized[key] = row[key];
  });
  return normalized;
};

const levenshteinDistance = (a: string, b: string): number => {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const row = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) row[j] = j;

  for (let i = 1; i <= a.length; i++) {
    let prevDiag = row[0];
    row[0] = i;
    const charA = a.charCodeAt(i - 1);
    for (let j = 1; j <= b.length; j++) {
      const temp = row[j];
      const cost = charA === b.charCodeAt(j - 1) ? 0 : 1;
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prevDiag + cost);
      prevDiag = temp;
    }
  }

  return row[b.length];
};

const similarityScore = (str1: string, str2: string): number => {
  if (str1 === str2) return 1.0;
  if (!str1 || !str2) return 0.0;
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1.0;
  const dist = levenshteinDistance(str1, str2);
  return 1.0 - dist / maxLen;
};

self.onmessage = (event: MessageEvent<FuzzyWorkerInput>) => {
  const { records, selectedColumnKeys, threshold, keepRule, deduplicationMode, rowActions = {} } = event.data;
  const totalRows = records.length;

  if (totalRows === 0 || selectedColumnKeys.length === 0) {
    self.postMessage({
      type: 'result',
      previewRows: records.map((r, idx) => ({
        id: getRowId(r, idx),
        original: normalizeRow(r),
        values: normalizeRow(r),
        changedColumns: [],
        rowState: 'unchanged',
      })),
      changedRowIds: [],
      affectedRows: 0,
      affectedCells: 0,
      affectedColumns: 0,
    });
    return;
  }

  const sourceEntries = records.map((row, index) => {
    const original = normalizeRow(row);
    const values = { ...original };
    return {
      row,
      index,
      id: getRowId(row, index),
      original,
      values,
      changedColumns: [] as string[],
      rowState: 'unchanged' as 'unchanged' | 'changed' | 'removed' | 'kept',
    };
  });

  const parent = Array.from({ length: sourceEntries.length }, (_, i) => i);
  const find = (i: number): number => {
    let root = i;
    while (root !== parent[root]) root = parent[root];
    let curr = i;
    while (curr !== root) {
      const next = parent[curr];
      parent[curr] = root;
      curr = next;
    }
    return root;
  };
  const union = (i: number, j: number) => {
    const rootI = find(i);
    const rootJ = find(j);
    if (rootI !== rootJ) parent[rootI] = rootJ;
  };

  const BATCH_SIZE = 30;
  for (let i = 0; i < sourceEntries.length; i++) {
    let emptyI = true;
    for (const columnKey of selectedColumnKeys) {
      if (sourceEntries[i].values[columnKey] != null && String(sourceEntries[i].values[columnKey]).trim() !== '') {
        emptyI = false;
        break;
      }
    }

    if (!emptyI) {
      for (let j = i + 1; j < sourceEntries.length; j++) {
        let emptyJ = true;
        for (const columnKey of selectedColumnKeys) {
          if (sourceEntries[j].values[columnKey] != null && String(sourceEntries[j].values[columnKey]).trim() !== '') {
            emptyJ = false;
            break;
          }
        }
        if (emptyJ) continue;

        let match = true;
        for (const columnKey of selectedColumnKeys) {
          const valI = String(sourceEntries[i].values[columnKey] ?? '').trim();
          const valJ = String(sourceEntries[j].values[columnKey] ?? '').trim();

          if (valI === '' && valJ === '') continue;
          if (valI === '' || valJ === '') {
            match = false;
            break;
          }

          // Pre-filter: skip comparison if length difference ratio is too big
          const maxLen = Math.max(valI.length, valJ.length);
          const minLen = Math.min(valI.length, valJ.length);
          if (maxLen > 0 && minLen / maxLen < threshold - 0.1) {
            match = false;
            break;
          }

          const score = similarityScore(valI.toLowerCase(), valJ.toLowerCase());
          if (score < threshold) {
            match = false;
            break;
          }
        }

        if (match) union(i, j);
      }
    }

    if (i % BATCH_SIZE === 0 || i === sourceEntries.length - 1) {
      const currentRoots = new Set<number>();
      let duplicateCount = 0;
      for (let idx = 0; idx <= i; idx++) {
        const root = find(idx);
        if (currentRoots.has(root)) {
          duplicateCount++;
        } else {
          currentRoots.add(root);
        }
      }

      self.postMessage({
        type: 'progress',
        scannedRows: i + 1,
        totalRows,
        duplicatesDetected: duplicateCount,
      });
    }
  }

  // 2. Group by root index
  const groupsByRoot = new Map<number, typeof sourceEntries>();
  sourceEntries.forEach((entry, idx) => {
    const root = find(idx);
    const group = groupsByRoot.get(root) || [];
    group.push(entry);
    groupsByRoot.set(root, group);
  });

  const duplicateIds = new Set<string>();
  const keptIds = new Set<string>();
  const rowGroupIdMap = new Map<string, string>();

  groupsByRoot.forEach((group) => {
    if (group.length <= 1) {
      group.forEach((e) => keptIds.add(e.id));
      return;
    }

    const groupId = `group_${group[0].id}`;
    group.forEach((e) => rowGroupIdMap.set(e.id, groupId));

    let masterIndex = 0;
    if (keepRule === 'keep_last') {
      masterIndex = group.length - 1;
    } else if (keepRule === 'keep_latest_updated') {
      let latestTime = -Infinity;
      group.forEach((e, idx) => {
        const t = new Date(e.row.updated_at || e.row.updatedAt || e.row.created_at || 0).getTime();
        if (t > latestTime) {
          latestTime = t;
          masterIndex = idx;
        }
      });
    }

    group.forEach((e, idx) => {
      if (idx === masterIndex) {
        keptIds.add(e.id);
      } else {
        duplicateIds.add(e.id);
      }
    });
  });

  // 3. Construct final preview rows
  const previewRows: any[] = [];
  const changedRowIds: string[] = [];
  let affectedCells = 0;

  sourceEntries.forEach((entry) => {
    const override = deduplicationMode === 'manual' ? rowActions[entry.id] : undefined;
    const groupId = rowGroupIdMap.get(entry.id);
    let rowState: 'unchanged' | 'changed' | 'removed' | 'kept' = 'unchanged';

    if (override === 'delete') {
      rowState = 'removed';
    } else if (override === 'clear') {
      rowState = 'changed';
    } else if (override === 'keep') {
      rowState = 'kept';
    } else if (duplicateIds.has(entry.id)) {
      rowState = 'removed';
    } else if (keptIds.has(entry.id) && groupId) {
      rowState = 'kept';
    }

    if (rowState === 'removed') {
      changedRowIds.push(entry.id);
      affectedCells += selectedColumnKeys.length;
    } else if (rowState === 'changed') {
      changedRowIds.push(entry.id);
      selectedColumnKeys.forEach((colKey) => {
        if (entry.values[colKey] != null && String(entry.values[colKey]) !== '') {
          entry.values[colKey] = '';
          entry.changedColumns.push(colKey);
          affectedCells += 1;
        }
      });
    }

    previewRows.push({
      id: entry.id,
      original: entry.original,
      values: entry.values,
      changedColumns: entry.changedColumns,
      rowState,
      groupId,
    });
  });

  self.postMessage({
    type: 'result',
    previewRows: previewRows.filter((r) => r.groupId !== undefined),
    changedRowIds,
    affectedRows: changedRowIds.length,
    affectedCells,
    affectedColumns: selectedColumnKeys.length,
    totalRows,
  });
};
