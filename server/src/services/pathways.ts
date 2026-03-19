export type PathNode = { id: string; name: string; phone: string | null; memo: string | null };
export type PathEdge = {
  id: string;
  folderId: string;
  fromPersonId: string;
  toPersonId: string;
  title: string;
  memo: string | null;
  categories: { category: string }[];
};

export type PathwayResult = {
  nodes: PathNode[];
  edges: Array<{
    id: string;
    fromPersonId: string;
    toPersonId: string;
    title: string;
    memo: string | null;
    categories: string[];
  }>;
};

export const findSimplePaths = ({
  sourceId,
  targetId,
  depth,
  nodes,
  edges,
}: {
  sourceId: string;
  targetId: string;
  depth: number;
  nodes: PathNode[];
  edges: PathEdge[];
}): PathwayResult[] => {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const adjacency = new Map<string, PathEdge[]>();

  for (const edge of edges) {
    const list = adjacency.get(edge.fromPersonId) ?? [];
    list.push(edge);
    adjacency.set(edge.fromPersonId, list);
  }

  const results: PathwayResult[] = [];

  const dfs = (currentId: string, remainingDepth: number, visited: Set<string>, pathEdges: PathEdge[]) => {
    if (remainingDepth < 0) return;

    if (currentId === targetId) {
      const nodeIds = new Set<string>([sourceId]);
      for (const edge of pathEdges) {
        nodeIds.add(edge.fromPersonId);
        nodeIds.add(edge.toPersonId);
      }
      results.push({
        nodes: [...nodeIds].map((id) => nodeMap.get(id)).filter(Boolean) as PathNode[],
        edges: pathEdges.map((edge) => ({
          id: edge.id,
          fromPersonId: edge.fromPersonId,
          toPersonId: edge.toPersonId,
          title: edge.title,
          memo: edge.memo,
          categories: edge.categories.map((category: { category: string }) => category.category),
        })),
      });
      return;
    }

    for (const edge of adjacency.get(currentId) ?? []) {
      if (visited.has(edge.toPersonId)) continue;
      visited.add(edge.toPersonId);
      pathEdges.push(edge);
      dfs(edge.toPersonId, remainingDepth - 1, visited, pathEdges);
      pathEdges.pop();
      visited.delete(edge.toPersonId);
    }
  };

  dfs(sourceId, depth, new Set<string>([sourceId]), []);
  return results;
};
