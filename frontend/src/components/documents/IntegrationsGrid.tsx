import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HardDrive, MessageSquare, BookOpen, Github, Trello, Loader2, Link2, Search, RefreshCw } from "lucide-react";
import { Panel } from "#/components/os/ui";
import { getIntegrations, getAuthUrl, syncGoogleDrive, syncSlack, syncGithub, syncNotion, syncJira } from "#/api/integrations";

type IntegrationState = "idle" | "connecting" | "syncing" | "connected";

export function IntegrationsGrid() {
  const [integrationStates, setIntegrationStates] = useState<Record<string, IntegrationState>>({});
  const [progresses, setProgresses] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const integrations = await getIntegrations();
        const initialStates: Record<string, IntegrationState> = {};
        for (const i of integrations) {
          initialStates[i.provider] = "connected";
        }
        setIntegrationStates(initialStates);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleConnect = async (provider: string) => {
    setIntegrationStates(prev => ({ ...prev, [provider]: "connecting" }));
    try {
      const { url } = await getAuthUrl(provider);
      window.location.href = url; // Redirect to OAuth
    } catch (e) {
      console.error(e);
      setIntegrationStates(prev => ({ ...prev, [provider]: "idle" }));
    }
  };

  const handleSync = async (provider: string) => {
    setIntegrationStates(prev => ({ ...prev, [provider]: "syncing" }));
    setProgresses(prev => ({ ...prev, [provider]: 0 }));
    
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.random() * 8;
      if (currentProgress > 95) currentProgress = 95; // Wait at 95% for backend
      setProgresses(prev => ({ ...prev, [provider]: currentProgress }));
    }, 500);

    try {
      if (provider === "google") await syncGoogleDrive();
      else if (provider === "slack") await syncSlack();
      else if (provider === "github") await syncGithub();
      else if (provider === "notion") await syncNotion();
      else if (provider === "jira") await syncJira();
      
      clearInterval(interval);
      setProgresses(prev => ({ ...prev, [provider]: 100 }));
      setTimeout(() => setIntegrationStates(prev => ({ ...prev, [provider]: "connected" })), 800);
    } catch (e) {
      console.error("Sync failed", e);
      clearInterval(interval);
      setIntegrationStates(prev => ({ ...prev, [provider]: "connected" }));
    }
  };

  const integrations = [
    {
      id: "google",
      name: "Google Workspace",
      description: "Sync Drive, Docs, and Sheets",
      icon: HardDrive,
      color: "#0891CF",
    },
    {
      id: "slack",
      name: "Slack",
      description: "Absorb #leadership context",
      icon: MessageSquare,
      color: "#EC4899",
    },
    {
      id: "notion",
      name: "Notion",
      description: "Index corporate wiki",
      icon: BookOpen,
      color: "#e5e5e5",
    },
    {
      id: "github",
      name: "GitHub",
      description: "Read code and PR discussions",
      icon: Github,
      color: "#8A7BEF",
    },
    {
      id: "jira",
      name: "Jira",
      description: "Track project management",
      icon: Trello,
      color: "#3b82f6",
    },
  ];

  if (loading) return null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {integrations.map((app, i) => {
        const Icon = app.icon;
        
        return (
          <Panel key={app.id} delay={0.1 + i * 0.05} className="flex flex-col justify-between p-5">
            <div className="flex items-start justify-between">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${app.color}15`, color: app.color }}
              >
                <Icon className="h-5 w-5" />
              </div>
              
              {/* Action Button / Status */}
              <div className="h-8">
                <AnimatePresence mode="wait">
                  {(integrationStates[app.id] || "idle") === "idle" && (
                    <motion.button
                      key="idle"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      onClick={() => handleConnect(app.id)}
                      className="flex h-8 items-center gap-1.5 rounded-lg bg-white/5 px-3 text-xs font-semibold text-white transition-colors hover:bg-white/10"
                    >
                      <Link2 className="h-3.5 w-3.5 text-slate-400" />
                      Connect
                    </motion.button>
                  )}
                  
                  {integrationStates[app.id] === "connecting" && (
                    <motion.div
                      key="connecting"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex h-8 items-center gap-1.5 rounded-lg bg-crew-500/10 px-3 text-xs font-semibold text-crew-400"
                    >
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Auth...
                    </motion.div>
                  )}

                  {integrationStates[app.id] === "syncing" && (
                    <motion.div
                      key="syncing"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex h-8 items-center gap-1.5 rounded-lg bg-amber-500/10 px-3 text-xs font-semibold text-amber-400"
                    >
                      <Search className="h-3.5 w-3.5 animate-pulse" />
                      Syncing...
                    </motion.div>
                  )}

                  {integrationStates[app.id] === "connected" && (
                    <motion.button
                      key="connected"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={() => handleSync(app.id)}
                      className="flex h-8 items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 text-xs font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/20"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Sync Now
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="font-bold text-white">{app.name}</h3>
              <p className="mt-1 text-xs text-slate-400">{app.description}</p>
            </div>

            {/* Progress Bar for Syncing */}
            {(integrationStates[app.id] === "syncing" || (progresses[app.id] || 0) > 0) && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  <span>{(progresses[app.id] || 0) >= 100 ? "Sync Complete" : "Indexing"}</span>
                  <span>{Math.round(progresses[app.id] || 0)}%</span>
                </div>
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/5">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: app.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progresses[app.id] || 0}%` }}
                    transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                  />
                </div>
              </div>
            )}
          </Panel>
        );
      })}
    </div>
  );
}
