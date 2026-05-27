function apiUrl(path: string) {
  const base =
    typeof window === 'undefined' ? process.env.NEXT_PUBLIC_API_URL || '' : '';
  return `${base}${path}`;
}

export async function fetchInstitutions() {
  const res = await fetch(apiUrl('/api/institutions'), {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch institutions');
  return res.json();
}

export async function fetchSaccoBranches() {
  const res = await fetch(apiUrl('/api/institutions/sacco/branches'), {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch SACCO branches');
  return res.json();
}

export async function fetchFincaProducts() {
  const res = await fetch(apiUrl('/api/institutions/finca/products'), {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch FINCA products');
  return res.json();
}

export async function fetchInstitutionCriteria(id: number) {
  const res = await fetch(apiUrl(`/api/institutions/${id}/criteria`), {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch institution criteria');
  return res.json();
}

export async function checkEligibility(userProfile: any, selectedInstitutionIds: string[]) {
  const res = await fetch(apiUrl('/api/eligibility/check'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_profile: userProfile,
      selected_institution_ids: selectedInstitutionIds,
    }),
  });
  if (!res.ok) throw new Error('Failed to check eligibility');
  return res.json();
}

export async function fetchActiveAnnouncements() {
  const res = await fetch(apiUrl('/api/announcements/active'), {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch announcements');
  return res.json();
}

export async function fetchContentStrings() {
  const res = await fetch(apiUrl('/api/content/strings'), {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch content strings');
  return res.json();
}
