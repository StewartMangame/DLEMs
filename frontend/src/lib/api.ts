export async function fetchInstitutions() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/institutions`, {
    next: { tags: ['institutions'] }
  });
  if (!res.ok) throw new Error('Failed to fetch institutions');
  return res.json();
}

export async function fetchSaccoBranches() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/institutions/sacco/branches`, {
    next: { tags: ['sacco-branches'] }
  });
  if (!res.ok) throw new Error('Failed to fetch SACCO branches');
  return res.json();
}

export async function fetchFincaProducts() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/institutions/finca/products`, {
    next: { tags: ['finca-products'] }
  });
  if (!res.ok) throw new Error('Failed to fetch FINCA products');
  return res.json();
}

export async function fetchInstitutionCriteria(id: number) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/institutions/${id}/criteria`, {
    next: { tags: [`institution-${id}-criteria`] }
  });
  if (!res.ok) throw new Error('Failed to fetch institution criteria');
  return res.json();
}

export async function checkEligibility(userProfile: any, selectedInstitutionIds: string[]) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/eligibility/check`, {
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
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/announcements/active`, {
    next: { tags: ['announcements-active'] }
  });
  if (!res.ok) throw new Error('Failed to fetch announcements');
  return res.json();
}

export async function fetchContentStrings() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/content/strings`, {
    next: { tags: ['content-strings'] }
  });
  if (!res.ok) throw new Error('Failed to fetch content strings');
  return res.json();
}