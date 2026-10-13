import { useEffect, useRef } from 'react';
import { PLAYER } from '../engine/chat';
import { formatClock, typingByChannel } from '../engine/selectors';
import { useStore } from '../store';
import { Avatar, playerAvatar } from '../ui';

export function ChatApp() {
  const game = useStore((s) => s.game)!;
  const content = useStore((s) => s.content);
  const activeChannel = useStore((s) => s.activeChannel);
  const setChannel = useStore((s) => s.setChannel);
  const dispatch = useStore((s) => s.dispatch);
  const isFocused = useStore((s) => s.focused === 'chat');
  const bottom = useRef<HTMLDivElement>(null);

  const channel = content.channels.find((ch) => ch.id === activeChannel) ?? content.channels[0];
  const messages = game.chat.messages.filter((m) => m.channel === channel.id);
  const typing = typingByChannel(game, content);
  const awaitingHere = game.chat.awaiting
    .map((a) => content.chats.find((e) => e.id === a.eventId))
    .find((e) => e?.channel === channel.id);
  const awaitingChannels = new Set(
    game.chat.awaiting.map((a) => content.chats.find((e) => e.id === a.eventId)?.channel).filter(Boolean),
  );
  const unreadHere = game.chat.unread[channel.id] ?? 0;

  useEffect(() => {
    if (isFocused && unreadHere > 0) dispatch({ type: 'CHAT_READ', channel: channel.id });
  }, [isFocused, unreadHere, channel.id, dispatch]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end' });
  }, [messages.length, channel.id, typing[channel.id]]);

  const me = playerAvatar(game.setup.playerName);

  return (
    <div className="flex h-full min-h-0">
      <nav className="scroll-thin w-44 shrink-0 overflow-y-auto border-r border-slate-700 bg-slate-950/60 py-2 text-sm">
        {(['channel', 'dm'] as const).map((kind) => (
          <div key={kind} className="mb-2">
            <div className="px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-wider text-slate-500">
              {kind === 'channel' ? 'Channels' : 'Direct messages'}
            </div>
            {content.channels
              .filter((ch) => ch.kind === kind)
              .map((ch) => {
                const unread = game.chat.unread[ch.id] ?? 0;
                const needsReply = awaitingChannels.has(ch.id);
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => setChannel(ch.id)}
                    className={`flex w-full items-center justify-between gap-2 px-3 py-1 text-left ${
                      ch.id === channel.id ? 'bg-emerald-600/25 text-white' : 'text-slate-300 hover:bg-slate-800'
                    } ${unread > 0 ? 'font-semibold text-white' : ''}`}
                  >
                    <span className="truncate">
                      {kind === 'channel' ? '# ' : ''}
                      {ch.name}
                    </span>
                    {unread > 0 ? (
                      <span className="rounded-full bg-rose-500 px-1.5 text-[0.72rem] font-bold text-white">{unread}</span>
                    ) : needsReply ? (
                      <span className="h-2 w-2 rounded-full bg-amber-400" title="Waiting for your reply" />
                    ) : null}
                  </button>
                );
              })}
          </div>
        ))}
      </nav>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-slate-700 px-4 py-2">
          <div className="text-sm font-semibold text-white">
            {channel.kind === 'channel' ? '# ' : ''}
            {channel.name}
          </div>
          {channel.topic && <div className="text-xs text-slate-400">{channel.topic}</div>}
        </header>

        <div className="scroll-thin min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
          {messages.length === 0 && <p className="pt-8 text-center text-sm text-slate-500">No messages here yet.</p>}
          {messages.map((m) => {
            const mine = m.from === PLAYER;
            const npc = mine ? me : content.npcs[m.from];
            return (
              <div key={m.id} className="flex gap-2.5">
                <Avatar npc={npc} />
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-white">{mine ? game.setup.playerName : content.npcs[m.from]?.name}</span>
                    <span className="text-[0.72rem] text-slate-500">{formatClock(m.minute)}</span>
                  </div>
                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-200">{m.text}</p>
                </div>
              </div>
            );
          })}
          {typing[channel.id] && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Avatar npc={content.npcs[typing[channel.id]]} size={20} />
              <span>{content.npcs[typing[channel.id]]?.name.split(' ')[0]} is typing</span>
              <span className="flex gap-0.5">
                <i className="typing-dot h-1 w-1 rounded-full bg-slate-400" />
                <i className="typing-dot h-1 w-1 rounded-full bg-slate-400" />
                <i className="typing-dot h-1 w-1 rounded-full bg-slate-400" />
              </span>
            </div>
          )}
          <div ref={bottom} />
        </div>

        <footer className="border-t border-slate-700 bg-slate-950/40 p-3">
          {awaitingHere?.replies ? (
            <div className="space-y-1.5">
              <div className="text-[0.8rem] font-medium uppercase tracking-wide text-amber-300">Choose your reply</div>
              {awaitingHere.replies.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => dispatch({ type: 'CHAT_REPLY', eventId: awaitingHere.id, replyId: r.id })}
                  className="block w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-left text-sm text-slate-100 hover:border-emerald-500 hover:bg-slate-700"
                >
                  {r.text}
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-500">
              {awaitingChannels.size > 0 ? 'Someone is waiting for your reply in another conversation.' : 'Nothing to answer here right now.'}
            </div>
          )}
        </footer>
      </section>
    </div>
  );
}
