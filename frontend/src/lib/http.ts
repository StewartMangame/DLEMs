export async function readJson<T = any>(
  response: Response,
  fallbackMessage = "Request failed",
): Promise<T> {
  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();

  if (!contentType.includes("application/json")) {
    const message = text.trim() || fallbackMessage;
    throw new Error(response.ok ? `Expected JSON response: ${message}` : message);
  }

  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.message || fallbackMessage);
  }

  return data;
}
