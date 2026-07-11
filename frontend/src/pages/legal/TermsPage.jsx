import { Link } from 'react-router-dom'
import { ArrowLeft, AlertTriangle } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0c0c0c] text-white">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm text-white/50 hover:text-white">
          <ArrowLeft size={15} /> Voltar
        </Link>

        <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight">
          Termos de Uso
        </h1>
        <p className="mt-2 text-sm text-white/40">Última atualização: Janeiro de 2025</p>

        <div className="mt-6 flex gap-3 rounded-xl border border-yellow-400/25 bg-yellow-400/5 p-4 text-sm text-yellow-200/90">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-yellow-400" />
          <p>
            Este é um modelo inicial de Termos de Uso, redigido para cobrir os
            pontos básicos de um SaaS B2B. Ele <strong>não substitui</strong> a
            revisão de um advogado antes de publicar — especialmente as
            cláusulas de cancelamento, responsabilidade e cobrança, que devem
            refletir exatamente como o TireMax ERP funciona na prática.
          </p>
        </div>

        <div className="prose-invert mt-10 space-y-8 text-white/70">
          <section>
            <h2 className="font-display text-xl font-bold uppercase tracking-wide text-yellow-400">
              1. Aceitação dos Termos
            </h2>
            <p className="mt-3">
              Ao criar uma conta no TireMax ERP, você concorda com estes
              Termos de Uso e com a nossa{' '}
              <Link to="/privacidade" className="text-yellow-400 hover:underline">
                Política de Privacidade
              </Link>
              . Se você não concordar, não utilize o sistema.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold uppercase tracking-wide text-yellow-400">
              2. Descrição do Serviço
            </h2>
            <p className="mt-3">
              O TireMax ERP é um sistema de gestão (ERP) voltado para
              borracharias e centros automotivos, oferecendo módulos de
              clientes, veículos, estoque, PDV, ordens de serviço e
              financeiro.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold uppercase tracking-wide text-yellow-400">
              3. Período de Teste e Assinatura
            </h2>
            <p className="mt-3">
              Novas contas têm direito a um período de teste gratuito de 30
              dias, sem necessidade de cartão de crédito. Ao final do
              período de teste, a continuidade do uso está sujeita à
              contratação de um plano pago, conforme condições vigentes no
              momento.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold uppercase tracking-wide text-yellow-400">
              4. Responsabilidades do Usuário
            </h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5">
              <li>Manter a confidencialidade de login e senha</li>
              <li>Utilizar o sistema em conformidade com a legislação vigente</li>
              <li>Garantir a veracidade dos dados inseridos (clientes, produtos, financeiro)</li>
              <li>Não utilizar o sistema para fins ilícitos ou não autorizados</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold uppercase tracking-wide text-yellow-400">
              5. Propriedade dos Dados
            </h2>
            <p className="mt-3">
              Os dados inseridos por você (clientes, veículos, vendas,
              estoque, financeiro) pertencem a você e à sua empresa. O
              TireMax ERP atua como prestador do serviço de gestão desses
              dados, não como proprietário deles.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold uppercase tracking-wide text-yellow-400">
              6. Disponibilidade do Serviço
            </h2>
            <p className="mt-3">
              Envidamos esforços para manter o sistema disponível de forma
              contínua, mas não garantimos operação livre de interrupções.
              Manutenções programadas serão comunicadas com antecedência
              razoável sempre que possível.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold uppercase tracking-wide text-yellow-400">
              7. Cancelamento
            </h2>
            <p className="mt-3">
              Você pode cancelar sua conta a qualquer momento entrando em
              contato pelos canais de suporte. Após o cancelamento, os dados
              poderão ser mantidos por um período determinado antes da
              exclusão definitiva, conforme nossa Política de Privacidade.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold uppercase tracking-wide text-yellow-400">
              8. Limitação de Responsabilidade
            </h2>
            <p className="mt-3">
              O TireMax ERP é fornecido &quot;como está&quot;. Não nos
              responsabilizamos por perdas decorrentes de uso indevido do
              sistema, indisponibilidade de terceiros (internet, servidores)
              ou erros de preenchimento de dados pelo próprio usuário.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold uppercase tracking-wide text-yellow-400">
              9. Alterações nestes Termos
            </h2>
            <p className="mt-3">
              Podemos atualizar estes Termos periodicamente. Alterações
              significativas serão comunicadas através do aplicativo ou por
              e-mail.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold uppercase tracking-wide text-yellow-400">
              10. Legislação Aplicável
            </h2>
            <p className="mt-3">
              Estes Termos são regidos pelas leis da República Federativa do
              Brasil, incluindo a Lei Geral de Proteção de Dados (LGPD — Lei
              nº 13.709/2018).
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold uppercase tracking-wide text-yellow-400">
              11. Contato
            </h2>
            <p className="mt-3">
              Dúvidas sobre estes Termos:{' '}
              <a href="mailto:contato@seudominio.com.br" className="text-yellow-400 hover:underline">
                contato@seudominio.com.br
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
