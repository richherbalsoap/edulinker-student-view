export const applyCreatedAtFilter = (
  query: any,
  filterType: string,
  startDate: Date,
  endDate: Date,
) => {
  // Always apply date range — the range already accounts for "all" via year selector
  return query
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());
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
