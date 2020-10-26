import { AnyGeneratedMember } from './types/GeneratedMember';

export const sortMembers = (
  members: AnyGeneratedMember[]
): AnyGeneratedMember[] => {
  const nodes: { [key: string]: AnyGeneratedMember } = {}, // hash: stringified id of the node => { id: id, afters: lisf of ids }
    sorted: AnyGeneratedMember[] = [], // sorted list of IDs ( returned value )
    visited: { [key: string]: boolean } = {}; // hash: id of already visited node => true

  // 1. build data structures
  members.forEach(function (v) {
    if ('name' in v) {
      nodes[v.name] = v;
    }
  });

  const visit = (ancestors: string[], id: string) => {
    // if already exists, do nothing
    if (visited[id]) return;
    visited[id] = true;

    const node = nodes[id];
    if (!node) {
      console.warn(`Node ${id} not found`);
      return;
    }
    ancestors.push(id);

    node.dependsOn.forEach(afterID => {
      if (ancestors.includes(afterID)) {
        // if already in ancestors, a closed chain exists.
        // throw new Error(
        //   `Circular dependency : ${
        //     node.name
        //   } depends on ${afterID}. Ancestors: ${JSON.stringify(ancestors)}`
        // );
        return;
      }

      visit(ancestors, afterID); // recursive call
    });

    sorted.unshift(node);
  };

  // 2. topological sort
  Object.keys(nodes).forEach(n => visit([], n));

  return sorted.reverse();
};
