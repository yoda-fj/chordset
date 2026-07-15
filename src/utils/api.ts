/** fetch JSON com tratamento de erro padronizado: lança Error com o `error` do corpo da resposta */
export async function apiFetch<T = unknown>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options)
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error((data as { error?: string }).error || `Erro ${response.status}`)
  }
  return data as T
}
