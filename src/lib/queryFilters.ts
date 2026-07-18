export const applyCreatedAtFilter = (
  query: any,
  filterType: string,
  startDate: Date,
  endDate: Date,
) => {
  // Format to SQLite format YYYY-MM-DD HH:MM:SS (Worker expects this for string comparison)
  const formatSqliteDate = (d: Date) => d.toISOString().replace('T', ' ').substring(0, 19);

  return query
    .gte('created_at', formatSqliteDate(startDate))
    .lte('created_at', formatSqliteDate(endDate));
};

export const applySchoolScopeFilter = (
  query: any,
  schoolId: string | null | undefined,
  includeLegacyNull = false,
) => {
  if (!schoolId) {
    return query.is('school_id', null);
  }

  if (includeLegacyNull) {
    return query.or(`school_id.eq.${schoolId},school_id.is.null`);
  }

  return query.eq('school_id', schoolId);
};
