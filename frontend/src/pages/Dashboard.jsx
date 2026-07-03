import React, { useEffect, useState } from 'react';
import SessionSidebar from '../components/SessionSidebar';
import IdeaInput from '../components/IdeaInput';
import AgentStatus from '../components/AgentStatus';
import DebateFeed from '../components/DebateFeed';
import { countGeneratedSections, mergeBlueprintSection } from '../utils/blueprintSections';
import {
  API_BACKEND_HINT,
  API_CONNECTION_LABEL,
  deleteSession as deleteSessionRequest,
  getSession,
  healthCheck,
  listSessions,
  streamSimulation,
} from '../services/api';
import { AlertCircle, CheckCircle2, FileText, PanelLeftClose, PanelLeftOpen, RefreshCw, Sparkles, Trash2, UsersRound, X } from 'lucide-react';
import {
  AnimatedContent,
  Aurora,
  Beams,
  LightRays,
  ShapeGrid,
  StarBorder,
} from '../components/reactbits/VisualEffects';

const HIDDEN_EVENT_TYPES = new Set([
  'status',
  'artifact',
  'section_updated',
  'section_update',
  'blueprint_update',
  'session_created',
  'session_loaded',
  'session_saved',
  'impact_assessment',
  'agent_selection',
  'round_started',
  'debate_needs_more',
]);

function isUserFacingEvent(event) {
  if (!event) return false;
  const content = typeof event.content === 'string' ? event.content.trim() : '';
  if (HIDDEN_EVENT_TYPES.has(event.type)) return false;
  if (/^Updated section\s+/i.test(content)) return false;
  if (/started (debate|round)|is preparing| joined$/i.test(content)) return false;
  if (event.role === 'system' || event.agent === 'System' || event.name === 'system') return false;
  if (event.type === 'info' && /^(Starting|Product Manager defining|Genesis is convening)/i.test(content)) {
    return false;
  }
  return Boolean(event.type || content);
}

function createClientMessageId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `msg:${Date.now()}:${Math.random().toString(36).slice(2)}`;
}

function isLocalChatId(chatId) {
  return String(chatId || '').startsWith('local:');
}

