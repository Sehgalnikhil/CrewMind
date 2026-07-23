import { useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { knowledgeApi, KnowledgeGraphData } from '#/api/knowledge';

import { AppShell } from '#/components/layout/AppShell';
import { OrbitalLoader } from '#/components/os/ui';

export default function BrainMapPage() {

  const [data, setData] = useState<KnowledgeGraphData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    knowledgeApi.getGraph("")
      .then((res) => setData(res))
      .catch((err) => console.error("Failed to fetch graph:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell title="Brain Map">
      <div className="relative h-full w-full bg-[#05060C] text-white">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <OrbitalLoader label="synthesizing brain map" />
          </div>
        ) : !data || data.nodes.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <h2 className="text-xl font-medium text-white">The organizational brain is empty.</h2>
            <p className="mt-2 text-white/50">Let the agents run for a while to cluster memories into topics!</p>
          </div>
        ) : (
          <>
            <div className="absolute left-6 top-6 z-10 max-w-sm rounded-lg border border-white/10 bg-[#0B0D14]/80 p-4 backdrop-blur-md">
              <h1 className="text-lg font-bold tracking-tight">Brain Map</h1>
              <p className="mt-1 text-sm text-white/60">
                Explore memory clusters and topics automatically extracted by agents.
              </p>
            </div>
            <ForceGraph2D
              graphData={data}
              nodeLabel="name"
              nodeColor={(node: any) => node.type === 'topic' ? '#3B82F6' : '#10B981'}
              nodeRelSize={6}
              linkColor={() => 'rgba(255,255,255,0.1)'}
              linkWidth={1}
              backgroundColor="#05060C"
            />
          </>
        )}
      </div>
    </AppShell>
  );
}
