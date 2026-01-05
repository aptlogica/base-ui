import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTable } from './useApi';

interface LinkedRecord {
  id: number | string;
  [key: string]: any;
}

interface UseLinkedRecordsResolverOptions {
  /**
   * All records from the current table (to extract linked IDs)
   */
  allRecords: any[];
  
  /**
   * Columns from the current table (to find link fields)
   */
  columns: Array<{
    id?: string;
    key?: string;
    column_name?: string;
    type?: string;
    uidt?: string;
    meta?: any;
  }>;
}

/**
 * Resolves linked record details for all link fields in a table
 * Extracts all linked IDs from all records and fetches their details
 */
export function useLinkedRecordsResolver({
  allRecords,
  columns,
}: UseLinkedRecordsResolverOptions): Map<string, Map<number | string, LinkedRecord>> {
  
  // Find all link fields and their target tables
  const linkFieldsConfig = useMemo(() => {
    const configs: Array<{
      fieldKey: string;
      targetTableId: string;
      relationType: string;
    }> = [];
    
    columns.forEach(col => {
      const fieldType = col.type || col.uidt || '';
      if (fieldType === 'links' || fieldType === 'link') {
        const meta = col.meta || {};
        const relation = meta.relation || {};
        const targetTableId = relation.with;
        
        if (targetTableId) {
          const fieldKey = col.key || col.column_name || col.id || '';
          configs.push({
            fieldKey,
            targetTableId: String(targetTableId),
            relationType: relation.type || 'has-many',
          });
        }
      }
    });
    
    return configs;
  }, [columns]);
  
  // Extract all linked IDs grouped by target table
  const linkedIdsByTable = useMemo(() => {
    const map = new Map<string, Set<number | string>>();
    
    linkFieldsConfig.forEach(({ fieldKey, targetTableId }) => {
      const ids = new Set<number | string>();
      
      allRecords.forEach(record => {
        // Try multiple ways to access the link value
        const linkValue = 
          record.data?.[fieldKey] || 
          record[fieldKey] ||
          (record as any).data?.[fieldKey];
        
        if (Array.isArray(linkValue)) {
          linkValue.forEach(id => {
            if (id !== null && id !== undefined && id !== '') {
              ids.add(id);
            }
          });
        } else if (linkValue !== null && linkValue !== undefined && linkValue !== '') {
          ids.add(linkValue);
        }
      });
      
      if (ids.size > 0) {
        map.set(targetTableId, ids);
      }
    });
    
    return map;
  }, [allRecords, linkFieldsConfig]);
  
  // Fetch target table data for each linked table
  // We'll use the table's full data and filter by IDs
  const linkedRecordsMap = new Map<string, Map<number | string, LinkedRecord>>();
  
  linkedIdsByTable.forEach((ids, targetTableId) => {
    // Fetch the target table's data (all records)
    const { data: targetTableData } = useTable(targetTableId);
    
    // Extract records that match our linked IDs
    const recordsMap = useMemo(() => {
      const map = new Map<number | string, LinkedRecord>();
      
      if (!targetTableData?.data?.records) return map;
      
      const targetRecords = targetTableData.data.records || [];
      const idArray = Array.from(ids);
      
      targetRecords.forEach((record: any) => {
        const recordId = record.id;
        if (idArray.includes(recordId) || idArray.includes(String(recordId))) {
          map.set(recordId, record);
          // Also map by string ID for flexibility
          map.set(String(recordId), record);
        }
      });
      
      return map;
    }, [targetTableData, ids]);
    
    linkedRecordsMap.set(targetTableId, recordsMap);
  });
  
  return linkedRecordsMap;
}

/**
 * Helper hook to get linked record details for a specific field
 */
export function useLinkedRecordsForField(
  allRecords: any[],
  linkFieldKey: string,
  targetTableId: string
): Map<number | string, LinkedRecord> {
  const { data: targetTableData } = useTable(targetTableId);
  
  // Extract all linked IDs from all records for this field
  const linkedIds = useMemo(() => {
    const ids = new Set<number | string>();
    
    allRecords.forEach(record => {
      const linkValue = 
        record.data?.[linkFieldKey] || 
        record[linkFieldKey] ||
        (record as any).data?.[linkFieldKey];
      
      if (Array.isArray(linkValue)) {
        linkValue.forEach(id => {
          if (id !== null && id !== undefined && id !== '') {
            ids.add(id);
          }
        });
      } else if (linkValue !== null && linkValue !== undefined && linkValue !== '') {
        ids.add(linkValue);
      }
    });
    
    return Array.from(ids);
  }, [allRecords, linkFieldKey]);
  
  // Create map of linked records
  const recordsMap = useMemo(() => {
    const map = new Map<number | string, LinkedRecord>();
    
    if (!targetTableData?.data?.records || linkedIds.length === 0) {
      return map;
    }
    
    const targetRecords = targetTableData.data.records || [];
    
    targetRecords.forEach((record: any) => {
      const recordId = record.id;
      if (
        linkedIds.includes(recordId) || 
        linkedIds.includes(String(recordId)) ||
        linkedIds.includes(Number(recordId))
      ) {
        map.set(recordId, record);
        map.set(String(recordId), record);
        map.set(Number(recordId), record);
      }
    });
    
    return map;
  }, [targetTableData, linkedIds]);
  
  return recordsMap;
}

