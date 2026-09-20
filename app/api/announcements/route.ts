import {NextResponse} from 'next/server';
import {getSessionUser} from '@/lib/auth';
import {getAnnouncements} from '@/lib/creator-config';
export const dynamic='force-dynamic';
export async function GET(request:Request){if(!await getSessionUser(request))return NextResponse.json({error:'Não autorizado.'},{status:401});return NextResponse.json({announcements:await getAnnouncements()},{headers:{'cache-control':'no-store'}})}
