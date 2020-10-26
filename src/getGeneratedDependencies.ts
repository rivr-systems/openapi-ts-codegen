import { AnyGeneratedMember } from './types/GeneratedMember';

export const getGeneratedDependencies = (
  member: AnyGeneratedMember,
  allMembers: AnyGeneratedMember[]
): AnyGeneratedMember[] => {
  const includes: { [name: string]: boolean } = {};
  const index: { [name: string]: AnyGeneratedMember } = {};

  allMembers.forEach(m => {
    if ('name' in m) {
      index[m.name] = m;
    }
  });

  function visit(node: AnyGeneratedMember) {
    node.dependsOn.forEach(m => {
      const next = index[m];
      if (!next) {
        console.warn(`Node ${m} not found!`);
      } else if (!includes[m]) {
        includes[m] = true;
        visit(index[m]);
      }
    });
  }

  visit(member);

  return Object.keys(includes).map(n => index[n]);
};
