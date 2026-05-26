'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { type Lead, type Proponente } from '@/types/database'

const inp: React.CSSProperties = {
  width: '100%', background: '#161616', border: '1px solid #222',
  borderRadius: 8, padding: '9px 12px', color: '#f0f0f0', fontSize: 13, outline: 'none',
  fontFamily: 'inherit',
}
const lbl: React.CSSProperties = {
  fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em',
}
const field: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 5 }
const secTitle: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, color: '#10b981', textTransform: 'uppercase',
  letterSpacing: '0.1em', marginBottom: 14,
}

function BoolToggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={field}>
      <span style={lbl}>{label}</span>
      <div style={{ display: 'flex', border: '1px solid #222', borderRadius: 8, overflow: 'hidden' }}>
        {[true, false].map(opt => (
          <button key={String(opt)} type="button" onClick={() => onChange(opt)} style={{
            flex: 1, padding: '8px 0', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
            background: value === opt ? '#10b981' : '#161616',
            color: value === opt ? '#000' : '#555',
            transition: 'all 0.15s',
          }}>{opt ? 'Sim' : 'Não'}</button>
        ))}
      </div>
    </div>
  )
}

function RendaToggle({ value, onChange }: { value: 'formal' | 'informal' | null; onChange: (v: 'formal' | 'informal' | null) => void }) {
  return (
    <div style={field}>
      <span style={lbl}>Tipo de renda</span>
      <div style={{ display: 'flex', border: '1px solid #222', borderRadius: 8, overflow: 'hidden' }}>
        {(['formal', 'informal'] as const).map(opt => (
          <button key={opt} type="button" onClick={() => onChange(value === opt ? null : opt)} style={{
            flex: 1, padding: '8px 0', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
            background: value === opt ? '#10b981' : '#161616',
            color: value === opt ? '#000' : '#555',
            textTransform: 'capitalize',
            transition: 'all 0.15s',
          }}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</button>
        ))}
      </div>
    </div>
  )
}

type PropForm = {
  nome: string; cpf: string; email: string; telefone: string
  endereco: string; profissao: string; renda: string
  tipo_renda: 'formal' | 'informal' | ''; cotista: boolean; fator_social: boolean
}

function emptyPropForm(): PropForm {
  return { nome: '', cpf: '', email: '', telefone: '', endereco: '', profissao: '', renda: '', tipo_renda: '', cotista: false, fator_social: false }
}

function propToPropForm(p: Proponente): PropForm {
  return {
    nome: p.nome ?? '', cpf: p.cpf ?? '', email: p.email ?? '', telefone: p.telefone ?? '',
    endereco: p.endereco ?? '', profissao: p.profissao ?? '',
    renda: p.renda != null ? String(p.renda) : '',
    tipo_renda: p.tipo_renda ?? '',
    cotista: p.cotista ?? false,
    fator_social: p.fator_social ?? false,
  }
}

function propFormToProponente(f: PropForm): Proponente {
  return {
    nome: f.nome.trim() || null,
    cpf: f.cpf.trim() || null,
    email: f.email.trim() || null,
    telefone: f.telefone.trim() || null,
    endereco: f.endereco.trim() || null,
    profissao: f.profissao.trim() || null,
    renda: f.renda ? parseFloat(f.renda.replace(/[^\d,]/g, '').replace(',', '.')) || null : null,
    tipo_renda: f.tipo_renda || null,
    cotista: f.cotista,
    fator_social: f.fator_social,
  }
}

