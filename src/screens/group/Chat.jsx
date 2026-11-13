import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router";
import { CHAT_POLL_MS, LIMITS } from "../../constants/app";
import { formatTime } from "../../lib/format";
import { messageService } from "../../services/messageService";
import { useSession } from "../../store/session";
import { Empty, Notice } from "../../components/ui";

const mergeById = (current, incoming) => {
  const known = new Set(current.map((message) => message.id));
  return [...current, ...incoming.filter((message) => !known.has(message.id))];
};

export function Chat() {
  const { group, isMember } = useOutletContext();
  const userId = useSession((state) => state.userId);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lastSeen = useRef(undefined);

  function receive(batch) {
    if (!batch.length) return;
    lastSeen.current = batch.at(-1).createdAt;
    setMessages((current) => mergeById(current, batch));
  }

  useEffect(() => {
    if (!isMember) return;
    let active = true;
    const poll = () =>
      messageService
        .list(group.id, lastSeen.current)
        .then((batch) => active && receive(batch))
        .catch((failure) => active && setError(failure.message));
    poll();
    const timer = setInterval(poll, CHAT_POLL_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [group.id, isMember]);

  async function send(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      receive([await messageService.post(group.id, draft.trim())]);
      setDraft("");
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  if (!isMember) return <Empty title="Only group members can chat" />;
  return (
    <section className="panel">
      <h2>Group chat</h2>
      <div className="chat-log">
        {messages.length === 0 && <p className="muted">No messages yet. Say hello and start planning.</p>}
        {messages.map((message) => (
          <div key={message.id} className={`chat-message ${message.author.id === userId ? "mine" : ""}`}>
            <small>
              {message.author.name} · {formatTime(message.createdAt)}
            </small>
            <p>{message.body}</p>
          </div>
        ))}
      </div>
      <Notice error>{error}</Notice>
      <form className="chat-form" onSubmit={send}>
        <input required maxLength={LIMITS.MESSAGE} placeholder="Write a message" value={draft} onChange={(e) => setDraft(e.target.value)} />
        <button disabled={busy || !draft.trim()}>Send</button>
      </form>
    </section>
  );
}
