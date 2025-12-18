export const createMockSemver = () => {
  const parseVersion = (version: string): [number, number, number] => {
    const parts = version.replace(/[^0-9.]/g, '').split('.').map(Number);
    return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
  };

  const compareVersions = (v1: string, v2: string): number => {
    const [maj1, min1, pat1] = parseVersion(v1);
    const [maj2, min2, pat2] = parseVersion(v2);

    if (maj1 !== maj2) return maj1 - maj2;
    if (min1 !== min2) return min1 - min2;
    return pat1 - pat2;
  };

  const satisfiesRange = (version: string, range: string): boolean => {
    // Simple implementation - in production use actual semver library
    if (range.startsWith('^')) {
      const targetVersion = range.slice(1);
      const [targetMajor] = parseVersion(targetVersion);
      const [versionMajor] = parseVersion(version);
      return versionMajor === targetMajor && compareVersions(version, targetVersion) >= 0;
    }

    if (range.startsWith('~')) {
      const targetVersion = range.slice(1);
      const [targetMajor, targetMinor] = parseVersion(targetVersion);
      const [versionMajor, versionMinor] = parseVersion(version);
      return versionMajor === targetMajor && 
             versionMinor === targetMinor && 
             compareVersions(version, targetVersion) >= 0;
    }

    // Exact match or greater than/less than
    if (range.startsWith('>=')) {
      return compareVersions(version, range.slice(2)) >= 0;
    }
    
    if (range.startsWith('<=')) {
      return compareVersions(version, range.slice(2)) <= 0;
    }
    
    if (range.startsWith('>')) {
      return compareVersions(version, range.slice(1)) > 0;
    }
    
    if (range.startsWith('<')) {
      return compareVersions(version, range.slice(1)) < 0;
    }

    // Default to exact match
    return compareVersions(version, range) === 0;
  };

  return {
    satisfies: satisfiesRange,
    valid: (version: string) => /^\d+\.\d+\.\d+/.test(version) ? version : null,
    clean: (version: string) => version.replace(/[^0-9.]/g, ''),
    gt: (v1: string, v2: string) => compareVersions(v1, v2) > 0,
    lt: (v1: string, v2: string) => compareVersions(v1, v2) < 0,
    gte: (v1: string, v2: string) => compareVersions(v1, v2) >= 0,
    lte: (v1: string, v2: string) => compareVersions(v1, v2) <= 0,
    eq: (v1: string, v2: string) => compareVersions(v1, v2) === 0
  };
};
