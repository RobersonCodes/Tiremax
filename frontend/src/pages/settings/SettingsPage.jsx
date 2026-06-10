import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Save, Upload, Store, Phone, Clock, MapPin, Mail, Palette, X } from 'lucide-react'
import { useSettings } from '../../contexts/SettingsContext'
import { useAuth } from '../../contexts/AuthContext'
import { PageHeader } from '../../components/ui/index'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const { settings, update, uploadLogo } = useSettings()
  const { user } = useAuth()
  const [form, setForm] = useState({ ...settings })
  const [saving, setSaving] = useState(false)
  const [logoPreview, setLogoPreview] = useState(settings.logo)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const logoRef = useRef()

  const isAdmin = user?.role === 'ADMIN'
  const set = (f) => (e) => setForm(x => ({ ...x, [f]: e.target.value }))

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await update(form)
      toast.success('Configurações salvas com sucesso!')
    } catch {
      toast.error('Erro ao salvar configurações')
    } finally { setSaving(false) }
  }

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Preview local
    const reader = new FileReader()
    reader.onload = () => setLogoPreview(reader.result)
    reader.readAsDataURL(file)
    // Upload
    setUploadingLogo(true)
    try {
      const url = await uploadLogo(file)
      setLogoPreview(`http://localhost:3001${url}`)
      toast.success('Logo atualizado!')
    } catch {
      toast.error('Erro ao enviar logo')
    } finally { setUploadingLogo(false) }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <PageHeader
        title="⚙️ Configurações"
        subtitle="Personalize o sistema com as informações da sua borracharia"
      />

      <form onSubmit={handleSave} className="space-y-5">

        {/* Logo + Nome */}
        <div className="bg-[#131313] border border-white/[0.07] rounded-xl p-5">
          <h2 className="font-display font-black text-white uppercase text-sm mb-4 flex items-center gap-2">
            <Store size={16} className="text-yellow-400" /> Identidade Visual
          </h2>

          <div className="flex items-start gap-5 mb-5">
            {/* Logo */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-24 h-24 rounded-xl bg-[#1a1a1a] border-2 border-dashed border-white/[0.07] flex items-center justify-center overflow-hidden relative group cursor-pointer"
                onClick={() => isAdmin && logoRef.current?.click()}>
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-1" />
                ) : (
                  <div className="text-4xl">🛞</div>
                )}
                {isAdmin && (
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                    <Upload size={20} className="text-yellow-400" />
                  </div>
                )}
                {uploadingLogo && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-xl">
                    <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              {isAdmin && (
                <>
                  <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                  <button type="button" onClick={() => logoRef.current?.click()}
                    className="text-xs text-yellow-400 hover:text-yellow-300 font-medium flex items-center gap-1">
                    <Upload size={12} /> Trocar logo
                  </button>
                  {logoPreview && (
                    <button type="button" onClick={() => { setLogoPreview(null); setForm(f => ({ ...f, logo: null })) }}
                      className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                      <X size={12} /> Remover
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Nome e tagline */}
            <div className="flex-1 space-y-3">
              <div>
                <label className="label">Nome da Borracharia *</label>
                <input value={form.name} onChange={set('name')} className="input-field"
                  placeholder="Ex: João Pneus" disabled={!isAdmin} required />
              </div>
              <div>
                <label className="label">Slogan / Tagline</label>
                <input value={form.tagline} onChange={set('tagline')} className="input-field"
                  placeholder="Ex: Tudo para o seu carro!" disabled={!isAdmin} />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-[#0c0c0c] border border-white/[0.05] rounded-xl p-4">
            <p className="text-xs text-white/30 mb-3 uppercase tracking-wide">Pré-visualização — como aparece no sistema</p>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-yellow-400 flex items-center justify-center overflow-hidden"
                style={{ boxShadow: '0 0 16px rgba(245,200,0,0.3)' }}>
                {logoPreview ? (
                  <img src={logoPreview} alt="" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-xl">🛞</span>
                )}
              </div>
              <div>
                <p className="font-display font-black text-lg text-white uppercase leading-none">
                  {form.name || 'Nome da Borracharia'}
                </p>
                <p className="text-[10px] text-white/30 uppercase tracking-widest">
                  {form.tagline || 'Seu slogan aqui'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contato */}
        <div className="bg-[#131313] border border-white/[0.07] rounded-xl p-5">
          <h2 className="font-display font-black text-white uppercase text-sm mb-4 flex items-center gap-2">
            <Phone size={16} className="text-yellow-400" /> Contato
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Telefone</label>
              <input value={form.phone} onChange={set('phone')} className="input-field"
                placeholder="(11) 99999-9999" disabled={!isAdmin} />
            </div>
            <div>
              <label className="label">WhatsApp</label>
              <input value={form.whatsapp} onChange={set('whatsapp')} className="input-field"
                placeholder="5511999999999" disabled={!isAdmin} />
            </div>
            <div>
              <label className="label">E-mail</label>
              <input type="email" value={form.email} onChange={set('email')} className="input-field"
                placeholder="contato@borracharia.com" disabled={!isAdmin} />
            </div>
            <div>
              <label className="label">CNPJ</label>
              <input value={form.cnpj} onChange={set('cnpj')} className="input-field"
                placeholder="00.000.000/0001-00" disabled={!isAdmin} />
            </div>
          </div>
        </div>

        {/* Endereço */}
        <div className="bg-[#131313] border border-white/[0.07] rounded-xl p-5">
          <h2 className="font-display font-black text-white uppercase text-sm mb-4 flex items-center gap-2">
            <MapPin size={16} className="text-yellow-400" /> Localização
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Endereço</label>
              <input value={form.address} onChange={set('address')} className="input-field"
                placeholder="Rua das Borracharias, 123 - Centro" disabled={!isAdmin} />
            </div>
            <div>
              <label className="label">Cidade</label>
              <input value={form.city} onChange={set('city')} className="input-field"
                placeholder="São Paulo" disabled={!isAdmin} />
            </div>
            <div>
              <label className="label">Estado</label>
              <input value={form.state} onChange={set('state')} className="input-field"
                placeholder="SP" maxLength={2} disabled={!isAdmin} />
            </div>
            <div className="sm:col-span-2">
              <label className="label flex items-center gap-1.5"><Clock size={13} /> Horário de Funcionamento</label>
              <input value={form.openHours} onChange={set('openHours')} className="input-field"
                placeholder="Seg - Sáb: 08:00 às 18:00" disabled={!isAdmin} />
            </div>
          </div>
        </div>

        {/* Cor principal */}
        {isAdmin && (
          <div className="bg-[#131313] border border-white/[0.07] rounded-xl p-5">
            <h2 className="font-display font-black text-white uppercase text-sm mb-4 flex items-center gap-2">
              <Palette size={16} className="text-yellow-400" /> Cor Principal
            </h2>
            <div className="flex items-center gap-4">
              <input type="color" value={form.primaryColor || '#f5c800'} onChange={set('primaryColor')}
                className="w-14 h-14 rounded-xl cursor-pointer border-0 bg-transparent" />
              <div>
                <p className="text-sm text-white font-medium">{form.primaryColor || '#f5c800'}</p>
                <p className="text-xs text-white/35 mt-0.5">Aparece nos botões, destaques e sidebar</p>
              </div>
              <div className="flex gap-2 ml-2">
                {['#f5c800', '#e8230a', '#3b64ff', '#10b981', '#8b5cf6', '#f97316'].map(c => (
                  <button key={c} type="button" onClick={() => setForm(f => ({ ...f, primaryColor: c }))}
                    className="w-8 h-8 rounded-lg border-2 transition-all"
                    style={{ background: c, borderColor: form.primaryColor === c ? 'white' : 'transparent' }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Save button */}
        {isAdmin && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-white/30">
              ℹ️ Apenas administradores podem alterar as configurações
            </p>
            <button type="submit" disabled={saving}
              className="btn-yellow px-6 py-2.5 disabled:opacity-50">
              {saving ? (
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <><Save size={16} /> Salvar Configurações</>
              )}
            </button>
          </div>
        )}

        {!isAdmin && (
          <p className="text-center text-sm text-white/30 py-2">
            🔒 Apenas administradores podem alterar as configurações
          </p>
        )}
      </form>
    </div>
  )
}
