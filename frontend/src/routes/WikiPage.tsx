import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { BookOpen } from 'lucide-react';

import { knowledgeApi, Topic } from '#/api/knowledge';

import { AppShell } from '#/components/layout/AppShell';
import { OrbitalLoader } from '#/components/os/ui';
import { cn } from '#/lib/utils';

export default function WikiPage() {

  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [wikiContent, setWikiContent] = useState<string | null>(null);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [loadingWiki, setLoadingWiki] = useState(false);

  useEffect(() => {
    setLoadingTopics(true);
    knowledgeApi.getTopics("")
      .then((res) => {
        setTopics(res);
        if (res.length > 0) setSelectedTopic(res[0].id);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingTopics(false));
  }, []);

  useEffect(() => {
    if (!selectedTopic) return;
    setLoadingWiki(true);
    knowledgeApi.getWikiPage("", selectedTopic)
      .then((res) => setWikiContent(res.content))
      .catch((err) => console.error(err))
      .finally(() => setLoadingWiki(false));
  }, [selectedTopic]);

  return (
    <AppShell title="Corporate Wiki">
      <div className="flex h-full w-full bg-[#05060C] text-white">
        {/* Sidebar */}
        <div className="w-72 flex-shrink-0 border-r border-white/10 bg-[#0B0D14] flex flex-col">
          <div className="p-4 border-b border-white/10">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <BookOpen size={20} className="text-emerald-500" />
              Corporate Wiki
            </h2>
            <p className="mt-1 text-xs text-white/50">Auto-generated from memory clusters</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loadingTopics ? (
              <div className="flex justify-center p-4">
                <OrbitalLoader label="" />
              </div>
            ) : topics.length === 0 ? (
              <p className="p-4 text-sm text-white/40 text-center">No topics extracted yet.</p>
            ) : (
              topics.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTopic(t.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-md transition-colors",
                    selectedTopic === t.id 
                      ? "bg-white/10 text-white" 
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <div className="font-medium text-sm truncate">{t.name}</div>
                  <div className="text-xs opacity-50 mt-1">{t.memory_count} memories</div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto bg-[#05060C] p-8 md:p-12">
          {loadingWiki ? (
            <div className="flex h-full items-center justify-center">
              <OrbitalLoader label="Synthesizing wiki page..." />
            </div>
          ) : wikiContent ? (
            <div className="mx-auto max-w-4xl prose prose-invert prose-emerald">
              <ReactMarkdown>{wikiContent}</ReactMarkdown>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-white/40">
              Select a topic to view its knowledge base.
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
