import {NextResponse} from 'next/server';
import {getSessionUser} from '@/lib/auth';
import {getDivisions} from '@/lib/creator-config';
export const dynamic='force-dynamic';
export async function GET(request:Request){if(!await getSessionUser(request))return NextResponse.json({error:'Não autorizado.'},{status:401});return NextResponse.json({divisions:await getDivisions()},{headers:{'cache-control':'no-store'}})}
