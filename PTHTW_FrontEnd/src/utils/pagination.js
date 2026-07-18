/**
 * Aggregates Spring Data {@code Page} JSON payloads by requesting successive {@code page} indices
 * until {@code last} is true or a safety bound is reached.
 *
 * @param {(params: { page: number, size: number }) => Promise<import('axios').AxiosResponse>} requestPage
 * @param {{ pageSize?: number }} [options]
 * @returns {Promise<Array<unknown>>}
 */
export async function fetchAllSpringPageContents(requestPage, options = {}) {
  const pageSize = options.pageSize ?? 50;
  const maxIterations = 500;
  let page = 0;
  const out = [];
  for (let i = 0; i < maxIterations; i += 1) {
    const res = await requestPage({ page, size: pageSize });
    const d = res.data;
    const content = Array.isArray(d?.content) ? d.content : [];
    out.push(...content);
    if (d?.last === true || content.length === 0) break;
    if (typeof d?.totalPages === 'number' && d.totalPages > 0 && page >= d.totalPages - 1) break;
    page += 1;
  }
  return out;
}
