import { readJson } from "./http";

function apiUrl(path: string) {
  const base =
    typeof window === 'undefined' ? process.env.NEXT_PUBLIC_API_URL || '' : '';
  return `${base}${path}`;
}

export async function fetchInstitutions() {
  const res = await fetch(apiUrl('/api/institutions'), {
    cache: 'no-store',
  });
  return readJson(res, 'Failed to fetch institutions');
}

export async function fetchFincaProducts() {
  const res = await fetch(apiUrl('/api/institutions/finca/products'), {
    cache: 'no-store',
  });
  return readJson(res, 'Failed to fetch FINCA products');
}

export async function fetchInstitutionCriteria(id: number) {
  const res = await fetch(apiUrl(`/api/institutions/${id}/criteria`), {
    cache: 'no-store',
  });
  return readJson(res, 'Failed to fetch institution criteria');
}

export async function checkEligibility(
  userProfile: any,
  selectedInstitutionIds: string[],
  options: { selectedProductId?: string } = {},
) {
  const res = await fetch(apiUrl('/api/eligibility/check'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_profile: userProfile,
      selected_institution_ids: selectedInstitutionIds,
      selected_product_id: options.selectedProductId,
    }),
  });
  return readJson(res, 'Failed to check eligibility');
}

export async function fetchActiveAnnouncements() {
  const res = await fetch(apiUrl('/api/announcements/active'), {
    cache: 'no-store',
  });
  return readJson(res, 'Failed to fetch announcements');
}

export async function fetchContentStrings() {
  const res = await fetch(apiUrl('/api/content/strings'), {
    cache: 'no-store',
  });
  return readJson(res, 'Failed to fetch content strings');
}
