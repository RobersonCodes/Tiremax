import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0c0c0c] text-white">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm text-white/50 hover:text-white">
          <ArrowLeft size={15} /> Voltar
        </Link>

        <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight">
          Política de Privacidade
        </h1>
        <p className="mt-2 text-sm text-white/40">Última atualização: Janeiro de 2025</p>

        <div className="prose-invert mt-10 space-y-8 text-white/70">
          <p>
            Esta Política de Privacidade descreve como o aplicativo{' '}
            <strong className="text-white">TireMax ERP</strong> coleta, usa e
            protege as informações dos usuários.
          </p>

          <section>
            <h2 className="font-display text-xl font-bold uppercase tracking-wide text-yellow-400">
              1. Informações Coletadas
            </h2>
            <p className="mt-3">
              O TireMax ERP coleta apenas as informações inseridas pelo
              próprio usuário para fins de gestão empresarial:
            </p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5">
              <li>Dados de clientes (nome, CPF/CNPJ, telefone, endereço)</li>
              <li>Dados de veículos (placa, modelo, ano)</li>
              <li>Informações de produtos e estoque</li>
              <li>Registros de vendas e ordens de serviço</li>
              <li>Dados financeiros da empresa</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold uppercase tracking-wide text-yellow-400">
              2. Uso das Informações
            </h2>
            <p className="mt-3">As informações coletadas são utilizadas exclusivamente para:</p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5">
              <li>Gestão operacional da empresa (vendas, serviços, estoque)</li>
              <li>Geração de relatórios internos</li>
              <li>Histórico de atendimento aos clientes</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold uppercase tracking-wide text-yellow-400">
              3. Compartilhamento de Dados
            </h2>
            <p className="mt-3">
              <strong className="text-white">Não compartilhamos</strong> dados
              pessoais com terceiros, exceto quando exigido por lei ou
              autoridade competente.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold uppercase tracking-wide text-yellow-400">
              4. Armazenamento e Segurança
            </h2>
            <p className="mt-3">
              Todos os dados são armazenados no servidor próprio da empresa,
              configurado e gerenciado pelo administrador do sistema. A
              transmissão de dados é protegida por criptografia HTTPS/TLS.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold uppercase tracking-wide text-yellow-400">
              5. Acesso aos Dados
            </h2>
            <p className="mt-3">
              O acesso ao sistema é restrito por autenticação com login e
              senha. Cada usuário tem acesso apenas às funcionalidades
              permitidas pelo administrador.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold uppercase tracking-wide text-yellow-400">
              6. Câmera e Arquivos
            </h2>
            <p className="mt-3">
              O aplicativo pode solicitar acesso à câmera e galeria de fotos
              exclusivamente para fotografar produtos e documentos
              relacionados aos serviços. Nenhuma imagem é enviada a
              servidores externos.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold uppercase tracking-wide text-yellow-400">
              7. Notificações
            </h2>
            <p className="mt-3">
              O aplicativo pode enviar notificações locais para alertas de
              estoque baixo e lembretes de serviços agendados. As
              notificações podem ser desativadas nas configurações do
              dispositivo.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold uppercase tracking-wide text-yellow-400">
              8. Direitos do Usuário (LGPD)
            </h2>
            <p className="mt-3">
              Em conformidade com a Lei Geral de Proteção de Dados (Lei nº
              13.709/2018), você tem direito a:
            </p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5">
              <li>Confirmar a existência de tratamento dos seus dados</li>
              <li>Acessar seus dados pessoais</li>
              <li>Corrigir dados incompletos ou desatualizados</li>
              <li>Solicitar a exclusão dos seus dados</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold uppercase tracking-wide text-yellow-400">
              9. Contato
            </h2>
            <p className="mt-3">
              Para dúvidas sobre esta política ou solicitações relacionadas
              aos seus dados, entre em contato:{' '}
              <a href="mailto:contato@seudominio.com.br" className="text-yellow-400 hover:underline">
                contato@seudominio.com.br
              </a>
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold uppercase tracking-wide text-yellow-400">
              10. Alterações nesta Política
            </h2>
            <p className="mt-3">
              Esta política pode ser atualizada periodicamente.
              Notificaremos os usuários sobre mudanças significativas por
              meio do aplicativo.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
