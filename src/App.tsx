import { useEffect, useMemo, useState } from 'react';
import './main.css';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { ChatPanel } from './components/ChatPanel';
import { SettingsModal } from './components/SettingsModal';
import { MonsterBrowser } from './components/MonsterBrowser';
import { useSettingsStore } from './store/settings';
import { useLibraryStore } from './store/library';
import { useChatStore } from './store/chat';
import { retrieveTopChunks } from './services/retriever';
import { generateChatCompletion, ChatCompletionMessageParam } from './services/openaiClient';
import { AppSettings, FocusType, Mode, SourceRef } from './types';
import { Monster } from './types/monsters';
import { loadMonsterBooks, parseMonstersFromMarkdown } from './services/monsterParser';
import { STRINGS } from './config/strings';

const MAX_CONTEXT_CHARS = 12000;
const MAX_CHUNK_TEXT = 2000;
const RULE_LOOKUP_SNIPPET = 1200;
const HISTORY_BUDGET_RULES = 2000;
const HISTORY_BUDGET_STORY = 6000;

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}\n... [ingekort om tokens te beperken]`;
}

function buildSystemMessages(language: AppSettings['preferredLanguage'], mode: Mode): ChatCompletionMessageParam[] {
  const base = `You are DMDesk, a Dungeon Master assistant.
You must answer strictly according to the contents of the provided D&D markdown excerpts.
These excerpts come from rulebooks, setting books, and memos owned by the user.

Rules:
- Only use information that is explicitly present in the provided excerpts.
- Do not use outside knowledge.
- If the answer is not clearly supported by the excerpts, say:
  "Dit staat niet gespecificeerd in de aangeleverde boeken." (in Flemish Dutch)
  or
  "This is not specified in the provided books." (in English)
- Prefer concise, table-friendly and play-ready answers.
- If multiple excerpts conflict, summarize the conflict clearly.
- Current mode: ${mode === 'rules' ? 'Rules / RAW questions' : 'Story / improv assistance'}.`;

  const dutch = `Taal: Antwoord altijd in informeel Vlaams Nederlands, tenzij de gebruiker expliciet vraagt om Engels.
Gebruik een vlotte, duidelijke toon die bruikbaar is aan de speeltafel.`;
  const english = `Language: Answer in clear, concise English unless the user explicitly requests another language.`;

  return [
    { role: 'system', content: base },
    { role: 'system', content: language === 'nl-BE' ? dutch : english }
  ];
}

function buildContextBlock(chunks: ReturnType<typeof retrieveTopChunks>): string {
  if (chunks.length === 0) {
    return 'Geen bronfragmenten gevonden voor deze vraag. Antwoord dat dit niet gespecificeerd is in de aangeleverde boeken.';
  }

  let budget = MAX_CONTEXT_CHARS;
  const lines: string[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const item = chunks[i];
    const heading = item.chunk.heading ? ` – ${item.chunk.heading}` : '';
    const chunkText = truncateText(item.chunk.text.trim(), Math.min(MAX_CHUNK_TEXT, budget));
    const block = `[BRON ${i + 1} – ${item.chunk.fileName}${heading}]
${chunkText}`;
    budget -= block.length;
    if (budget <= 0) break;
    lines.push(block);
  }

  return `De volgende tekstfragmenten zijn uittreksels uit de D&D-bronnen van de gebruiker.
Gebruik enkel deze tekst als bron:

${lines.join('\n\n')}

