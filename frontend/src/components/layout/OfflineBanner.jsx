import { motion, AnimatePresence } from 'framer-motion'
import { WifiOff } from 'lucide-react'
import { useNetwork } from '../../hooks/useNetwork'

export default function OfflineBanner() {
  const { connected } = useNetwork()

  return (
    <AnimatePresence>
      {!connected && (
        <motion.div
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          transition={{ type: 'spring', damping: 20 }}
          className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-2 bg-accent-amber px-4 py-2.5 text-sm font-medium text-black"
        >
          <WifiOff size={16} />
          Sem conexão com a internet
        </motion.div>
      )}
    </AnimatePresence>
  )
}
