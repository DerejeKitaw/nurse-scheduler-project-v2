/*  ChatBox – main UI glue component • v2.0
    ──────────────────────────────────────── */
import * as React from "react";
import {
  Stack, TextField, PrimaryButton, IconButton,
  Persona, PersonaSize, ActionButton
} from "@fluentui/react";
import styles from "./ChatBox.module.scss";
import { Message, ScheduleState } from "./types";
import { initSchedule } from "./helpers/shiftUtils";
import { handleSend } from "./helpers/handleSend";
import { useSpeechRecognition } from "./hooks/useSpeechRecognition";
import { ShiftTable } from "./helpers/shiftTable";

import * as ReactDOM from "react-dom";
import { NurseScheduleItem } from "../../types/types";
import { CalendarPanel } from "../../calendar/CalendarPanel";

/* ─────────────────────────────────────────────────────────── */
/* reducer setup                                              */
/* ─────────────────────────────────────────────────────────── */
interface FullState {
  input: string;
  loading: boolean;
  schedule: ScheduleState;
  messages: Message[];
  showDebug: boolean;
  botTyping: boolean;
  showCalendar: boolean;
}

type Act =
  | { type: "INPUT"; v: string }
  | { type: "LOADING"; v: boolean }
  | { type: "SET_SCHEDULE"; v: ScheduleState }
  | { type: "ADD"; msg: Message }
  | { type: "TOGGLE_DEBUG" }
  | { type: "BOT_TYPING"; v: boolean }
  | { type: "TOGGLE_CAL" };

const initial: FullState = {
  input: "", loading: false, schedule: initSchedule,
  messages: [], showDebug: false, botTyping: false, showCalendar: false
};

function reducer(s: FullState, a: Act): FullState {
  switch (a.type) {
    case "INPUT": return { ...s, input: a.v };
    case "LOADING": return { ...s, loading: a.v };
    case "SET_SCHEDULE": return { ...s, schedule: a.v };
    case "ADD": return { ...s, messages: [...s.messages, a.msg] };
    case "TOGGLE_DEBUG": return { ...s, showDebug: !s.showDebug };
    case "BOT_TYPING": return { ...s, botTyping: a.v };
    case "TOGGLE_CAL": return { ...s, showCalendar: !s.showCalendar };
  }
}

/* handy day-chip label */
const dayLabel = (d: Date) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = (d.getTime() - today.getTime()) / 8.64e7;
  if (diff === 0) return "Today";
  if (diff === -1) return "Yesterday";
  if (diff === 1) return "Tomorrow";
  return d.toLocaleDateString(undefined,
    { weekday: "short", day: "numeric", month: "short", year: "numeric" });
};

