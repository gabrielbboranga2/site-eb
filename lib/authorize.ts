import {getSessionUser} from './auth';
import {canView,type Channel} from './access';
import {readPermissions} from './settings-store';
import {isCreatorRole} from './manager';
import {getUserGroupMemberships} from './roblox';
export async function authorizedFor(request:Request,channels:Channel[]){const user=await getSessionUser<{exp:number;roleId?:string;rankNumber?:number;id:string}>(request);if(!user)return false;const permissions=await readPermissions();return channels.some(channel=>canView(user.roleId,channel,permissions,user.rankNumber))}
export async function currentCreator(request:Request){const user=await getSessionUser<{exp:number;id:string;roleId?:string}>(request);if(!user||!isCreatorRole(user.roleId))return false;return (await getUserGroupMemberships(user.id)).some(g=>g.groupId===521106467&&isCreatorRole(g.roleId))}
export function sameOrigin(request:Request){return request.headers.get('origin')===new URL(request.url).origin}
