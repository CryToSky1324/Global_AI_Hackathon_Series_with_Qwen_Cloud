import React from 'react';
import { History, MessageSquare, Plus, Sparkles, Trash2 } from 'lucide-react';

export default function SessionSidebar({
  sessions,
  currentChatId,
  onSelectSession,
  onDeleteSession,
  onNewChat,
  streamActive = false,
}) {
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp * 1000);
      return date.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return '';
    }
  };

  return (
    <aside className="sidebar" aria-label="Saved Genesis sessions">
      <div className="sidebar-header">
        <a href="/" className="sidebar-title-link sidebar-studio-title" aria-label="Return to Genesis home">
          <span className="genesis-logo-mark sidebar-mark" aria-hidden="true">G</span>
          <h2>Genesis Studio</h2>
        </a>
        <nav className="sidebar-nav" aria-label="Genesis Studio navigation">
          <button type="button" className="sidebar-nav-item is-active" onClick={onNewChat} disabled={streamActive}>
            <Plus size={16} />
            <span>New</span>
          </button>
          <a className="sidebar-nav-item" href="#saved-sessions">
            <History size={16} />
            <span>History</span>
          </a>
        </nav>
      </div>
      <div className="sidebar-list" id="saved-sessions">
        {sessions.length === 0 ? (
          <div className="empty-sidebar">
            <Sparkles size={18} />
            <span>No saved blueprints yet</span>
          </div>
        ) : (
          sessions.map((session) => {
            const sessionId = session.id || session.chat_id;
            return (
            <div
              key={sessionId}
              className={`sidebar-item ${currentChatId === sessionId ? 'active' : ''}`}
            >
              <button
                type="button"
                className="sidebar-item-main"
                onClick={() => onSelectSession(sessionId)}
                disabled={streamActive}
              >
                <div className="sidebar-item-inner">
                  <MessageSquare size={16} />
                  <div className="sidebar-item-copy">
                    <div className="session-title" title={session.title || 'Untitled Session'}>
                      {session.title || 'Untitled Session'}
                    </div>
                    <div className="session-date">
                      {formatDate(session.updated_at)}
                    </div>
                  </div>
                </div>
              </button>
              <button
                type="button"
                className="sidebar-delete"
                onClick={() => onDeleteSession?.(session)}
                disabled={streamActive}
                aria-label={`Delete ${session.title || 'Untitled Session'}`}
                title="Delete session"
              >
                <Trash2 size={15} />
              </button>
            </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