function PropFormFields({ data, onChange }: { data: PropForm; onChange: (k: keyof PropForm, v: string | boolean) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={field}>
        <span style={lbl}>Nome completo</span>
        <input style={inp} value={data.nome} onChange={e => onChange('nome', e.target.value)} placeholder="Nome completo" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={field}>
          <span style={lbl}>CPF</span>
          <input style={inp} value={data.cpf} onChange={e => onChange('cpf', e.target.value)} placeholder="000.000.000-00" />
        </div>
        <div style={field}>
          <span style={lbl}>Telefone</span>
          <input style={inp} value={data.telefone} onChange={e => onChange('telefone', e.target.value)} placeholder="(11) 99999-9999" />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={field}>
          <span style={lbl}>E-mail</span>
          <input style={inp} type="email" value={data.email} onChange={e => onChange('email', e.target.value)} placeholder="email@exemplo.com" />
        </div>
        <div style={field}>
          <span style={lbl}>Endereço</span>
          <input style={inp} value={data.endereco} onChange={e => onChange('endereco', e.target.value)} placeholder="Rua, número, bairro" />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={field}>
          <span style={lbl}>Profissão</span>
          <input style={inp} value={data.profissao} onChange={e => onChange('profissao', e.target.value)} placeholder="Ex: Engenheiro" />
        </div>
        <div style={field}>
          <span style={lbl}>Renda mensal (R$)</span>
          <input style={inp} value={data.renda} onChange={e => onChange('renda', e.target.value)} placeholder="5.000,00" />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div style={field}>
          <span style={lbl}>Tipo de renda</span>
          <div style={{ display: 'flex', border: '1px solid #222', borderRadius: 8, overflow: 'hidden' }}>
            {(['formal', 'informal'] as const).map(opt => (
              <button key={opt} type="button" onClick={() => onChange('tipo_renda', data.tipo_renda === opt ? '' : opt)} style={{
                flex: 1, padding: '8px 0', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
                background: data.tipo_renda === opt ? '#10b981' : '#161616',
                color: data.tipo_renda === opt ? '#000' : '#555',
                textTransform: 'capitalize', transition: 'all 0.15s',
              }}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</button>
            ))}
          </div>
        </div>
        <BoolToggle label="Cotista FGTS" value={data.cotista} onChange={v => onChange('cotista', v)} />
        <BoolToggle label="Fator Social" value={data.fator_social} onChange={v => onChange('fator_social', v)} />
      </div>
    </div>
  )
}

