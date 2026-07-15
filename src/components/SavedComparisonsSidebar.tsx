import { type SavedComparison } from "../diff/types";

interface SavedComparisonsSidebarProps {
  isOpen: boolean;
  items: SavedComparison[];
  errorMessage: string | null;
  onToggle: () => void;
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
  isOpen,
  items,
  errorMessage,
  onToggle,
  onSaveCurrent,
  onLoad,
  onDelete,
}: SavedComparisonsSidebarProps) {
  if (!isOpen) {
    return (
      <aside className="saved-sidebar collapsed" aria-label="Saved comparisons">
        <button
          className="sidebar-toggle collapsed"
          onClick={onToggle}
          aria-expanded={false}
          aria-label="Open saved comparisons"
        >
          <span className="menu-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          </span>
          <span className="sidebar-toggle-label">Saved</span>
        </button>
      </aside>
    );
  }

  return (
    <aside className="saved-sidebar" aria-label="Saved comparisons">
      <div className="saved-sidebar-header">
        <h2>Saved</h2>
        <div className="saved-header-actions">
          <button className="btn btn-primary" onClick={onSaveCurrent}>
            Save current
          </button>
          <button className="btn sidebar-toggle" onClick={onToggle} aria-expanded={true}>
            Hide
          </button>
        </div>
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
