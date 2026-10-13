/* Laboratório estático: consulta pedagógica sem chamadas a serviços de IA. */
(() => {
  'use strict';
  const data = window.REDACAO_DATA;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalize = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const stop = new Set('a o as os de da do das dos em no na nos nas e ou para por um uma com sobre ao aos pela pelo que como desafios desafio impactos impacto brasil brasileiro brasileira brasileiros brasileiras'.split(' '));
  const words = value => normalize(value).split(' ').filter(w => w && !stop.has(w));
  const state = {query:'', axis:''};
  const axisName = id => data.axes.find(a => a.id === id)?.title || id;

  function search(query = '', axis = '') {
    const queryWords = new Set(words(query));
    const empty = normalize(query) === '';
    return data.themes.filter(t => !axis || t.axes.includes(axis)).map(theme => {
      let score = 0;
      const matched = [];
      for (const keyword of theme.keywords) {
        const terms = words(keyword);
        const hits = terms.filter(w => queryWords.has(w)).length;
        // Match whole words, so “IST” cannot match “existe”, for example.
        if (terms.length && (hits === terms.length || hits >= 2 || (queryWords.size === 1 && hits === 1))) {
          score += hits === terms.length ? 8 + terms.length : hits;
          matched.push(keyword);
        }
      }
      return {theme, score, matched};
    }).filter(r => empty || r.score > 0).sort((a,b) => b.score - a.score || a.theme.title.localeCompare(b.theme.title, 'pt-BR'));
  }

  function cards() {
    const results = search(state.query, state.axis);
    const activeSearch = normalize(state.query) !== '';
    document.getElementById('lab-count').textContent = `${results.length} ${results.length === 1 ? 'ficha encontrada' : 'fichas encontradas'}${state.axis ? ' em '+axisName(state.axis) : ''}.`;
    document.getElementById('lab-results').innerHTML = results.length ? `<div class="lab-grid">${results.map(({theme,matched}) => `<article class="lab-card"><div class="lab-tags">${theme.axes.map(a => `<span>${escape(axisName(a))}</span>`).join('')}</div><h2><a href="#redacao/${theme.id}">${escape(theme.title)}</a></h2><p>${escape(theme.context)}</p>${activeSearch ? `<p class="lab-match">Pistas da busca: ${escape(matched.slice(0,3).join(' · '))}</p>` : ''}<a class="lab-card-link" href="#redacao/${theme.id}">Explorar argumentos e repertórios <span aria-hidden="true">↗</span></a></article>`).join('')}</div>` : `<div class="lab-empty"><h2>Esta busca ainda não encontrou uma ficha.</h2><p>Tente uma palavra mais específica ou apague a busca e explore os eixos. O acervo é uma seleção de temas, e uma proposta pode ter recortes diferentes dos cadastrados.</p><button type="button" id="lab-browse" class="btn outline">Explorar os cinco eixos</button></div>`;
    document.getElementById('lab-browse')?.addEventListener('click', () => {state.query='';state.axis='';catalog();document.getElementById('lab-query').focus();});
  }

  function catalog() {
    document.getElementById('main').innerHTML = `<section class="lab"><div class="lab-cover"><div><span class="eyebrow">IDEIAS EM CONSTRUÇÃO</span><h1>Laboratório<br>de <em>Redação.</em></h1><p>Explore caminhos, conecte repertórios e construa sua própria tese.</p></div><div class="lab-cover-art" aria-hidden="true"><span>IDEIA</span><b>↔</b><span>ARGUMENTO</span><strong>SUA VOZ<br>NO TEXTO.</strong></div></div><section class="lab-search" aria-labelledby="lab-search-title"><h2 id="lab-search-title">Qual tema você quer investigar?</h2><form id="lab-search-form"><label for="lab-query">Escreva o tema da proposta ou algumas palavras-chave</label><div class="lab-input-row"><input id="lab-query" type="search" maxlength="3000" placeholder="Ex.: desafios da inclusão escolar" value="${escape(state.query)}" aria-describedby="lab-search-help"><button class="btn coral" type="submit">Buscar temas ↗</button></div></form><p id="lab-search-help">A busca aproxima palavras de fichas já preparadas. Leia o recorte da proposta antes de escolher: um tema pode dialogar com vários eixos.</p><div class="lab-filters" role="group" aria-label="Filtrar por eixo temático"><button type="button" data-lab-axis="" aria-pressed="${!state.axis}">Todos os eixos</button>${data.axes.map(a => `<button type="button" data-lab-axis="${a.id}" aria-pressed="${state.axis===a.id}">${escape(a.title)}</button>`).join('')}</div><p id="lab-count" class="lab-count" role="status" aria-live="polite"></p></section><section id="lab-results" aria-label="Fichas de temas"></section><p class="lab-note">24 fichas de consulta · Conteúdo preparado a partir dos materiais do professor, com fontes de conferência. A consulta não gera respostas por IA.</p></section>`;
    document.getElementById('lab-search-form').addEventListener('submit', e => {e.preventDefault();state.query=document.getElementById('lab-query').value.trim();cards();});
    document.querySelectorAll('[data-lab-axis]').forEach(button => button.addEventListener('click', () => {state.query=document.getElementById('lab-query').value.trim();state.axis=button.dataset.labAxis;document.querySelectorAll('[data-lab-axis]').forEach(b => b.setAttribute('aria-pressed', String(b===button)));cards();}));
    document.getElementById('lab-query').addEventListener('search', e => {if (!e.target.value) {state.query='';cards();}});
    cards();
  }

  function ficha(id) {
    const theme = data.themes.find(t => t.id===id);
    if (!theme) {
      document.getElementById('main').innerHTML = '<section class="lab"><h1>Ficha não encontrada.</h1><p>Volte ao laboratório para consultar o acervo.</p><a class="btn" href="#redacao">Explorar temas ↗</a></section>';
      return;
    }
    document.getElementById('main').innerHTML = `<article class="lab lab-ficha"><a class="back" href="#redacao">← Voltar aos temas</a><div class="lab-tags">${theme.axes.map(a=>`<span>${escape(axisName(a))}</span>`).join('')}</div><span class="eyebrow">FICHA DE INVESTIGAÇÃO</span><h1>${escape(theme.title)}</h1><p class="intro">${escape(theme.context)}</p><div class="lab-guide"><b>Use como ponto de partida.</b><p>Os caminhos são possibilidades de investigação, não causas automaticamente comprovadas. Escolha os que consegue explicar e sustentar com evidências. Você não precisa usar todos os repertórios.</p></div><nav class="lab-section-nav" aria-label="Seções da ficha"><button type="button" data-lab-section="lab-paths">1. Explorar caminhos</button><button type="button" data-lab-section="lab-refs">2. Conectar repertórios</button><button type="button" data-lab-section="lab-thesis">3. Construir a tese</button></nav><section id="lab-paths"><div class="lab-section-heading"><span class="lab-number">01</span><div><h2>Seis caminhos de argumentação</h2><p>Abra uma possibilidade e investigue o que ela permite explicar.</p></div></div><div class="lab-paths">${theme.paths.map((path,i)=>`<details class="lab-detail"><summary><span class="lab-index">${i+1}</span>${escape(path.title)}</summary><div class="lab-detail-body"><p>${escape(path.explanation)}</p><p class="lab-question"><b>Pergunta para investigar</b><br>${escape(path.question)}</p></div></details>`).join('')}</div></section><section id="lab-refs"><div class="lab-section-heading"><span class="lab-number">02</span><div><h2>Repertórios que podem dialogar com o tema</h2><p>Explique a ligação com o seu argumento. A referência precisa contribuir para o raciocínio.</p></div></div><div class="lab-refs">${theme.repertories.map((use,i)=>{const r=data.references[use.ref];return `<details class="lab-detail lab-repertory"><summary><span class="lab-index">${i+1}</span>${escape(r.title)}</summary><div class="lab-detail-body"><h3>Ideia central</h3><p>${escape(r.idea)}</p><h3>Como pode entrar neste tema</h3><p>${escape(use.application)}</p><div class="lab-care"><h3>Cuidado de uso</h3><p>${escape(r.care)}</p></div><a class="lab-source" href="${escape(r.url)}" target="_blank" rel="noopener noreferrer">Conferir a fonte ↗ <span class="sr-only">(abre em outra aba)</span></a><p class="lab-origin">${escape(r.origin)}</p></div></details>`;}).join('')}</div><p class="lab-note">As explicações são paráfrases e aplicações pedagógicas, não citações literais. Obras ficcionais ilustram experiências; leis estabelecem direitos; dados e pesquisas têm recortes próprios. Consulte a fonte antes de citar uma informação.</p></section><section id="lab-thesis" class="lab-thesis"><span class="eyebrow">AGORA, A AUTORIA É SUA</span><h2>Qual posição você consegue defender?</h2><p>Escolha dois caminhos e responda no seu caderno:</p><ol><li>Qual problema específico a proposta pede que eu analise?</li><li>Como os fatores escolhidos se relacionam com esse problema?</li><li>Que evidência ou exemplo sustenta cada argumento?</li><li>O que os repertórios ajudam a explicar, sem generalizações?</li><li>Que posição posso defender a partir dessas relações?</li></ol><p><b>Escreva sua tese depois dessa investigação.</b> Revise se ela responde ao recorte da proposta e se você consegue desenvolvê-la nos argumentos.</p><a class="btn outline" href="#redacao">Consultar outro tema ↗</a></section><p class="lab-note">Seleção baseada nos sete materiais enviados sobre eixos, filmes e repertórios. Complementos oficiais estão identificados nas referências. Conferência editorial: 13/10/2026. Informações de saúde são utilizadas para estudo de argumentação, sem orientação clínica.</p></article>`;
    document.querySelectorAll('[data-lab-section]').forEach(b => b.addEventListener('click', () => {const target=document.getElementById(b.dataset.labSection);target.setAttribute('tabindex','-1');target.focus({preventScroll:true});target.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});}));
  }
  window.Redacao = Object.freeze({render: id => id ? ficha(id) : catalog(), search, normalize});
})();
