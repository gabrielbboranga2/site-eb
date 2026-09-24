import DashboardGate from '../components/DashboardGate';
import Link from 'next/link';
export const metadata={title:'Central de Comando | EB DO MIG',robots:{index:false,follow:false}};
export default function Central(){return <><DashboardGate/><noscript><main className="central-noscript"><strong>JavaScript é necessário para acessar a Central.</strong><p>Ative o JavaScript no navegador e recarregue esta página.</p><Link href="/">Voltar ao início</Link></main></noscript></>}
