import { api } from '#/api/client';

export interface Topic {
  id: string;
  name: string;
  description: string;
  memory_count: number;
}

export interface GraphNode {
  id: string;
  name: string;
  type: 'topic' | 'memory';
  val: number;
}

export interface GraphLink {
  source: string;
  target: string;
}

export interface KnowledgeGraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface WikiContent {
  content: string;
}

const MOCK_TOPICS: Topic[] = [
  { id: "t1", name: "EU Market Expansion", description: "Plans and analysis for European market entry", memory_count: 14 },
  { id: "t2", name: "Pricing Strategy Q3", description: "Competitor pricing analysis and our response", memory_count: 8 },
  { id: "t3", name: "Infrastructure Scaling", description: "Cloud provider renegotiations and architecture", memory_count: 22 },
];

const MOCK_WIKI: Record<string, string> = {
  "t1": "# EU Market Expansion\n\n## Overview\n\nThe board has approved a 90-day pilot targeting the DACH mid-market. We are capping CAC at ₹38K per logo.\n\n## Key Constraints\n- **Budget:** ₹40K/month cap\n- **Timeline:** 90 days\n- **Success Criteria:** 12 qualified logos\n\n## Status\nCurrently drafting the success criteria and finalizing the merchant-of-record integration.",
  "t2": "# Pricing Strategy Q3\n\n## Market Context\nTwo major competitors have dropped their mid-tier pricing by ~15% this week. \n\n## Crew Verdict\nAtlas modelled the impact: matching the cut costs ₹410K ARR, while holding costs an estimated 2.1% churn. We are recommending holding the price and shipping the retention bundle instead.",
  "t3": "# Infrastructure Scaling\n\n## Current State\nCloud utilization hit 91% of commitment, giving us strong leverage for renegotiation before the November renewal window.\n\n## Action Items\n- Renegotiate cloud commit\n- Consolidate fulfilment vendors (expected ₹340K/yr savings)\n- Complete SOC 2 Type II compliance to unblock ₹2.8L enterprise pipeline"
};

const MOCK_GRAPH: KnowledgeGraphData = {
  nodes: [
    { id: "t1", name: "EU Market Expansion", type: "topic", val: 18 },
    { id: "t2", name: "Pricing Strategy Q3", type: "topic", val: 12 },
    { id: "t3", name: "Infrastructure Scaling", type: "topic", val: 24 },
    { id: "m1", name: "Boardroom approval for DACH", type: "memory", val: 2 },
    { id: "m2", name: "CAC cap set to ₹38K", type: "memory", val: 2 },
    { id: "m3", name: "Competitor drops mid-tier price", type: "memory", val: 2 },
    { id: "m4", name: "Atlas impact modeling", type: "memory", val: 2 },
    { id: "m5", name: "Cloud utilization report", type: "memory", val: 2 },
    { id: "m6", name: "SOC 2 Type II pipeline value", type: "memory", val: 2 },
    { id: "m7", name: "EU compliance considerations", type: "memory", val: 2 },
  ],
  links: [
    { source: "m1", target: "t1" },
    { source: "m2", target: "t1" },
    { source: "m3", target: "t2" },
    { source: "m4", target: "t2" },
    { source: "m5", target: "t3" },
    { source: "m6", target: "t3" },
    { source: "m7", target: "t1" },
    { source: "m7", target: "t3" },
  ]
};

export const knowledgeApi = {
  getTopics: async (_orgId: string) => {
    try {
      const res = await api.get<Topic[]>(`/knowledge/topics`);
      if (res.data && res.data.length > 0) return res.data;
    } catch (err) {}
    return MOCK_TOPICS;
  },
    
  getGraph: async (_orgId: string) => {
    try {
      const res = await api.get<KnowledgeGraphData>(`/knowledge/graph`);
      if (res.data && res.data.nodes && res.data.nodes.length > 0) return res.data;
    } catch (err) {}
    return MOCK_GRAPH;
  },
    
  getWikiPage: async (_orgId: string, topicId: string) => {
    try {
      const res = await api.get<WikiContent>(`/knowledge/wiki/${topicId}`);
      if (res.data && res.data.content && res.data.content !== "This topic has no memories yet.") {
        return res.data;
      }
    } catch (err) {}
    return { content: MOCK_WIKI[topicId] || "No content found." };
  }
};
