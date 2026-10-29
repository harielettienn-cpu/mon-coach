
"use client";

import { useEffect, useMemo, useState } from "react";

type Status = "Active" | "En pause" | "Terminée";
type Goal =
  | "Draguer"
  | "Relancer"
  | "Créer de l’intérêt"
  | "Clore la discussion";
type Mode = "Rapide" | "Développée";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

type Contact = {
  id: string;
  name: string;
  status: Status;
  style: string;
  goal: Goal;
  messages: Message[];
  summary: string;
  createdAt: string;
};

const STORAGE_KEY = "mon-coach-complet-v1";

const STYLES = [
  "Amical",
  "Calme",
  "Dragueur",
  "Sarcastique",
  "Mystérieux",
  "Provocateur",
  "Énergétique",
  "Philosophe",
  "Sec / direct",
  "Curieux",
  "Flirty léger",
  "Dominant / confiant",
  "Timide / introverti",
  "Humoriste / clown",
];

const GOALS: Goal[] = [
  "Draguer",
  "Relancer",
  "Créer de l’intérêt",
  "Clore la discussion",
];

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createContact(name: string): Contact {
  return {
    id: makeId(),
    name,
    status: "Active",
    style: "Amical",
    goal: "Créer de l’intérêt",
    messages: [],
    summary: "",
    createdAt: new Date().toISOString(),
  };
}

function analyze(text: string) {
  const s = text.toLowerCase().trim();

  if (!s) {
    return {
      label: "En attente d’un message",
      advice:
        "Colle un message reçu pour obtenir une analyse indicative.",
    };
  }

  const positive = [
    "haha",
    "😂",
    "😊",
    "😍",
    "😘",
    "oui",
    "grave",
    "trop bien",
    "j'adore",
    "merci",
    "raconte",
  ];

  const cold = ["ok", "bof", "laisse tomber", "non", "vu"];

  const positiveHits = positive.filter((word) =>
    s.includes(word)
  ).length;

  const coldHits = cold.filter(
    (word) => s === word || s.startsWith(word + " ")
  ).length;

  if (positiveHits > 0 || text.includes("?")) {
    return {
      label: "Plutôt engageant",
      advice:
        "Le message contient peut-être des signes d'ouverture. Réponds naturellement et rebondis sur un détail précis. Un seul message ne suffit pas à connaître les intentions de la personne.",
    };
  }

  if (coldHits > 0 || s.length < 5) {
    return {
      label: "Possiblement distant",
      advice:
        "Le message donne peu d'indices. Évite de tirer des conclusions trop vite. Tu peux poser une question simple, sans pression.",
    };
  }

  return {
    label: "Neutre ou ambigu",
    advice:
      "Le texte seul ne permet pas de connaître ses intentions. Reste naturel et observe comment la conversation évolue.",
  };
}

function generateReplies(
  text: string,
  style: string,
  goal: Goal,
  mode: Mode
): string[] {
  const short = mode === "Rapide";

  const responses: Record<Goal, string[]> = {
    Draguer: [
      "Je dois avouer que j’aime bien parler avec toi 😉",
      "Tu sais que tu es plutôt intéressante à découvrir ?",
      "Attention, à force de me parler comme ça, je vais prendre goût à nos échanges 😏",
    ],
    Relancer: [
      "Au fait, comment s’est passée ta journée ?",
      "Je repensais à ce que tu m’avais raconté. Alors, ça a donné quoi ?",
      "Petite question en passant : quoi de neuf depuis la dernière fois ?",
    ],
    "Créer de l’intérêt": [
      "C’est intéressant… je suis curieux de savoir ce que tu en penses vraiment.",
      "J’ai une petite question pour toi, mais je veux d’abord ton avis 😉",
      "Je crois qu’on n’a pas encore abordé le sujet le plus intéressant 😄",
    ],
    "Clore la discussion": [
      "J’ai bien aimé discuter avec toi. On se reparle bientôt 😊",
      "Je te laisse pour le moment, passe une belle journée !",
      "On reprendra cette conversation avec plaisir une prochaine fois.",
    ],
  };

  const prefixes: Record<string, string> = {
    Amical: "Franchement, ",
    Calme: "Je vois, ",
    Dragueur: "Alors toi, ",
    Sarcastique: "Ah, évidemment… ",
    Mystérieux: "C’est intéressant… ",
    Provocateur: "Tu cherches à me tester, c’est ça ? ",
    Énergétique: "Ah mais j’adore ! ",
    Philosophe: "C’est drôle comme ",
    "Sec / direct": "Pour être honnête, ",
    Curieux: "Attends, je veux comprendre : ",
    "Flirty léger": "Hmm, ",
    "Dominant / confiant": "Je vais être franc : ",
    "Timide / introverti": "Je ne sais pas pourquoi, mais ",
    "Humoriste / clown": "Bon, alerte information capitale : ",
  };

  const base = [...responses[goal]];

  if (text.includes("?")) {
    base.push(
      short
        ? "Bonne question 😄 Et toi, tu en penses quoi ?"
        : "Bonne question 😄 Je pourrais te donner mon avis, mais je veux aussi connaître le tien. Qu’en penses-tu ?"
    );
  }

  const prefix = prefixes[style] ?? "";

  return base.slice(0, 3).map((reply, index) => {
    if (index === 0 && prefix) {
      return (
        prefix +
        reply.charAt(0).toLowerCase() +
        reply.slice(1)
      );
    }

    return reply;
  });
}

