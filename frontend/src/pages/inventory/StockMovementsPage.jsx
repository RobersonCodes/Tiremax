import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, History } from 'lucide-react'
import api from '../../services/api'
import { PageHeader, Card, Table, StatusBadge, EmptyState, Pagination, Skeleton, Button } from '../../components/ui/index'
import { formatDateTime } from '../../utils/format'

export default function StockMovementsPage() {
  const navigate = useNavigate()
  const [movements, setMovements] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const limit = 30

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/stock/movements?page=${page}&limit=${limit}`)
      setMovements(data.data)
      setTotal(data.total)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Movimentações de Estoque"
        subtitle={`${total} registros`}
        actions={
          <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate('/inventory')}>
            Voltar ao Estoque
          </Button>
        }
      />

      <Card className="p-0 overflow-hidden">
        <Table>
          <thead>
            <tr className="border-b border-white/[0.05]">
              <th className="table-header text-left">Data</th>
              <th className="table-header text-left">Produto</th>
              <th className="table-header text-center">Tipo</th>
              <th className="table-header text-right">Quantidade</th>
              <th className="table-header text-left hidden md:table-cell">Motivo</th>
              <th className="table-header text-left hidden lg:table-cell">Referência</th>
              <th className="table-header text-right hidden sm:table-cell">Custo Unit.</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array(8).fill(0).map((_, i) => (
                <tr key={i} className="border-b border-white/[0.05]">
                  {Array(7).fill(0).map((_, j) => (
                    <td key={j} className="table-cell"><Skeleton className="h-4" /></td>
                  ))}
                </tr>
              ))
            ) : movements.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-4">
                  <EmptyState
                    icon={History}
                    title="Nenhuma movimentação encontrada"
                    description="As entradas e saídas de estoque aparecerão aqui"
                  />
                </td>
              </tr>
            ) : (
              movements.map((m, i) => (
                <motion.tr
                  key={m.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="table-row"
                >
                  <td className="table-cell text-white/50 text-sm whitespace-nowrap">{formatDateTime(m.createdAt)}</td>
                  <td className="table-cell">
                    <div>
                      <p className="text-sm font-medium text-white">{m.product?.name}</p>
                      <p className="text-xs text-white/30 font-mono">{m.product?.code}</p>
                    </div>
                  </td>
                  <td className="table-cell text-center">
                    <StatusBadge status={m.type} />
                  </td>
                  <td className="table-cell text-right">
                    <span className={`font-bold text-sm ${
                      m.type === 'IN' ? 'text-accent-green' : m.type === 'OUT' ? 'text-accent-red' : 'text-accent-amber'
                    }`}>
                      {m.type === 'IN' ? '+' : m.type === 'OUT' ? '-' : ''}{m.quantity} <span className="text-white/30 font-normal text-xs">{m.product?.unit}</span>
                    </span>
                  </td>
                  <td className="table-cell hidden md:table-cell text-white/60 text-sm">{m.reason}</td>
                  <td className="table-cell hidden lg:table-cell text-white/40 text-xs">{m.reference || '—'}</td>
                  <td className="table-cell hidden sm:table-cell text-right text-white/50 text-sm">
                    {m.unitCost ? m.unitCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'}
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </Table>
        {!loading && (
          <div className="p-4">
            <Pagination page={page} total={total} limit={limit} onPage={setPage} />
          </div>
        )}
      </Card>
    </div>
  )
}
