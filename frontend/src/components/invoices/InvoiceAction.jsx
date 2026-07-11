import { useState, useEffect, useRef } from 'react'
import { FileText, Loader2, CheckCircle2, AlertCircle, Download } from 'lucide-react'
import api from '../../services/api'
import { Button } from '../ui/index'
import toast from 'react-hot-toast'

const STATUS_LABEL = {
  DRAFT: 'Não emitida',
  PROCESSING: 'Processando na prefeitura/SEFAZ...',
  ISSUED: 'Nota emitida',
  ERROR: 'Erro na emissão',
  CANCELLED: 'Nota cancelada',
}

/**
 * Botão + status de emissão de nota fiscal, usado em SaleDetailPage (NFC-e)
 * e ServiceDetailPage (NFS-e). Emissão é assíncrona: dispara issue() e faz
 * polling em checkStatus() até sair de PROCESSING.
 *
 * entityType: 'sale' | 'service'
 */
export function InvoiceAction({ entityType, entityId, initialInvoice }) {
  const [invoice, setInvoice] = useState(initialInvoice || null)
  const [loading, setLoading] = useState(false)
  const pollRef = useRef(null)

  useEffect(() => {
    if (invoice?.status === 'PROCESSING') {
      pollRef.current = setInterval(async () => {
        try {
          const { data } = await api.get(`/invoices/${invoice.id}/status`)
          setInvoice(data)
          if (data.status !== 'PROCESSING') {
            clearInterval(pollRef.current)
            if (data.status === 'ISSUED') toast.success('Nota fiscal emitida!')
            if (data.status === 'ERROR') toast.error(data.errorMessage || 'Erro ao emitir nota')
          }
        } catch { /* tenta de novo no próximo tick */ }
      }, 5000)
      return () => clearInterval(pollRef.current)
    }
  }, [invoice?.status, invoice?.id])

  const handleIssue = async () => {
    setLoading(true)
    try {
      let current = invoice
      if (!current) {
        const { data } = await api.post(`/invoices/from-${entityType}/${entityId}`)
        current = data
        setInvoice(current)
      }
      const { data: issued } = await api.post(`/invoices/issue/${current.id}`)
      setInvoice(issued)
      if (issued.status === 'PROCESSING') toast.success('Nota enviada, aguardando autorização...')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao emitir nota fiscal')
    } finally {
      setLoading(false)
    }
  }

  if (!invoice || invoice.status === 'DRAFT') {
    return (
      <Button variant="secondary" icon={FileText} loading={loading} onClick={handleIssue}>
        Emitir Nota Fiscal
      </Button>
    )
  }

  const icon = {
    PROCESSING: <Loader2 size={14} className="animate-spin text-white/40" />,
    ISSUED: <CheckCircle2 size={14} className="text-accent-green" />,
    ERROR: <AlertCircle size={14} className="text-red-400" />,
    CANCELLED: <AlertCircle size={14} className="text-white/30" />,
  }[invoice.status]

  return (
    <div className="flex items-center gap-2">
      <span className="flex items-center gap-1.5 text-xs text-white/50 bg-surface-600/40 border border-white/[0.06] rounded-lg px-3 py-2">
        {icon} {STATUS_LABEL[invoice.status]}
        {invoice.number && <span className="font-mono text-white/70">· #{invoice.number}</span>}
      </span>
      {invoice.status === 'ISSUED' && invoice.pdfUrl && (
        <a href={invoice.pdfUrl} target="_blank" rel="noreferrer">
          <Button variant="secondary" size="sm" icon={Download}>PDF</Button>
        </a>
      )}
      {invoice.status === 'ERROR' && (
        <Button variant="secondary" size="sm" loading={loading} onClick={handleIssue}>Tentar novamente</Button>
      )}
    </div>
  )
}
