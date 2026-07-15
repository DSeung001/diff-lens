import { type SavedComparison } from "../diff/types";

interface SavedComparisonsSidebarProps {
  items: SavedComparison[];
  errorMessage: string | null;
  onSaveCurrent: () => void;
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
}

function extractTitle(item: SavedComparison): string {
  const base = item.before.trim().length > 0 ? item.before : item.after;
  const firstLine = base.split(/\r?\n/, 1)[0]?.trim() ?? "";
  return firstLine.length > 0 ? firstLine : "(empty)";
}

export function SavedComparisonsSidebar({
  items,
  errorMessage,
  onSaveCurrent,
  onLoad,
  onDelete,
}: SavedComparisonsSidebarProps) {
  return (
    <aside className="saved-sidebar" aria-label="Saved comparisons">
      <div className="saved-sidebar-header">
        <h2>Saved</h2>
        <button className="btn btn-primary" onClick={onSaveCurrent}>
          Save current
        </button>
      </div>

      {errorMessage ? <p className="saved-error">{errorMessage}</p> : null}

      {items.length === 0 ? (
        <p className="saved-empty">저장된 비교가 없습니다.</p>
      ) : (
        <ul className="saved-list">
          {items.map((item) => (
            <li key={item.id} className="saved-item">
              <button className="saved-item-main" onClick={() => onLoad(item.id)}>
                <span className="saved-item-title">{extractTitle(item)}</span>
                <span className="saved-item-date">
                  {new Date(item.createdAt).toLocaleString()}
                </span>
              </button>
              <button
                className="btn saved-delete"
                onClick={() => onDelete(item.id)}
                aria-label="Delete saved comparison"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