Einde van de bronfragmenten.`;
}

function buildHistoryMessages(
  past: { role: 'user' | 'assistant'; content: string }[],
  mode: Mode
): ChatCompletionMessageParam[] {
  const budget = mode === 'story' ? HISTORY_BUDGET_STORY : HISTORY_BUDGET_RULES;
  const selected: ChatCompletionMessageParam[] = [];
  let used = 0;

  // walk backwards to keep the most recent turns
  for (let i = past.length - 1; i >= 0; i--) {
    const msg = past[i];
    const len = msg.content.length;
    if (used + len > budget) break;
    selected.push({ role: msg.role, content: msg.content });
    used += len;
  }

  return selected.reverse();
}

export default function App() {
  const settingsStore = useSettingsStore();
  const libraryStore = useLibraryStore();
  const chatStore = useChatStore();
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isMonsterBrowserOpen, setMonsterBrowserOpen] = useState(false);

  const {
    apiKey,
    preferredLanguage,
    activeSetting,
    setApiKey,
    setPreferredLanguage,
    setActiveSetting,
    chunkStrategy,
    setChunkStrategy,
    model,
    setModel,
    useLlmForRules,
    setUseLlmForRules
  } = settingsStore;
  const { files, chunks, isImporting, importFiles, lastImportAt, loadFromCache, loadFromPublicBooks } = libraryStore;
  const { messages, mode, isLoading, addMessage, addAssistantMessage, setMode, setLoading, clearChat, focus, setFocus } =
    chatStore;
  const [cacheLoaded, setCacheLoaded] = useState(false);
  const [monstersLoaded, setMonstersLoaded] = useState(false);

  const miniSettings: AppSettings = useMemo(
    () => ({
      apiKey,
      preferredLanguage,
      activeSetting,
      model,
      chunkStrategy,
      useLlmForRules
    }),
    [apiKey, preferredLanguage, activeSetting, model, chunkStrategy, useLlmForRules]
  );

  // Load books and parse monsters (Monster Manual + Volo's)
  useEffect(() => {
    if (monstersLoaded) return;
    loadMonsterBooks()
      .then((books) => {
        const parsed: Monster[] = [];
        books.forEach((book) => {
          parsed.push(...parseMonstersFromMarkdown(book.markdown, book.path.replace('/books/', ''), book.sourceId));
        });
        setMonsters(parsed);
      })
      .catch((err) => setStatus(err instanceof Error ? err.message : 'Kon monsters niet laden.'))
      .finally(() => setMonstersLoaded(true));
  }, [monstersLoaded]);

  const focusMap: Record<FocusType, string[]> = {
    general: [],
    class: ['class', 'subclass', 'archetype'],
    rule: ['rule', 'regel', 'mechanic'],
    monster: ['monster', 'creature', 'statblock', 'stat block'],
    background: ['background'],
    feat: ['feat', 'talent'],
    race: ['race', 'heritage', 'lineage'],
    spell: ['spell', 'ritual', 'magic'],
    item: ['item', 'magic item', 'gear', 'equipment']
  };

  const buildRuleLookupAnswer = (retrieved: ReturnType<typeof retrieveTopChunks>) => {
    if (retrieved.length === 0) {
      return {
        content: preferredLanguage === 'nl-BE'
          ? 'Geen matchende secties gevonden in je boeken voor deze vraag.'
          : 'No matching sections found in your books for this question.',
        sources: [] as SourceRef[]
      };
    }

    const top = retrieved.slice(0, 3);
    const parts = top.map((item, idx) => {
      const heading = item.chunk.heading ? ` – ${item.chunk.heading}` : '';
      const snippet = truncateText(item.chunk.text.trim(), RULE_LOOKUP_SNIPPET);
      return `Bron ${idx + 1}: ${item.chunk.fileName}${heading}\n${snippet}`;
    });

    const content = preferredLanguage === 'nl-BE'
      ? `Op basis van je boeken (geen LLM gebruikt):\n\n${parts.join('\n\n')}`
      : `Based on your books (no LLM used):\n\n${parts.join('\n\n')}`;

    const sources: SourceRef[] = top.map((item) => ({
      fileName: item.chunk.fileName,
      heading: item.chunk.heading,
      snippet: item.chunk.text.slice(0, 140)
    }));

    return { content, sources };
  };

  const handleSend = async (prompt: string) => {
    const needsLlm = mode === 'story' || (mode === 'rules' && useLlmForRules !== false);
    if (needsLlm && !apiKey) {
      setStatus('Voeg eerst je OpenAI API key toe in Instellingen. (LLM-vrije rules-modus kan zonder key)');
      return;
    }
    if (chunks.length === 0) {
      setStatus('Importeer eerst je D&D-markdownbibliotheek.');
      return;
    }

    setStatus(null);
    addMessage({ role: 'user', content: prompt });
    setLoading(true);

    try {
      // Build conversation history excluding the just-added user message (last entry)
      const priorMessages = messages.slice(0, -1).filter((m) => m.role === 'user' || m.role === 'assistant');
      const historyMessages = buildHistoryMessages(
        priorMessages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        mode
      );

      const retrieved = retrieveTopChunks(prompt, chunks, {
        limit: chunkStrategy === 'file' ? 3 : mode === 'rules' ? 8 : 6,
        activeSetting,
        focusTerms: focusMap[focus] ?? []
      });

      const sources: SourceRef[] = retrieved.map((item) => ({
        fileName: item.chunk.fileName,
        heading: item.chunk.heading,
        snippet: item.chunk.text.slice(0, 140)
      }));

      // Always produce a local lookup for rules/RAW
      if (mode === 'rules') {
        const { content: lookupContent, sources: lookupSources } = buildRuleLookupAnswer(retrieved);

        // If LLM is off for rules, return the lookup directly.
        if (useLlmForRules === false || !apiKey) {
          addAssistantMessage(lookupContent, lookupSources);
          return;
        }

        // Otherwise refine with LLM using both context and the local draft.
        const systemMessages = buildSystemMessages(preferredLanguage, mode);
        const contextBlock = buildContextBlock(retrieved);
        const draft = `Lokaal gevonden antwoord (geen LLM):\n${lookupContent}\n\nGebruik enkel dit samen met de bronnen hierboven; blijf strikt bij de tekst.`;

        const messagesPayload: ChatCompletionMessageParam[] = [
          ...systemMessages,
          { role: 'system', content: `Vraag focus: ${focus}` },
          ...historyMessages,
          { role: 'assistant', content: contextBlock },
          { role: 'assistant', content: draft },
          { role: 'user', content: prompt }
        ];

        const result = await generateChatCompletion({
          apiKey,
          messages: messagesPayload,
          model: model ?? undefined,
          temperature: 0.2
        });

        addAssistantMessage(result.content, sources);
        return;
      }

      // Story / improv path always uses LLM
      const systemMessages = buildSystemMessages(preferredLanguage, mode);
      const contextBlock = buildContextBlock(retrieved);

      const messagesPayload: ChatCompletionMessageParam[] = [
        ...systemMessages,
        { role: 'system', content: `Vraag focus: ${focus}` },
        ...historyMessages,
        { role: 'assistant', content: contextBlock },
        { role: 'user', content: prompt }
      ];

      const result = await generateChatCompletion({
        apiKey,
        messages: messagesPayload,
        model: model ?? undefined,
        temperature: mode === 'story' ? 0.6 : 0.2
      });

      addAssistantMessage(result.content, sources);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Er ging iets mis tijdens het opvragen van een antwoord.';
      setStatus(message);
      addAssistantMessage(
        'Kon geen antwoord genereren. Mogelijke oorzaken: te veel tokens in context, model-limiet of rate limit. Probeer chunking per heading of stel de vraag korter.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsSave = (next: AppSettings) => {
    setApiKey(next.apiKey);
    setPreferredLanguage(next.preferredLanguage);
    setActiveSetting(next.activeSetting);
    setModel(next.model ?? model);
    setChunkStrategy(next.chunkStrategy ?? chunkStrategy);
    setUseLlmForRules(next.useLlmForRules ?? true);
  };

  // Load hardcoded books from public/books on mount.
  useEffect(() => {
    if (!cacheLoaded) {
      loadFromPublicBooks(chunkStrategy ?? 'heading')
        .catch(() => loadFromCache())
        .finally(() => setCacheLoaded(true));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="app-shell">
      <Sidebar
        mode={mode}
        onModeChange={setMode}
        onImport={(fileList) => importFiles(fileList, chunkStrategy ?? 'heading')}
        isImporting={isImporting}
        fileCount={files.length}
        chunkCount={chunks.length}
        lastImportAt={lastImportAt}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <div className="main-content">
        <TopBar
          settings={miniSettings}
          onOpenSettings={() => setSettingsOpen(true)}
          onClear={clearChat}
        />
        {status ? <p className="muted small">{status}</p> : null}
        <div className="workspace">
          <div className="chat-column">
            <ChatPanel
              messages={messages}
              mode={mode}
              focus={focus}
              onFocusChange={setFocus}
              isLoading={isLoading}
              onSend={handleSend}
            />
          </div>
          <div className="manager-column">
            <button className="primary" onClick={() => setMonsterBrowserOpen(true)}>
              Open Monster Browser
            </button>
          </div>
        </div>
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        settings={miniSettings}
        onSave={handleSettingsSave}
        onClose={() => setSettingsOpen(false)}
      />

      {isMonsterBrowserOpen ? (
        <div className="overlay">
          <div className="overlay-content">
            <div className="overlay-header">
              <h3>Monster Browser</h3>
              <button className="ghost" onClick={() => setMonsterBrowserOpen(false)}>
                ×
              </button>
            </div>
            <MonsterBrowser monsters={monsters} lang={preferredLanguage === 'nl-BE' ? 'nl-BE' : 'en'} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