// Modal for adding/editing a proponent
function PropModal({
  title, initial, onSave, onClose,
}: { title: string; initial: PropForm; onSave: (f: PropForm) => void; onClose: () => void }) {
  const [form, setForm] = useState(initial)
  function upd(k: keyof PropForm, v: string | boolean) { setForm(p => ({ ...p, [k]: v })) }
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 16, width: 580, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 40px 100px rgba(0,0,0,0.9)', animation: 'fadeUp 0.2s ease both' }}>
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#f0f0f0' }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 22 }}>×</button>
        </div>
        <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '18px 22px' }}>
          <PropFormFields data={form} onChange={upd} />
        </div>
        <div style={{ padding: '14px 22px', borderTop: '1px solid #222', display: 'flex', gap: 10, flexShrink: 0 }}>
          <button onClick={onClose} style={{ flex: 1, background: '#161616', border: '1px solid #2a2a2a', borderRadius: 8, padding: '10px 0', color: '#888', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
          <button onClick={() => onSave(form)} style={{ flex: 2, background: '#10b981', border: 'none', borderRadius: 8, padding: '10px 0', color: '#000', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Salvar Proponente</button>
        </div>
      </div>
    </div>
  )
}

type LeadForm = {
  nome: string; telefone: string; email: string; cpf: string
  renda: string; tipo_imovel: string; campaign_source: string; observations: string
  endereco: string; profissao: string
  tipo_renda: 'formal' | 'informal' | null
  cotista: boolean; fator_social: boolean
  regiao_interesse: string; empreendimento: string; vgv: string
}

export function ClienteProfile({ lead }: { lead: Lead }) {
  const supabase = createClient()
  const router = useRouter()

  const [form, setForm] = useState<LeadForm>({
    nome: lead.nome,
    telefone: lead.telefone,
    email: lead.email ?? '',
    cpf: lead.cpf ?? '',
    renda: lead.renda != null ? String(lead.renda) : '',
    tipo_imovel: lead.tipo_imovel ?? '',
    campaign_source: lead.campaign_source ?? '',
    observations: lead.observations ?? '',
    endereco: lead.endereco ?? '',
    profissao: lead.profissao ?? '',
    tipo_renda: lead.tipo_renda ?? null,
    cotista: lead.cotista ?? false,
    fator_social: lead.fator_social ?? false,
    regiao_interesse: lead.regiao_interesse ?? '',
    empreendimento: lead.empreendimento ?? '',
    vgv: lead.vgv != null ? String(lead.vgv) : '',
  })

  // Additional proponents (index 0 = proponente 2 in UI)
  const [proponentes, setProponentes] = useState<Proponente[]>(lead.proponentes ?? [])
  const [propModal, setPropModal] = useState<{ mode: 'add' } | { mode: 'edit'; idx: number } | null>(null)

  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')

  function upd(f: keyof LeadForm, v: string | boolean | null) {
    setForm(prev => ({ ...prev, [f]: v }))
    setStatus('')
  }

  function parseNum(s: string) {
    if (!s.trim()) return null
    return parseFloat(s.replace(/[^\d,]/g, '').replace(',', '.')) || null
  }

  async function handleSave() {
    if (!form.nome.trim() || !form.telefone.trim()) {
      setStatus('Nome e telefone são obrigatórios.')
      return
    }
    setSaving(true)
    setStatus('')

    const payload: Record<string, unknown> = {
      nome: form.nome.trim(),
      telefone: form.telefone.trim(),
      email: form.email.trim() || null,
      cpf: form.cpf.trim() || null,
      renda: parseNum(form.renda),
      tipo_imovel: form.tipo_imovel.trim() || null,
      campaign_source: form.campaign_source.trim() || null,
      observations: form.observations.trim() || null,
      proponentes: proponentes.length > 0 ? proponentes : null,
      updated_at: new Date().toISOString(),
    }

    // Extended fields (only if migration ran — we try without them if they fail)
    const extended: Record<string, unknown> = {
      endereco: form.endereco.trim() || null,
      profissao: form.profissao.trim() || null,
      tipo_renda: form.tipo_renda || null,
      cotista: form.cotista,
      fator_social: form.fator_social,
      regiao_interesse: form.regiao_interesse.trim() || null,
      empreendimento: form.empreendimento.trim() || null,
      vgv: parseNum(form.vgv),
    }

    let { error } = await supabase.from('leads').update({ ...payload, ...extended }).eq('id', lead.id)

    if (error?.code === '42703') {
      // migration not run yet — save base fields only
      const res = await supabase.from('leads').update(payload).eq('id', lead.id)
      error = res.error
    }

    setSaving(false)
    setStatus(error ? 'Erro ao salvar: ' + error.message : 'Dados salvos com sucesso.')
  }

  async function saveProponentes(newList: Proponente[]) {
    setProponentes(newList)
    await supabase.from('leads').update({ proponentes: newList.length > 0 ? newList : null }).eq('id', lead.id)
    router.refresh()
  }

  function handleSaveProp(form: PropForm) {
    const p = propFormToProponente(form)
    if (propModal?.mode === 'add') {
      saveProponentes([...proponentes, p])
    } else if (propModal?.mode === 'edit') {
      saveProponentes(proponentes.map((x, i) => i === propModal.idx ? p : x))
    }
    setPropModal(null)
  }

  function removeProp(idx: number) {
    if (!window.confirm('Remover este proponente?')) return
    saveProponentes(proponentes.filter((_, i) => i !== idx))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Dados do cliente ── */}
      <div style={{ background: '#111', border: '1px solid #222', borderRadius: 12, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600 }}>Dados do cliente</div>
          <button type="button" onClick={handleSave} disabled={saving} style={{
            background: saving ? '#222' : '#10b981', border: 'none', borderRadius: 8,
            padding: '7px 14px', color: saving ? '#555' : '#000', fontSize: 12, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
          }}>
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>

        {/* Identificação */}
        <div style={{ ...secTitle }}>Identificação</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
          <label style={field}><span style={lbl}>Nome</span><input style={inp} value={form.nome} onChange={e => upd('nome', e.target.value)} /></label>
          <label style={field}><span style={lbl}>Telefone</span><input style={inp} value={form.telefone} onChange={e => upd('telefone', e.target.value)} /></label>
          <label style={field}><span style={lbl}>E-mail</span><input style={inp} type="email" value={form.email} onChange={e => upd('email', e.target.value)} /></label>
          <label style={field}><span style={lbl}>CPF</span><input style={inp} value={form.cpf} onChange={e => upd('cpf', e.target.value)} /></label>
          <label style={{ ...field, gridColumn: '1/-1' }}><span style={lbl}>Endereço</span><input style={inp} value={form.endereco} onChange={e => upd('endereco', e.target.value)} placeholder="Rua, número, bairro, cidade" /></label>
        </div>

        {/* Financeiro */}
        <div style={secTitle}>Financeiro</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
          <label style={field}><span style={lbl}>Profissão</span><input style={inp} value={form.profissao} onChange={e => upd('profissao', e.target.value)} placeholder="Ex: Engenheiro, Autônomo" /></label>
          <label style={field}><span style={lbl}>Renda mensal (R$)</span><input style={inp} value={form.renda} onChange={e => upd('renda', e.target.value)} placeholder="5.000,00" /></label>
          <RendaToggle value={form.tipo_renda} onChange={v => upd('tipo_renda', v)} />
          <BoolToggle label="Cotista FGTS" value={form.cotista} onChange={v => upd('cotista', v)} />
          <BoolToggle label="Fator Social" value={form.fator_social} onChange={v => upd('fator_social', v)} />
        </div>

        {/* Empreendimento */}
        <div style={secTitle}>Empreendimento</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
          <label style={field}><span style={lbl}>Região de interesse</span><input style={inp} value={form.regiao_interesse} onChange={e => upd('regiao_interesse', e.target.value)} placeholder="Ex: Zona Norte" /></label>
          <label style={field}><span style={lbl}>Empreendimento</span><input style={inp} value={form.empreendimento} onChange={e => upd('empreendimento', e.target.value)} placeholder="Nome do empreendimento" /></label>
          <label style={field}><span style={lbl}>VGV (R$)</span><input style={inp} value={form.vgv} onChange={e => upd('vgv', e.target.value)} placeholder="250.000,00" /></label>
          <label style={field}><span style={lbl}>Tipo de imóvel</span><input style={inp} value={form.tipo_imovel} onChange={e => upd('tipo_imovel', e.target.value)} placeholder="Apartamento, Casa..." /></label>
          <label style={{ ...field, gridColumn: '1/-1' }}><span style={lbl}>Origem / Campanha</span><input style={inp} value={form.campaign_source} onChange={e => upd('campaign_source', e.target.value)} /></label>
        </div>

        {status && (
          <div style={{ fontSize: 12, marginTop: 8, color: status.includes('Erro') || status.includes('obrigatórios') ? '#ef5350' : '#10b981' }}>
            {status}
          </div>
        )}
      </div>

      {/* ── Proponentes ── */}
      <div style={{ background: '#111', border: '1px solid #222', borderRadius: 12, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600 }}>Proponentes</div>
          <button type="button" onClick={() => setPropModal({ mode: 'add' })} style={{
            background: '#10b98122', border: '1px solid #10b98155', borderRadius: 8,
            padding: '5px 12px', fontSize: 11, color: '#10b981', cursor: 'pointer', fontWeight: 600,
          }}>+ Adicionar</button>
        </div>

        {/* Main proponent chip */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#161616', border: '1px solid #10b98133', borderRadius: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#10b98122', border: '1px solid #10b98155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#10b981', flexShrink: 0 }}>1</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#f0f0f0' }}>{lead.nome}</div>
              <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>
                Principal · {lead.cpf ?? 'CPF não informado'} · {lead.telefone}
                {lead.profissao && ' · ' + lead.profissao}
                {lead.tipo_renda && ' · ' + lead.tipo_renda.charAt(0).toUpperCase() + lead.tipo_renda.slice(1)}
                {lead.cotista && ' · Cotista'}
                {lead.fator_social && ' · Fator Social'}
              </div>
            </div>
            <span style={{ fontSize: 10, color: '#10b981', fontWeight: 600, flexShrink: 0 }}>Principal</span>
          </div>

          {proponentes.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#161616', border: '1px solid #2a2a2a', borderRadius: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#1c1c1c', border: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#888', flexShrink: 0 }}>{i + 2}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#f0f0f0' }}>{p.nome ?? '—'}</div>
                <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>
                  {p.cpf ?? 'CPF não informado'} · {p.telefone ?? 'Telefone não informado'}
                  {p.profissao && ' · ' + p.profissao}
                  {p.tipo_renda && ' · ' + p.tipo_renda.charAt(0).toUpperCase() + p.tipo_renda.slice(1)}
                  {p.cotista && ' · Cotista'}
                  {p.fator_social && ' · Fator Social'}
                </div>
              </div>
              <button type="button" onClick={() => setPropModal({ mode: 'edit', idx: i })} style={{ background: 'none', border: '1px solid #2a2a2a', borderRadius: 6, padding: '4px 10px', fontSize: 11, color: '#888', cursor: 'pointer' }}>Editar</button>
              <button type="button" onClick={() => removeProp(i)} style={{ background: 'none', border: 'none', color: '#ef5350', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 4px' }}>×</button>
            </div>
          ))}

          {proponentes.length === 0 && (
            <div style={{ fontSize: 12, color: '#444', textAlign: 'center', padding: '12px 0' }}>Nenhum proponente adicional.</div>
          )}
        </div>
      </div>

      {/* ── Observações ── */}
      <div style={{ background: '#111', border: '1px solid #222', borderRadius: 12, padding: 18 }}>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12 }}>Observações</div>
        <textarea
          value={form.observations}
          onChange={e => upd('observations', e.target.value)}
          placeholder="Adicione uma observação..."
          rows={4}
          style={{ ...inp, resize: 'none' }}
        />
        <button type="button" onClick={handleSave} disabled={saving} style={{
          marginTop: 10, background: saving ? '#222' : '#10b981', border: 'none', borderRadius: 8,
          padding: '7px 14px', color: saving ? '#555' : '#000', fontSize: 12, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
        }}>
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      {/* ── Proponent modal ── */}
      {propModal && (
        <PropModal
          title={propModal.mode === 'add' ? 'Adicionar Proponente' : `Editar Proponente ${propModal.idx + 2}`}
          initial={propModal.mode === 'add' ? emptyPropForm() : propToPropForm(proponentes[propModal.idx])}
          onSave={handleSaveProp}
          onClose={() => setPropModal(null)}
        />
      )}
    </div>
  )
}
