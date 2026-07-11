import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Save, Upload, Store, Phone, Clock, MapPin, Palette, X, Info, Lock, Users, ChevronRight, FileText, AlertTriangle } from 'lucide-react'
import { useSettings } from '../../contexts/SettingsContext'
import { useAuth } from '../../contexts/AuthContext'
import { PageHeader, Card, Button, Input, FormGroup } from '../../components/ui/index'
import toast from 'react-hot-toast'

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const SWATCHES = ['#f5c800', '#e8230a', '#3b64ff', '#10b981', '#8b5cf6', '#f97316']

export default function SettingsPage() {
  const { settings, update, uploadLogo } = useSettings()
  const { user } = useAuth()
  const [form, setForm] = useState({ ...settings })
  const [saving, setSaving] = useState(false)
  const [logoPreview, setLogoPreview] = useState(settings.logo ? `${apiBase}${settings.logo}` : null)
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
      setLogoPreview(`${apiBase}${url}`)
      toast.success('Logo atualizado!')
    } catch {
      toast.error('Erro ao enviar logo')
    } finally { setUploadingLogo(false) }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <PageHeader
        title="Configurações"
        subtitle="Personalize o sistema com as informações da sua borracharia"
      />

      {isAdmin && (
        <Link to="/settings/team">
          <Card className="flex items-center justify-between hover:border-brand-500/30 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/15 flex items-center justify-center">
                <Users size={18} className="text-brand-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Equipe</p>
                <p className="text-xs text-white/40">Gerencie os usuários com acesso ao sistema</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-white/30" />
          </Card>
        </Link>
      )}

      <form onSubmit={handleSave} className="space-y-5">

        {/* Logo + Nome */}
        <Card>
          <h2 className="font-display font-semibold text-sm uppercase tracking-wide text-white/70 mb-4 flex items-center gap-2">
            <Store size={15} className="text-brand-500" /> Identidade Visual
          </h2>

          <div className="flex items-start gap-5 mb-5">
            {/* Logo */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-24 h-24 rounded-xl bg-surface-700 border-2 border-dashed border-white/[0.08] flex items-center justify-center overflow-hidden relative group cursor-pointer"
                onClick={() => isAdmin && logoRef.current?.click()}>
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-1" />
                ) : (
                  <Store size={28} className="text-white/20" strokeWidth={1.5} />
                )}
                {isAdmin && (
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                    <Upload size={20} className="text-brand-500" />
                  </div>
                )}
                {uploadingLogo && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-xl">
                    <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              {isAdmin && (
                <>
                  <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                  <button type="button" onClick={() => logoRef.current?.click()}
                    className="text-xs text-brand-500 hover:text-brand-400 font-medium flex items-center gap-1 transition-colors">
                    <Upload size={12} /> Trocar logo
                  </button>
                  {logoPreview && (
                    <button type="button" onClick={() => { setLogoPreview(null); setForm(f => ({ ...f, logo: null })) }}
                      className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors">
                      <X size={12} /> Remover
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Nome e tagline */}
            <div className="flex-1 space-y-3">
              <FormGroup label="Nome da Borracharia" required>
                <Input value={form.name} onChange={set('name')} placeholder="Ex: João Pneus" disabled={!isAdmin} required />
              </FormGroup>
              <FormGroup label="Slogan / Tagline">
                <Input value={form.tagline} onChange={set('tagline')} placeholder="Ex: Tudo para o seu carro!" disabled={!isAdmin} />
              </FormGroup>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-surface-900 border border-white/[0.05] rounded-xl p-4">
            <p className="text-xs text-white/30 mb-3 uppercase tracking-wide">Pré-visualização — como aparece no sistema</p>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-brand-500 shadow-brand flex items-center justify-center overflow-hidden shrink-0">
                {logoPreview ? (
                  <img src={logoPreview} alt="" className="w-full h-full object-contain" />
                ) : (
                  <Store size={18} className="text-[#08090a]" />
                )}
              </div>
              <div>
                <p className="font-display font-bold text-lg text-white leading-none">
                  {form.name || 'Nome da Borracharia'}
                </p>
                <p className="text-[10px] text-white/30 uppercase tracking-widest mt-1">
                  {form.tagline || 'Seu slogan aqui'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Contato */}
        <Card>
          <h2 className="font-display font-semibold text-sm uppercase tracking-wide text-white/70 mb-4 flex items-center gap-2">
            <Phone size={15} className="text-brand-500" /> Contato
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormGroup label="Telefone">
              <Input value={form.phone} onChange={set('phone')} placeholder="(11) 99999-9999" disabled={!isAdmin} />
            </FormGroup>
            <FormGroup label="WhatsApp">
              <Input value={form.whatsapp} onChange={set('whatsapp')} placeholder="5511999999999" disabled={!isAdmin} />
            </FormGroup>
            <FormGroup label="E-mail">
              <Input type="email" value={form.email} onChange={set('email')} placeholder="contato@borracharia.com" disabled={!isAdmin} />
            </FormGroup>
            <FormGroup label="CNPJ">
              <Input value={form.cnpj} onChange={set('cnpj')} placeholder="00.000.000/0001-00" disabled={!isAdmin} />
            </FormGroup>
          </div>
        </Card>

        {/* Endereço */}
        <Card>
          <h2 className="font-display font-semibold text-sm uppercase tracking-wide text-white/70 mb-4 flex items-center gap-2">
            <MapPin size={15} className="text-brand-500" /> Localização
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <FormGroup label="Endereço">
                <Input value={form.address} onChange={set('address')} placeholder="Rua das Borracharias, 123 - Centro" disabled={!isAdmin} />
              </FormGroup>
            </div>
            <FormGroup label="Cidade">
              <Input value={form.city} onChange={set('city')} placeholder="São Paulo" disabled={!isAdmin} />
            </FormGroup>
            <FormGroup label="Estado">
              <Input value={form.state} onChange={set('state')} placeholder="SP" maxLength={2} disabled={!isAdmin} />
            </FormGroup>
            <div className="sm:col-span-2">
              <FormGroup label={<span className="flex items-center gap-1.5"><Clock size={13} /> Horário de Funcionamento</span>}>
                <Input value={form.openHours} onChange={set('openHours')} placeholder="Seg - Sáb: 08:00 às 18:00" disabled={!isAdmin} />
              </FormGroup>
            </div>
          </div>
        </Card>

        {/* Cor principal */}
        {isAdmin && (
          <Card>
            <h2 className="font-display font-semibold text-sm uppercase tracking-wide text-white/70 mb-4 flex items-center gap-2">
              <Palette size={15} className="text-brand-500" /> Cor Principal
            </h2>
            <div className="flex items-center gap-4 flex-wrap">
              <input type="color" value={form.primaryColor || '#f5c800'} onChange={set('primaryColor')}
                className="w-14 h-14 rounded-xl cursor-pointer border-0 bg-transparent" />
              <div>
                <p className="text-sm text-white font-medium">{form.primaryColor || '#f5c800'}</p>
                <p className="text-xs text-white/35 mt-0.5">Aparece nos botões, destaques e sidebar</p>
              </div>
              <div className="flex gap-2 ml-2">
                {SWATCHES.map(c => (
                  <button key={c} type="button" onClick={() => setForm(f => ({ ...f, primaryColor: c }))}
                    className="w-8 h-8 rounded-lg border-2 transition-all"
                    style={{ background: c, borderColor: form.primaryColor === c ? 'white' : 'transparent' }} />
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Fiscal — emissão de nota via Focus NFe */}
        {isAdmin && (
          <Card>
            <h2 className="font-display font-semibold text-sm uppercase tracking-wide text-white/70 mb-2 flex items-center gap-2">
              <FileText size={15} className="text-brand-500" /> Fiscal — Emissão de Nota
            </h2>
            <p className="text-xs text-white/35 mb-4">
              Para emitir nota fiscal você precisa de uma conta no{' '}
              <a href="https://focusnfe.com.br" target="_blank" rel="noreferrer" className="text-brand-500 hover:underline">
                Focus NFe
              </a>, com a empresa cadastrada e certificado digital A1 configurado no painel deles.
              O TireMax não armazena seu certificado digital.
            </p>

            <div className="flex items-start gap-2 mb-4 p-3 rounded-xl bg-amber-500/[0.06] border border-amber-500/15">
              <AlertTriangle size={14} className="text-amber-400 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-200/80">
                Enquanto "Ambiente" estiver em Homologação, as notas emitidas são de teste e não têm validade fiscal.
                Só mude para Produção depois de confirmar que tudo está funcionando corretamente.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormGroup label="Regime tributário">
                <select value={form.regimeTributario || ''} onChange={set('regimeTributario')} className="input-field" disabled={!isAdmin}>
                  <option value="">Selecione</option>
                  <option value="MEI">MEI</option>
                  <option value="SIMPLES_NACIONAL">Simples Nacional</option>
                  <option value="LUCRO_PRESUMIDO">Lucro Presumido</option>
                  <option value="LUCRO_REAL">Lucro Real</option>
                </select>
              </FormGroup>
              <FormGroup label="Inscrição Municipal">
                <Input value={form.inscricaoMunicipal || ''} onChange={set('inscricaoMunicipal')} placeholder="Necessária p/ NFS-e" disabled={!isAdmin} />
              </FormGroup>
              <FormGroup label="Item Lista Serviço (LC 116)">
                <Input value={form.itemListaServico || ''} onChange={set('itemListaServico')} placeholder="Ex: 14.01" disabled={!isAdmin} />
              </FormGroup>
              <FormGroup label="Alíquota ISS (%)">
                <Input type="number" step="0.01" value={form.aliquotaIss || ''} onChange={set('aliquotaIss')} placeholder="Ex: 5" disabled={!isAdmin} />
              </FormGroup>
              <FormGroup label="CNAE">
                <Input value={form.cnaeCode || ''} onChange={set('cnaeCode')} placeholder="0000-0/00" disabled={!isAdmin} />
              </FormGroup>
              <FormGroup label="ID da empresa no Focus NFe">
                <Input value={form.focusNfeEmpresaId || ''} onChange={set('focusNfeEmpresaId')} placeholder="Referência do painel Focus" disabled={!isAdmin} />
              </FormGroup>
              <FormGroup label="Ambiente">
                <select value={form.fiscalEnvironment || 'homologacao'} onChange={set('fiscalEnvironment')} className="input-field" disabled={!isAdmin}>
                  <option value="homologacao">Homologação (teste)</option>
                  <option value="producao">Produção (nota real)</option>
                </select>
              </FormGroup>
              <FormGroup label="Emissão de nota">
                <select value={form.fiscalEnabled ? 'true' : 'false'}
                  onChange={e => setForm(f => ({ ...f, fiscalEnabled: e.target.value === 'true' }))}
                  className="input-field" disabled={!isAdmin}>
                  <option value="false">Desativada</option>
                  <option value="true">Ativada</option>
                </select>
              </FormGroup>
            </div>
          </Card>
        )}

        {/* Save button */}
        {isAdmin && (
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <p className="text-xs text-white/30 flex items-center gap-1.5">
              <Info size={13} /> Apenas administradores podem alterar as configurações
            </p>
            <Button type="submit" icon={Save} loading={saving}>
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>
        )}

        {!isAdmin && (
          <p className="text-center text-sm text-white/30 py-2 flex items-center justify-center gap-1.5">
            <Lock size={13} /> Apenas administradores podem alterar as configurações
          </p>
        )}
      </form>
    </div>
  )
}