function summarize(messages: Message[]): string {
  if (messages.length === 0) {
    return "Pas encore de messages dans cette conversation.";
  }

  const incoming = messages.filter(
    (message) => message.role === "user"
  ).length;

  const lastMessages = messages.slice(-4).map(
    (message) =>
      `${
        message.role === "user"
          ? "Message reçu"
          : "Réponse proposée"
      } : ${message.content}`
  );

  return [
    `Messages enregistrés : ${messages.length}`,
    `Messages reçus : ${incoming}`,
    "",
    "Derniers échanges :",
    ...lastMessages,
  ].join("\n");
}

export default function Home() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [newName, setNewName] = useState("");
  const [search, setSearch] = useState("");
  const [incoming, setIncoming] = useState("");
  const [mode, setMode] = useState<Mode>("Rapide");
  const [replies, setReplies] = useState<string[]>([]);
  const [replyIndex, setReplyIndex] = useState(0);
  const [notice, setNotice] = useState("");

  
  useEffect(() => {
    try {
      // Efface les anciennes conversations une seule fois sur cet appareil.
      const RESET_KEY = "mon-coach-reset-v1";
      const alreadyReset = localStorage.getItem(RESET_KEY);

      if (!alreadyReset) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.setItem(RESET_KEY, "done");
      }

      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved) as Contact[];

        if (Array.isArray(parsed)) {
          setContacts(parsed);
        }
      } else {
        setContacts([]);
      }
    } catch {
      setNotice("Impossible de lire la sauvegarde locale.");
    } finally {
      setLoaded(true);
    }
  }, []);


  useEffect(() => {
    if (!loaded) return;

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(contacts)
      );
    } catch {
      setNotice("Impossible de sauvegarder les conversations.");
    }
  }, [contacts, loaded]);

  useEffect(() => {
    if (!selectedId && contacts.length > 0) {
      setSelectedId(contacts[0].id);
      return;
    }

    if (
      selectedId &&
      !contacts.some((contact) => contact.id === selectedId)
    ) {
      setSelectedId(contacts[0]?.id ?? "");
    }
  }, [contacts, selectedId]);

  const selected = contacts.find(
    (contact) => contact.id === selectedId
  );

  const filtered = useMemo(
    () =>
      contacts.filter((contact) =>
        contact.name
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [contacts, search]
  );

  const analysis = analyze(incoming);

  function updateSelected(patch: Partial<Contact>) {
    if (!selected) return;

    setContacts((previous) =>
      previous.map((contact) =>
        contact.id === selected.id
          ? { ...contact, ...patch }
          : contact
      )
    );
  }

  function addContact() {
    const name = newName.trim();

    if (!name) {
      setNotice("Entre le nom du contact.");
      return;
    }

    if (contacts.length >= 40) {
      setNotice(
        "Tu as atteint la limite de 40 conversations."
      );
      return;
    }

    const contact = createContact(name);

    setContacts((previous) => [...previous, contact]);
    setSelectedId(contact.id);
    setNewName("");
    setIncoming("");
    setReplies([]);
    setReplyIndex(0);
    setNotice("Conversation créée.");
  }

  function addMessage(
    role: Message["role"],
    content: string
  ) {
    if (!selected || !content.trim()) return;

    const message: Message = {
      id: makeId(),
      role,
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };

    setContacts((previous) =>
      previous.map((contact) =>
        contact.id === selected.id
          ? {
              ...contact,
              messages: [...contact.messages, message],
            }
          : contact
      )
    );
  }

  function saveIncoming() {
    if (!incoming.trim()) {
      setNotice("Écris ou colle le message reçu.");
      return;
    }

    addMessage("user", incoming);
    setIncoming("");
    setReplies([]);
    setReplyIndex(0);
    setNotice(
      "Message enregistré dans cette conversation."
    );
  }

  async function generate() {
    if (!selected) return;

    if (!incoming.trim()) {
      setNotice("Colle d’abord le message reçu.");
      return;
    }

    setNotice(
      "L’intelligence artificielle prépare les réponses…"
    );
    setReplies([]);
    setReplyIndex(0);

    try {
      const response = await fetch(
        "http://localhost:3001/api/repondre",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: incoming.trim(),
            contactName: selected.name,
            style: selected.style,
            goal: selected.goal,
            mode,
            history: selected.messages.map((message) => ({
              role: message.role,
              content: message.content,
            })),
          }),
        }
      );

      const data: unknown = await response.json();

      if (!response.ok) {
        const errorMessage =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof data.error === "string"
            ? data.error
            : "Impossible de générer les réponses.";

        throw new Error(errorMessage);
      }

      if (
        typeof data !== "object" ||
        data === null ||
        !("replies" in data) ||
        !Array.isArray(data.replies)
      ) {
        throw new Error(
          "Le format des réponses reçu depuis l’API est invalide."
        );
      }

      const generatedReplies = data.replies
        .map((reply: unknown) => {
          if (
            typeof reply === "object" &&
            reply !== null &&
            "text" in reply &&
            typeof reply.text === "string"
          ) {
            return reply.text.trim();
          }

          return "";
        })
        .filter((reply: string) => reply.length > 0);

      if (generatedReplies.length === 0) {
        throw new Error(
          "L’IA n’a retourné aucune réponse exploitable."
        );
      }

      setReplies(generatedReplies);
      setReplyIndex(0);
      setNotice(
        "Réponses générées par l’intelligence artificielle."
      );
    } catch (error) {
      console.error("Erreur de génération :", error);

      setNotice(
        error instanceof Error
          ? error.message
          : "Une erreur est survenue. Réessaie."
      );
    }
  }

  function chooseReply() {
    const reply = replies[replyIndex];

    if (!reply) {
      setNotice("Aucune réponse à ajouter.");
      return;
    }

    addMessage("assistant", reply);
    setNotice("Réponse ajoutée à l’historique.");
  }

  function resetConversation() {
    if (!selected) return;

    if (
      !window.confirm(
        `Effacer les messages de ${selected.name} ?`
      )
    ) {
      return;
    }

    updateSelected({ messages: [], summary: "" });
    setReplies([]);
    setReplyIndex(0);
    setIncoming("");
    setNotice("Historique réinitialisé.");
  }

  function duplicateConversation() {
    if (!selected) return;

    if (contacts.length >= 40) {
      setNotice(
        "Tu as atteint la limite de 40 conversations."
      );
      return;
    }

    const copy: Contact = {
      ...selected,
      id: makeId(),
      name: `${selected.name} (copie)`,
      messages: selected.messages.map((message) => ({
        ...message,
        id: makeId(),
      })),
      createdAt: new Date().toISOString(),
    };

    setContacts((previous) => [...previous, copy]);
    setSelectedId(copy.id);
    setIncoming("");
    setReplies([]);
    setReplyIndex(0);
    setNotice("Conversation dupliquée.");
 }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-2xl text-white">
              ✦
            </div>

            <div>
              <h1 className="text-xl font-bold">Mon Coach</h1>
              <p className="text-xs text-slate-500">
                Ton assistant conversationnel
              </p>
            </div>
          </div>

          <span className="rounded-full bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700">
            {contacts.length}/40 contacts
          </span>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 p-4 lg:grid-cols-[290px_minmax(0,1fr)]">
        <aside className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-bold">Mes contacts</h2>

          <form
            className="mb-3 flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              addContact();
            }}
          >
            <input
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="Nom du contact"
              maxLength={80}
              className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />

            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-3 py-2 font-bold text-white"
            >
              +
            </button>
          </form>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un contact…"
            className="mb-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />

          <div className="max-h-[60vh] space-y-2 overflow-y-auto">
            {filtered.map((contact) => (
              <button
                key={contact.id}
                type="button"
                onClick={() => {
                  setSelectedId(contact.id);
                  setIncoming("");
                  setReplies([]);
                  setReplyIndex(0);
                  setNotice("");
                }}
                className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left ${
                  selectedId === contact.id
                    ? "border-indigo-200 bg-indigo-50"
                    : "border-transparent hover:bg-slate-50"
                }`}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">
                  {contact.name.charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {contact.name}
                  </p>

                  <p className="truncate text-xs text-slate-500">
                    {contact.messages.at(-1)?.content ??
                      "Nouvelle conversation"}
                  </p>

                  <p className="mt-1 text-xs text-indigo-600">
                    {contact.status} · {contact.style}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="py-4 text-center text-sm text-slate-400">
              Aucun contact trouvé.
            </p>
          )}

          <p className="mt-3 text-xs text-slate-400">
            Sauvegarde locale sur ce navigateur.
          </p>
        </aside>

        <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          {selected ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <p className="text-sm text-slate-500">
                    Conversation avec
                  </p>

                  <h2 className="text-2xl font-bold">
                    {selected.name}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {selected.messages.length} message(s) enregistré(s)
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={duplicateConversation}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  >
                    Dupliquer
                  </button>

                  <button
                    type="button"
                    onClick={resetConversation}
                    className="rounded-xl border border-rose-200 px-3 py-2 text-sm text-rose-700"
                  >
                    Réinitialiser
                  </button>
                </div>
              </div>

              <div className="my-4 max-h-72 space-y-3 overflow-y-auto rounded-2xl bg-slate-50 p-3">
                {selected.messages.length === 0 ? (
                  <div className="py-8 text-center">
                    <div className="text-3xl">💬</div>

                    <p className="mt-2 font-semibold">
                      La conversation commence ici
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Colle un message reçu pour préparer une réponse.
                    </p>
                  </div>
                ) : (
                  selected.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.role === "user"
                          ? "justify-start"
                          : "justify-end"
                      }`}
                    >
                      <div
                        className={`max-w-[90%] rounded-2xl px-4 py-3 ${
                          message.role === "user"
                            ? "bg-white shadow-sm"
                            : "bg-indigo-600 text-white"
                        }`}
                      >
                        <p className="mb-1 text-xs opacity-70">
                          {message.role === "user"
                            ? "Message reçu"
                            : "Réponse proposée"}
                        </p>

                        <p className="whitespace-pre-wrap text-sm">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-semibold">
                  Style de communication

                  <select
                    value={selected.style}
                    onChange={(event) =>
                      updateSelected({ style: event.target.value })
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal"
                  >
                    {STYLES.map((style) => (
                      <option key={style} value={style}>
                        {style}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm font-semibold">
                  Statut

                  <select
                    value={selected.status}
                    onChange={(event) =>
                      updateSelected({
                        status: event.target.value as Status,
                      })
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal"
                  >
                    <option value="Active">Active</option>
                    <option value="En pause">En pause</option>
                    <option value="Terminée">Terminée</option>
                  </select>
                </label>

                <label className="text-sm font-semibold sm:col-span-2">
                  Objectif

                  <select
                    value={selected.goal}
                    onChange={(event) =>
                      updateSelected({
                        goal: event.target.value as Goal,
                      })
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal"
                  >
                    {GOALS.map((goal) => (
                      <option key={goal} value={goal}>
                        {goal}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mt-5">
                <label
                  htmlFor="incoming"
                  className="mb-2 block text-sm font-bold"
                >
                  Message reçu
                </label>

                <textarea
                  id="incoming"
                  value={incoming}
                  onChange={(event) => setIncoming(event.target.value)}
                  rows={4}
                  placeholder="Colle ici le message reçu…"
                  className="w-full resize-y rounded-2xl border border-slate-200 p-4"
                />

                <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setMode("Rapide")}
                      className={`rounded-xl px-3 py-2 text-sm ${
                        mode === "Rapide"
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100"
                      }`}
                    >
                      Réponse rapide
                    </button>

                    <button
                      type="button"
                      onClick={() => setMode("Développée")}
                      className={`rounded-xl px-3 py-2 text-sm ${
                        mode === "Développée"
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100"
                      }`}
                    >
                      Développée
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={saveIncoming}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold"
                    >
                      Enregistrer
                    </button>

                    <button
                      type="button"
                      onClick={generate}
                      className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white"
                    >
                      Générer avec l’IA
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 text-center">
              <p className="text-lg font-bold">
                Aucun contact sélectionné
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Ajoute un contact pour commencer une conversation.
              </p>
            </div>
          )}

          {selected && (
            <>
              {replies.length > 0 && (
                <div className="mt-6">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-lg font-bold">
                      Propositions de réponse
                    </h3>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setReplyIndex(
                            (index) =>
                              (index + replies.length - 1) %
                              replies.length
                          )
                        }
                        className="rounded-full border px-3 py-1"
                        aria-label="Réponse précédente"
                      >
                        ←
                      </button>

                      <span className="text-sm text-slate-500">
                        {replyIndex + 1}/{replies.length}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setReplyIndex(
                            (index) =>
                              (index + 1) % replies.length
                          )
                        }
                        className="rounded-full border px-3 py-1"
                        aria-label="Réponse suivante"
                      >
                        →
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
                    <p className="whitespace-pre-wrap">
                      {replies[replyIndex]}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={chooseReply}
                        className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white"
                      >
                        Ajouter à l’historique
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          const reply = replies[replyIndex];

                          if (!reply) {
                            setNotice("Aucune réponse à copier.");
                            return;
                          }

                          try {
                            await navigator.clipboard.writeText(reply);
                            setNotice(
                              "Réponse copiée ! Tu peux maintenant la coller."
                            );
                          } catch {
                            setNotice(
                              "Impossible de copier. Vérifie les autorisations du navigateur."
                            );
                          }
                        }}
                        className="rounded-xl border border-indigo-200 bg-white px-4 py-2 text-sm font-bold text-indigo-700"
                      >
                        📋 Copier la réponse
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIncoming(replies[replyIndex]);
                          setNotice(
                            "Réponse placée dans la zone de texte."
                          );
                        }}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold"
                      >
                        Modifier la réponse
                      </button>
                    </div>
                  </div>

                  <p className="mt-2 text-xs text-slate-400">
                    Relis la proposition avant de l’envoyer. Tu peux la
                    copier, la modifier ou l’ajouter à ton historique.
                  </p>
                </div>
              )}

              <div className="mt-5 rounded-2xl border border-slate-200 p-4">
                <h3 className="font-bold">Analyse indicative</h3>

                <p className="mt-1 text-sm font-semibold text-indigo-700">
                  {analysis.label}
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  {analysis.advice}
                </p>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-bold">
                    Résumé de la discussion
                  </h3>

                  <button
                    type="button"
                    onClick={() => {
                      updateSelected({
                        summary: summarize(selected.messages),
                      });

                      setNotice("Résumé actualisé.");
                    }}
                    className="rounded-xl border px-3 py-2 text-sm"
                  >
                    Générer le résumé
                  </button>
                </div>

                <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">
                  {selected.summary ||
                    "Aucun résumé généré pour le moment."}
                </p>
              </div>
            </>
          )}

          {notice && (
            <p
              role="status"
              aria-live="polite"
              className="mt-4 rounded-xl bg-indigo-50 p-3 text-sm text-indigo-700"
            >
              {notice}
            </p>
          )}
        </section>
      </div>

      <footer className="pb-6 text-center text-xs text-slate-400">
        Mon Coach · Prototype local
      </footer>
    </main>
  );
}
