import type{MetadataRoute}from'next';
export default function robots():MetadataRoute.Robots{return{rules:{userAgent:'*',allow:'/',disallow:['/central','/api/']},sitemap:'https://eb-do-mig.vercel.app/sitemap.xml'}}