export default function Dashboard({ initialChatId = null }) {
  const [sessions, setSessions] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [sessionDetails, setSessionDetails] = useState(null);

  const [idea, setIdea] = useState('');
  const [streamActive, setStreamActive] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(null);
  const [activeAgent, setActiveAgent] = useState(null);
  const [, setCurrentRunId] = useState(null);
  const [events, setEvents] = useState([]);

  const [connectionState, setConnectionState] = useState('checking');
  const [connectionMessage, setConnectionMessage] = useState('');
  const [sessionPendingDelete, setSessionPendingDelete] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [connectionBannerHidden, setConnectionBannerHidden] = useState(false);

  const visibleEvents = events.filter(isUserFacingEvent);
  const generatedSectionCount = countGeneratedSections(sessionDetails);
  const hasConversation = visibleEvents.length > 0 || Boolean(sessionDetails);

  useEffect(() => {
    initializeConnection();
  }, [initialChatId]);

  const initializeConnection = async () => {
    const connected = await checkHealth();
    if (connected) {
      await loadSessionsList();
      if (initialChatId) {
        await handleSelectSession(initialChatId);
      }
    }
  };

  const checkHealth = async () => {
    setConnectionState('checking');
    setConnectionBannerHidden(false);
    try {
      await healthCheck();
      setConnectionState('connected');
      setConnectionMessage('');
      return true;
    } catch (e) {
      setConnectionState('offline');
      setConnectionBannerHidden(false);
      setConnectionMessage(
        `Backend is not reachable. Start it on ${API_BACKEND_HINT} or set VITE_USE_DIRECT_API=true with VITE_API_BASE_URL.`
      );
      return false;
    }
  };

  const loadSessionsList = async () => {
    try {
      const data = await listSessions();
      setSessions(data);
    } catch (error) {
      console.error('Failed to load sessions:', error);
      setConnectionState((state) => (state === 'connected' ? 'request-failed' : state));
      setConnectionBannerHidden(false);
      setConnectionMessage(`Saved sessions could not be loaded: ${error.message}`);
    }
  };

  const handleSelectSession = async (chatId) => {
    if (streamActive) return;
    if (isLocalChatId(chatId)) {
      setCurrentChatId(chatId);
      return;
    }
    try {
      setCurrentChatId(chatId);
      const details = await getSession(chatId);
      setSessionDetails(details);
      setIdea('');

      const hydratedEvents = hydrateSessionEvents(details).filter(isUserFacingEvent);
      setEvents(
        hydratedEvents.length > 0
          ? hydratedEvents
          : [
              {
                type: 'info',
                content: `Loaded blueprint session for: "${details.user_idea || details.title || chatId}"`,
                timestamp: details.updated_at,
              },
            ]
      );
      setCurrentPhase('Loaded');
      setActiveAgent(null);
    } catch (error) {
      console.error('Error loading session details:', error);
      setConnectionState('request-failed');
      setConnectionBannerHidden(false);
      setConnectionMessage(`Session details could not be loaded: ${error.message}`);
      setEvents((prev) => [
        ...prev,
        {
          type: 'error',
          content: `Failed to load session details: ${error.message}`,
          timestamp: Date.now() / 1000,
        },
      ]);
    }
  };

  const handleRequestDeleteSession = (session) => {
    if (streamActive) return;
    setSessionPendingDelete(session);
  };

  const handleCancelDeleteSession = () => {
    setSessionPendingDelete(null);
  };

  const handleConfirmDeleteSession = async () => {
    if (!sessionPendingDelete || streamActive) return;
    const chatId = sessionPendingDelete.id || sessionPendingDelete.chat_id;
    try {
      await deleteSessionRequest(chatId);
      setSessions((prev) => prev.filter((session) => (session.id || session.chat_id) !== chatId));
      setSessionPendingDelete(null);
      setToastMessage('Session deleted');
      window.setTimeout(() => setToastMessage(''), 2400);
      if (currentChatId === chatId) {
        setCurrentChatId(null);
        setSessionDetails(null);
        setIdea('');
        setEvents([]);
        setCurrentPhase(null);
        setActiveAgent(null);
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
      setConnectionState('request-failed');
      setConnectionBannerHidden(false);
      setConnectionMessage(`Session could not be deleted: ${error.message}`);
      setSessionPendingDelete(null);
    }
  };

  const handleGenerate = async () => {
    if (!idea.trim() || streamActive) return;

    const promptMessage = idea.trim();
    const optimisticChatId = currentChatId || `local:${Date.now()}`;
    const clientMessageId = createClientMessageId();
    let resolvedChatId = currentChatId && !isLocalChatId(currentChatId) ? currentChatId : null;
    let resolvedRunId = null;

    const adoptStreamIdentity = (event) => {
      if (event.run_id && event.run_id !== resolvedRunId) {
        resolvedRunId = event.run_id;
        setCurrentRunId(event.run_id);
      }

      if (!event.chat_id || isLocalChatId(event.chat_id)) return;
      if (resolvedChatId === event.chat_id) return;

      resolvedChatId = event.chat_id;
      setCurrentChatId(event.chat_id);
      setSessions((prev) => prev.filter((session) => (session.id || session.chat_id) !== optimisticChatId));
      setSessionDetails((prev) => ({
        ...(prev || {}),
        id: event.chat_id,
        chat_id: event.chat_id,
        title: prev?.title || promptMessage,
        user_idea: prev?.user_idea || promptMessage,
      }));
    };

    if (!currentChatId) {
      setCurrentChatId(optimisticChatId);
      setSessions((prev) => [
        {
          id: optimisticChatId,
          chat_id: optimisticChatId,
          title: promptMessage.length > 48 ? `${promptMessage.slice(0, 48)}...` : promptMessage,
          updated_at: Date.now() / 1000,
          local_only: true,
        },
        ...prev.filter((session) => (session.id || session.chat_id) !== optimisticChatId),
      ]);
    }
    setStreamActive(true);
    setCurrentPhase('Initializing');
    setActiveAgent(null);
    setCurrentRunId(null);
    setEvents([
      {
        id: clientMessageId,
        type: 'user_input',
        agent: 'User',
        content: promptMessage,
        timestamp: Date.now() / 1000,
      },
      {
        type: 'info',
        content: currentChatId
          ? 'Genesis is refining this blueprint with the executive team.'
          : 'Genesis is convening a fresh boardroom for this startup idea.',
        timestamp: Date.now() / 1000,
      },
    ]);
    setIdea('');

    await streamSimulation({
      message: promptMessage,
      chatId: resolvedChatId,
      clientMessageId,
      runId: resolvedRunId,
      onEvent: (event) => {
        adoptStreamIdentity(event);

        if (event.type === 'session_created' && event.chat_id) {
          loadSessionsList();
        }

        if (event.type === 'phase' && event.content) {
          setCurrentPhase(event.content);
        }

        if (event.agent) {
          setActiveAgent(event.agent);
        }

        if (event.type === 'section_updated' && event.section) {
          applyBlueprintSectionEvent(event);
        }

        if (event.type === 'agent_typing' || event.type === 'agent_delta') {
          setEvents((prev) => upsertStreamingAgentEvent(prev, event));
          return;
        }

        if (event.type === 'agent_response') {
          setEvents((prev) => finalizeStreamingAgentEvent(prev, event));
          return;
        }

        setEvents((prev) => [...prev, event]);

        if (event.type === 'session_saved' && event.chat_id) {
          fetchUpdatedSession(event.chat_id);
        }
      },
      onError: (err) => {
        setEvents((prev) => [
          ...prev,
          {
            type: 'error',
            content: `Simulation failed: ${err.message}`,
            timestamp: Date.now() / 1000,
          },
        ]);
        setConnectionState('request-failed');
        setConnectionBannerHidden(false);
        setConnectionMessage(`The stream request failed: ${err.message}`);
        setStreamActive(false);
        setCurrentPhase('Failed');
        setActiveAgent(null);
      },
      onDone: () => {
        setStreamActive(false);
        setCurrentPhase('Complete');
        setActiveAgent(null);
        if (resolvedChatId) {
          fetchUpdatedSession(resolvedChatId);
        }
        loadSessionsList();
      },
    });
  };

  const fetchUpdatedSession = async (chatId) => {
    try {
      const details = await getSession(chatId);
      setSessionDetails(details);
    } catch (e) {
      console.error('Error fetching completed session details:', e);
    }
  };

  const applyBlueprintSectionEvent = (event) => {
    setSessionDetails((prev) => {
      const chatId = event.chat_id || currentChatId || prev?.chat_id;
      if (!chatId) return prev;
      const sections = mergeBlueprintSection(
        prev?.sections || {},
        event.section,
        event.after || { content: event.content || '' }
      );
      return {
        ...(prev || {}),
        id: prev?.id || chatId,
        chat_id: chatId,
        title: prev?.title || idea || 'Live blueprint',
        user_idea: prev?.user_idea || idea,
        sections,
      };
    });
  };

  const streamingKey = (event) => `${event.agent || 'Agent'}:${event.round || 0}:${event.phase || 'debate'}`;

  const upsertStreamingAgentEvent = (prev, event) => {
    const key = streamingKey(event);
    const nextEvent = {
      ...event,
      id: event.id || `stream:${key}`,
      type: event.type === 'agent_typing' ? 'agent_typing' : 'agent_delta',
      content: event.content || '',
      streamingKey: key,
    };
    const index = prev.findIndex((item) => item.streamingKey === key);
    if (index < 0) return [...prev, nextEvent];
    const next = [...prev];
    next[index] = { ...next[index], ...nextEvent };
    return next;
  };

  const finalizeStreamingAgentEvent = (prev, event) => {
    const key = streamingKey(event);
    const finalEvent = {
      ...event,
      id: event.id || `final:${key}`,
      streamingKey: key,
    };
    const index = prev.findIndex((item) => item.streamingKey === key);
    if (index < 0) return [...prev, finalEvent];
    const next = [...prev];
    next[index] = finalEvent;
    return next;
  };

  const handleNewChat = () => {
    if (streamActive) return;
    setCurrentChatId(null);
    setSessionDetails(null);
    setIdea('');
    setEvents([]);
    setCurrentPhase(null);
    setActiveAgent(null);
    setCurrentRunId(null);
  };

  const handleReset = () => {
    if (streamActive) return;
    setIdea('');
  };

  const hydrateSessionEvents = (details) => {
    const messages = Array.isArray(details.messages) ? details.messages : [];
    return messages.map((message) => {
      const persistedEvent = message.event || message.metadata_json || {};
      return {
        ...persistedEvent,
        id: persistedEvent.id || message.id,
        type: persistedEvent.type || (message.role === 'user' ? 'user_input' : 'agent_response'),
        agent: persistedEvent.agent || message.agent_name || (message.role === 'user' ? 'User' : undefined),
        phase: persistedEvent.phase || message.phase,
        content: persistedEvent.content !== undefined ? persistedEvent.content : message.content,
        timestamp: persistedEvent.timestamp || message.created_at,
      };
    });
  };

  const renderStatus = () => {
    if (connectionState === 'connected') {
      return (
        <span className="connection-pill connected">
          <CheckCircle2 size={14} /> Connected
        </span>
      );
    }
    if (connectionState === 'checking') {
      return (
        <span className="connection-pill checking">
          <RefreshCw size={14} className="animate-spin" /> Checking
        </span>
      );
    }
    return (
      <span className="connection-pill offline">
        <AlertCircle size={14} /> {connectionState === 'request-failed' ? 'Request Failed' : 'Backend Offline'}
      </span>
    );
  };

  return (
    <div className={("genesis-app " + (sidebarHidden ? "sidebar-is-hidden" : "")).trim()}>
      <Aurora />
      <Beams />
      <LightRays />
      <div className="antigravity-overlay">
        <ShapeGrid
          direction="diagonal"
          speed={0.5}
          borderColor="rgba(66, 133, 244, 0.15)"
          hoverFillColor="rgba(66, 133, 244, 0.08)"
          squareSize={48}
          shape="circle"
          hoverTrailAmount={6}
        />
      </div>
      {!sidebarHidden && (
        <SessionSidebar
          sessions={sessions}
          currentChatId={currentChatId}
          onSelectSession={handleSelectSession}
          onDeleteSession={handleRequestDeleteSession}
          onNewChat={handleNewChat}
          onHideSidebar={() => setSidebarHidden(true)}
          streamActive={streamActive}
        />
      )}

      <main className={`chat-shell ${hasConversation ? 'has-conversation' : 'is-empty'}`}>
        <header className="chat-topbar">
          <div className="chat-brand">
            <div>
              <h1>Genesis Studio</h1>
            </div>
          </div>
        </header>

        {sidebarHidden ? (
          <button
            type="button"
            className="sidebar-canvas-toggle show-sidebar-button"
            onClick={() => setSidebarHidden(false)}
            aria-label="Show sidebar"
            title="Show sidebar"
          >
            <PanelLeftOpen size={16} />
          </button>
        ) : (
          <button
            type="button"
            className="sidebar-canvas-toggle hide-sidebar-button"
            onClick={() => setSidebarHidden(true)}
            aria-label="Hide sidebar"
            title="Hide sidebar"
          >
            <PanelLeftClose size={16} />
          </button>
        )}

        {connectionState !== 'connected' && !connectionBannerHidden && (
          <StarBorder className="connection-banner" role="status">
            <AlertCircle size={17} />
            <span>{connectionMessage || 'Checking the backend connection...'}</span>
            <button type="button" onClick={initializeConnection}>
              Retry
            </button>
            <button type="button" className="connection-dismiss" onClick={() => setConnectionBannerHidden(true)} aria-label="Dismiss message">
              <X size={16} />
            </button>
          </StarBorder>
        )}

        <section className="chat-stage">
          {!hasConversation ? (
            <AnimatedContent className="empty-state">
              <h2>Ready when you are.</h2>
              <p>
                Bring a raw startup idea and Genesis will convene research, product, finance, technical,
                market, risk, and MVP voices into one decision-ready blueprint.
              </p>
            </AnimatedContent>
          ) : (
            <div className="active-workspace">
              <div className="workspace-toolbar" aria-label="Workspace status">
                <details className="agent-status-drawer">
                  <summary>
                    <UsersRound size={16} />
                    <span>{activeAgent && streamActive ? `${activeAgent} active` : 'Agent status'}</span>
                  </summary>
                  <AgentStatus activeAgent={activeAgent} streamActive={streamActive} />
                </details>
                {currentChatId && (
                    <a className="btn btn-secondary btn-small cursor-target" href={`/chat/${encodeURIComponent(currentChatId)}/blueprint`}>
                      <FileText size={16} />
                      View Blueprint
                      {generatedSectionCount > 0 && <span className="btn-count">{generatedSectionCount}</span>}
                    </a>
                )}
              </div>
              <DebateFeed events={visibleEvents} />
            </div>
          )}
        </section>

        <div className="composer-dock">
          <IdeaInput
            idea={idea}
            setIdea={setIdea}
            onGenerate={handleGenerate}
            onReset={handleReset}
            streamActive={streamActive}
            currentChatId={currentChatId}
            currentPhase={currentPhase}
            connectionState={connectionState}
            apiLabel={API_CONNECTION_LABEL}
          />
        </div>
      </main>

      {sessionPendingDelete && (
        <div className="dialog-backdrop" role="presentation">
          <section
            className="confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-session-title"
          >
            <button
              type="button"
              className="dialog-close"
              onClick={handleCancelDeleteSession}
              aria-label="Cancel deletion"
            >
              <X size={17} />
            </button>
            <div className="dialog-icon danger" aria-hidden="true">
              <Trash2 size={18} />
            </div>
            <h2 id="delete-session-title">Delete saved session?</h2>
            <p>
              This removes "{sessionPendingDelete.title || 'Untitled Session'}" from saved sessions and cannot be restored.
            </p>
            <div className="dialog-actions">
              <button type="button" className="dialog-secondary" onClick={handleCancelDeleteSession}>
                Cancel
              </button>
              <button type="button" className="dialog-danger" onClick={handleConfirmDeleteSession}>
                Delete
              </button>
            </div>
          </section>
        </div>
      )}

      {toastMessage && (
        <div className="toast" role="status" aria-live="polite">
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