/* ─────────────────────────────────────────────────────────── */
/* component                                                  */
/* ─────────────────────────────────────────────────────────── */
export const ChatBox: React.FC<{ userCtx: { name: string; email: string; id: number } }> =
  ({ userCtx }) => {
    const [st, dispatch] = React.useReducer(reducer, initial);

    /* helper to push a bubble */
    const add = (c: string, sender: "user" | "ai", quick?: any) =>
      dispatch({ type: "ADD", msg: { sender, content: c, quick, timestamp: Date.now() } });

    /* central send handler */
    const send = (txt: string) => {
      if (/open calendar|show calendar/i.test(txt)) {
        dispatch({ type: "TOGGLE_CAL" }); return;
      }
      if (!txt.trim()) return;

      dispatch({ type: "BOT_TYPING", v: true });
      handleSend(
        txt, userCtx, st.schedule,
        v => dispatch({ type: "SET_SCHEDULE", v }),
        (c, sndr, q) => add(c, sndr, q),
        v => dispatch({ type: "LOADING", v })
      ).finally(() => dispatch({ type: "BOT_TYPING", v: false }));
      dispatch({ type: "INPUT", v: "" });
    };

    /* speech hook */
    const { start, isListening } = useSpeechRecognition(
      (v: string) => dispatch({ type: "INPUT", v })
    );

    /* mount ShiftTable dynamically when handleSend fires a renderTable event */
    React.useEffect(() => {
      const fn = (e: any) => {
        const items = e.detail as NurseScheduleItem[];
        const anchor = document.querySelector(`#shift-table-${items[0].Id}`)?.parentElement;
        if (!anchor) return;
        const root = document.createElement("div");
        anchor.replaceWith(root);

        const rerender = (id: number) => root.dispatchEvent(new CustomEvent("deleted", { detail: id }));

        const Table = () => <ShiftTable items={items} onDelete={rerender} />;
        ReactDOM.render(<Table />, root);

        root.addEventListener("deleted", (ev: any) => {
          const idx = items.findIndex(x => x.Id === ev.detail);
          if (idx > -1) { items.splice(idx, 1); ReactDOM.render(<Table />, root); }
        });
      };
      window.addEventListener("renderTable", fn);
      return () => window.removeEventListener("renderTable", fn);
    }, []);

    /* auto-scroll + jump-to-bottom button */
    const bottomRef = React.useRef<HTMLDivElement>(null);
    const paneRef = React.useRef<HTMLDivElement>(null);
    const [showJump, setShowJump] = React.useState(false);

    const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    React.useEffect(scrollToBottom, [st.messages, st.botTyping]);

    React.useEffect(() => {
      const io = new IntersectionObserver(
        ([e]) => setShowJump(!e.isIntersecting),
        { root: paneRef.current, threshold: 1 }
      );
      if (bottomRef.current) io.observe(bottomRef.current);
      return () => io.disconnect();
    }, []);

    /* greet once */
    React.useEffect(() => {
      add("👋 Hi! I’m your Nurse Scheduling Assistant. I can schedule shifts, show your availability or detect conflicts. How can I help?", "ai");
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ────────── UI ────────── */
    return (
      <Stack className={styles.wrapper}>
        {/* header */}
        <Stack horizontal className={styles.header} horizontalAlign="space-between">
          <span>Agent</span>
          <ActionButton iconProps={{ iconName: st.showDebug ? "Hide3" : "DeveloperTools" }}
            onClick={() => dispatch({ type: "TOGGLE_DEBUG" })} />
        </Stack>

        {/* message pane */}
        <div className={styles.pane} ref={paneRef}>
          {st.messages.map((m, i) => {
            const prev = st.messages[i - 1];
            const tsDay = dayLabel(new Date(m.timestamp));
            const showChip = i === 0 || dayLabel(new Date(prev!.timestamp)) !== tsDay;
            return (
              <React.Fragment key={i}>
                {showChip && <div className={styles.dayChip}>{tsDay}</div>}
                <Stack horizontal horizontalAlign={m.sender === "user" ? "end" : "start"}>
                  {m.sender === "ai" && <Persona size={PersonaSize.size24} initialsColor={3} text="AI" />}
                  <Stack className={`${styles.bubble} ${m.sender === "user" ? styles.user : ""}`}>
                    <span dangerouslySetInnerHTML={{ __html: m.content }} />
                    {!!m.quick?.length &&
                      <div className={styles.quickRow}>
                        {m.quick.map((q: any) =>
                          <ActionButton key={q.title}
                            styles={{ root: { padding: "2px 6px" } }}
                            onClick={() => send(q.payload)}>{q.title}</ActionButton>)}
                      </div>}
                  </Stack>
                </Stack>
              </React.Fragment>);
          })}
          {st.botTyping &&
            <Stack horizontal horizontalAlign="start">
              <Persona size={PersonaSize.size24} initialsColor={3} text="AI" />
              <div className={styles.typing}>… typing</div>
            </Stack>}
          <div ref={bottomRef} />
        </div>

        {/* jump-to-bottom */}
        {showJump &&
          <ActionButton className={styles.jumpBtn}
            iconProps={{ iconName: "ChevronDown" }}
            onClick={scrollToBottom}>Jump to latest</ActionButton>}

        {/* input row */}
        <div className={styles.inputRow}>
          <TextField className={styles.input}
            placeholder="Type a message…"
            value={st.input}
            onChange={(_, v) => dispatch({ type: "INPUT", v: v || "" })}
            onKeyDown={e => e.key === "Enter" && send(st.input)} />
          <IconButton iconProps={{ iconName: "Microphone" }}
            onClick={start}
            className={isListening ? styles.micOn : undefined} />
          <PrimaryButton text="Send" disabled={!st.input} onClick={() => send(st.input)} />
        </div>

        {/* debug */}
 

        {/* calendar side-panel */}
        <CalendarPanel
          visible={st.showCalendar}
          onDismiss={() => dispatch({ type: "TOGGLE_CAL" })}
          onDayPick={(iso: string) => {
            const dateOnly = iso.slice(0, 10);
            dispatch({ type: "INPUT", v: `Schedule me on ${dateOnly}` });
            send(`Schedule me on ${dateOnly}`);
          }}
        />
      </Stack>);
  };

export default ChatBox;
