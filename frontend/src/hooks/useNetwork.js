import { useState, useEffect } from 'react'
import { getNetworkStatus, onNetworkChange, isNative } from '../services/capacitor.service'

export function useNetwork() {
  const [connected, setConnected] = useState(true)
  const [connectionType, setConnectionType] = useState('unknown')

  useEffect(() => {
    // Check initial status
    getNetworkStatus().then((status) => {
      setConnected(status.connected)
      setConnectionType(status.connectionType)
    })

    // Listen for changes
    onNetworkChange((status) => {
      setConnected(status.connected)
      setConnectionType(status.connectionType)
    })
  }, [])

  return { connected, connectionType, isNative: isNative() }
}
