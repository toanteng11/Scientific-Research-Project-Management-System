/**
 * PlaceholderPage — Development scaffold component.
 *
 * Renders a clearly-labelled stub for routes whose full implementation
 * is deferred to a subsequent phase. Provides route metadata to assist
 * Phase 5 developers in identifying the correct API contract.
 *
 * @param {string} title       - Vietnamese page title
 * @param {string} route       - Canonical client-side route path
 * @param {number} [phase=5]   - Implementation phase number
 * @param {string} [role]      - Required SystemRole (for guard documentation)
 */
export default function PlaceholderPage({ title, route, phase = 5, role }) {
  return (
    <div className="p-8">
      <div className="max-w-2xl">
        <div className="flex items-center gap-3 mb-1">
          <span className="inline-block px-2 py-0.5 rounded text-xs font-mono font-semibold
                           bg-blue-100 text-blue-700 border border-blue-200">
            Phase {phase}
          </span>
          {role && (
            <span className="inline-block px-2 py-0.5 rounded text-xs font-mono font-semibold
                             bg-purple-100 text-purple-700 border border-purple-200">
              {role}
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">{title}</h1>
        <p className="text-sm text-gray-500 mt-1 font-mono">{route}</p>
        <div className="mt-6 p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50">
          <p className="text-sm text-gray-600">
            Trang này đang trong giai đoạn phát triển. Toàn bộ logic nghiệp vụ, form, và tích hợp API
            sẽ được hoàn thiện ở Phase {phase}.
          </p>
        </div>
      </div>
    </div>
  );
}
