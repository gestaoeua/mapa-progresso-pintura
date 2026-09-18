import { useState } from 'react';
import App from './App';
import { workItems } from './workOrder';
import './Concord.css';

export default function Concord() {
  const [view, setView] = useState('nova');
  const [selectedId, setSelectedId] = useState('T01');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [zoom, setZoom] = useState(1);
  const selected = workItems.find(item => item.id === selectedId)!;
  const visible = workItems.filter(item => `${item.title} ${item.location}`.toLowerCase().includes(query.toLowerCase()) && (filter === 'all' || (filter === 'pending' ? item.coats < 2 : item.kind === filter)));
  const select = (id: string) => { setSelectedId(id); document.getElementById('os-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  return <>
    <nav className="os-nav" aria-label="Ordens de serviço">
      <strong>CONCORD <span>RSF Painting</span></strong>
      <div><button aria-pressed={view === 'nova'} onClick={() => setView('nova')}>Nova OS · 17/09/2026</button><button aria-pressed={view === 'anterior'} onClick={() => setView('anterior')}>OS anterior / painel original</button></div>
    </nav>
    {view === 'anterior' ? <><p className="os-history">OS anterior: 100% finalizada conforme registro da obra. Abaixo, painel original e dados históricos da planilha.</p><App /></> : <main className="os-shell">
      <header className="os-header"><div><span className="eyebrow">NOVA ORDEM DE SERVIÇO · PINTURA ADICIONAL</span><h1>Concord — Job 1-0629-25</h1><p>279 Pleasant Street, Concord, NH</p></div><div className="os-date">Registro de execução<strong>17 setembro 2026</strong><small>Usar Job 1-0629-25 nas compras desta obra.</small></div></header>
      <section className="os-stats" aria-label="Resumo executado">
        <article><span>Trims de portas</span><strong>10 / 10</strong><p>2 demãos em cada · concluídos</p></article>
        <article><span>Portas concluídas</span><strong>2 / 3</strong><p>2 demãos em cada porta concluída</p></article>
        <article className="os-pending"><span>Porta externa</span><strong>1 / 2 <small>demãos</small></strong><p>Segunda demão pendente</p></article>
      </section>
      <p className="os-context">12 de 13 itens concluídos neste registro de trims e portas. A OS anterior permanece 100% finalizada.</p>
      <div className="os-layout"><section className="os-card os-register"><h2>Itens executados</h2><label className="os-search">Buscar item ou sala<input value={query} onChange={e => setQuery(e.target.value)} placeholder="Ex.: Trim #5, MEDS, 1-013" /></label><div className="os-filters" aria-label="Filtrar itens">{[['all', 'Todos'], ['trim', 'Trims (10)'], ['door', 'Portas (3)'], ['pending', 'Pendente (1)']].map(([key, label]) => <button key={key} aria-pressed={filter === key} onClick={() => setFilter(key)}>{label}</button>)}</div>
        {(['trim', 'door'] as const).map(kind => <section key={kind}><h3>{kind === 'trim' ? 'Trims / batentes metálicos' : 'Portas — itens separados'}</h3>{visible.filter(item => item.kind === kind).map(item => <button className={`os-item ${selected.id === item.id ? 'is-selected' : ''}`} key={item.id} onClick={() => select(item.id)} aria-pressed={selected.id === item.id}><span className="os-code">{item.id}</span><span><b>{item.title}</b><small>{item.location}</small></span><span className={`os-badge ${item.coats < 2 ? 'pending' : ''}`}>{item.coats}/2 demãos</span></button>)}</section>)}
        {!visible.length && <p>Nenhum item corresponde à busca.</p>}
      </section>
      <section className="os-card os-detail" id="os-detail" aria-live="polite"><div className="os-detail-heading"><div><span className="eyebrow">{selected.id} · {selected.kind === 'trim' ? 'TRIM DE PORTA' : 'PORTA'}</span><h2>{selected.title}</h2></div><span className={`os-badge ${selected.coats < 2 ? 'pending' : ''}`}>{selected.coats === 2 ? 'Concluído · 2 demãos' : 'Em andamento · 1 demão'}</span></div><p className="os-location">{selected.location}</p><p>{selected.kind === 'trim' ? 'Pintura/acabamento do batente metálico, incluindo a parte interna junto às ferragens.' : 'Pintura da folha da porta, contabilizada separadamente dos trims.'}</p>{selected.note && <p className="os-notice">{selected.note}</p>}
        <div className="os-map-heading"><h3>Localização na planta</h3><div><button aria-label="Diminuir planta" onClick={() => setZoom(z => Math.max(1, z - .5))}>−</button><span>{zoom * 100}%</span><button aria-label="Ampliar planta" onClick={() => setZoom(z => Math.min(3, z + .5))}>+</button><a href={`${import.meta.env.BASE_URL}floor-plan.png`} target="_blank" rel="noreferrer">Abrir planta</a></div></div>
        <p className="os-caption">{selected.area ? `${selected.area.label}. Referência de área; posição exata do batente não levantada.` : 'Sem marcador: falta confirmar a posição deste item na planta.'} Os círculos azuis já fazem parte da planta original e não indicam o status desta OS.</p>
        <div className="os-map-scroll"><div className="os-plan" style={{ width: `${zoom * 100}%` }}><img src={`${import.meta.env.BASE_URL}floor-plan.png`} alt="Planta de Concord com identificação das salas" />{selected.area && <span className="os-pin" style={{ left: `${selected.area.x}%`, top: `${selected.area.y}%` }} aria-label={selected.area.label}>{selected.id === 'T01' || selected.id === 'T02' ? 'T01 / T02' : selected.id}</span>}</div></div>
        <h3>Fotos · Before / Progress / After</h3><p className="os-caption">A etapa da foto é preservada. O status atual considera a confirmação final de execução, mesmo quando a foto mostra uma etapa anterior.</p>
        <div className="os-photos">{(['Before', 'Progress', 'After'] as const).map(stage => <section key={stage}><h4>{stage}</h4>{selected.photos.filter(p => p.stage === stage).length ? selected.photos.filter(p => p.stage === stage).map(p => <figure key={p.file}><a href={`${import.meta.env.BASE_URL}os-2026-09-17/${p.file}`} target="_blank" rel="noreferrer"><img loading="lazy" src={`${import.meta.env.BASE_URL}os-2026-09-17/${p.file}`} alt={p.caption} /></a><figcaption>{p.caption}</figcaption></figure>) : <p className="os-photo-empty">Sem foto vinculada nesta publicação.</p>}</section>)}</div>
      </section></div>
      <details className="os-card os-notes"><summary>Escopo, evidências e pontos a conferir</summary><p>Base: conversa “Nova OS Concord”, com confirmação final de 10 trims × 2 demãos, 2 portas × 2 demãos e 1 porta externa × 1 demão. A confirmação final substitui as contagens parciais anteriores.</p><p>Foram recuperadas 9 fotos de serviço. Outras fotos e recortes de planta citados na conversa não estavam acessíveis na exportação; os campos sem imagem permanecem explícitos. Fotos dos trims #1 e #2 são compartilhadas como registro do par, sem atribuição individual.</p><p>Localizações a conferir: trims #3 e #10; posição do trim #9 (divergência em 1-040); números e pontos exatos das portas. O código ST2B aparece no levantamento inicial, mas não foi associado a uma das duas portas concluídas sem confirmação.</p><p>Levantamento adicional anterior: janela/acabamento 1-048; estruturas de vidro 1-052 e 1-002; touch-ups. Não há confirmação final de execução desses serviços, que ficam fora dos totais de trims e portas acima.</p></details>
      <footer className="os-footer">Job 1-0629-25 · Registro somente leitura · Dados da nova OS publicados em 17/09/2026</footer>
    </main>}
  </>;
}
