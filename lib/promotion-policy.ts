import {getLiveHierarchies,getUserGroupMemberships} from './roblox';
type Role={id:string;rank:number;name?:string};
export function isModeratorOrAbove(roleId:string,roles:Role[]){
  const matches=roles.filter(r=>/^(?:\[MOD\]\s*)?Moderador$/i.test(r.name?.trim()||''));
  const moderator=matches.length===1?matches[0]:undefined,actor=roles.find(r=>r.id===roleId);
  return !!moderator&&!!actor&&actor.rank>=moderator.rank;
}
export async function canSkipPromotionTraining(userId:string){
  const [memberships,hierarchies]=await Promise.all([getUserGroupMemberships(userId),getLiveHierarchies()]);
  const main=memberships.find(g=>g.groupId===521106467),hierarchy=hierarchies.find(g=>g.groupId===521106467);
  return !!main&&!!hierarchy&&isModeratorOrAbove(main.roleId,hierarchy.roles);
}
