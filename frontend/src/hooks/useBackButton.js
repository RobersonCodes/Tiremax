import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { setupBackButton, exitApp } from '../services/capacitor.service'

export function useBackButton() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    setupBackButton(() => {
      if (location.pathname === '/dashboard') {
        // Na tela principal, pergunta se quer sair
        if (window.confirm('Deseja sair do TireMax ERP?')) {
          exitApp()
        }
      } else {
        navigate(-1)
      }
    })
  }, [location.pathname, navigate])
}
