// BANCO DE DADOS SIMULADO (localStorage)
let estadoApp = {
    usuarioLogado: null,
    
    // Apenas a conta Mestre (Professor) para você administrar o sistema.
    // O resto está zerado para os alunos se cadastrarem sozinhos!
    alunos: JSON.parse(localStorage.getItem('ebd_alunos')) || [
        { id: 'gabriel', nome: 'Gabriel', senha: '123', nascimento: '', tipo: 'professor', pontos: 0, avatar: 'GB' }
    ],
    
    // Tudo vazio para o lançamento
    resumos: JSON.parse(localStorage.getItem('ebd_resumos')) || [],
    historico: JSON.parse(localStorage.getItem('ebd_historico')) || [], 
    sugestoes: JSON.parse(localStorage.getItem('ebd_sugestoes')) || [], 
    
    // ESTADO INICIAL PARA O LANÇAMENTO (Modo Mistério ativado!)
    desafioAtual: JSON.parse(localStorage.getItem('ebd_desafio')) || { 
        titulo: "Preparem-se...", 
        prazo: "2026-10-18", 
        misterio: true 
    },
    votacaoAtual: JSON.parse(localStorage.getItem('ebd_votacao')) || null 
};

// Pega a data de hoje localmente
function obterDataLocalString() {
    const dataLocal = new Date();
    const ano = dataLocal.getFullYear();
    const mes = String(dataLocal.getMonth() + 1).padStart(2, '0');
    const dia = String(dataLocal.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}

document.addEventListener('DOMContentLoaded', () => {
    const usuarioSalvo = localStorage.getItem('ebd_sessao_atual');
    if (usuarioSalvo) {
        const usuario = estadoApp.alunos.find(a => a.id === usuarioSalvo);
        if (usuario) estadoApp.usuarioLogado = usuario;
    }
    
    const elData = document.getElementById('profDataPonto');
    if (elData) elData.value = obterDataLocalString();

    atualizarTelaAuth();
});

function alternarAbaAuth(aba) {
    const btnL = document.getElementById('tabBtnLogin'), btnR = document.getElementById('tabBtnRegistro');
    const formL = document.getElementById('formLogin'), formR = document.getElementById('formRegistro');
    if (aba === 'login') {
        btnL.className = "py-2 text-xs font-bold rounded-lg bg-brand-600 text-white shadow";
        btnR.className = "py-2 text-xs font-bold rounded-lg text-slate-400 hover:text-white";
        formL.classList.remove('hidden'); formR.classList.add('hidden');
    } else {
        btnR.className = "py-2 text-xs font-bold rounded-lg bg-brand-600 text-white shadow";
        btnL.className = "py-2 text-xs font-bold rounded-lg text-slate-400 hover:text-white";
        formR.classList.remove('hidden'); formL.classList.add('hidden');
    }
}

// ============== LOGIN E REGISTRO ==============
function realizarLogin(e) {
    e.preventDefault();
    const nomeDigitado = document.getElementById('loginNome').value.trim().toLowerCase();
    const senhaDigitada = document.getElementById('loginSenha').value;
    
    const usuario = estadoApp.alunos.find(a => a.nome.toLowerCase() === nomeDigitado || a.id === nomeDigitado);
    
    if (!usuario) {
        return alert('Usuário não encontrado! Verifique o nome digitado.');
    }

    const senhaCorreta = usuario.senha || '123'; 
    if (senhaDigitada !== senhaCorreta) {
        return alert('Senha incorreta!');
    }
    
    estadoApp.usuarioLogado = usuario;
    localStorage.setItem('ebd_sessao_atual', usuario.id);
    
    document.getElementById('loginSenha').value = ''; 
    atualizarTelaAuth();
}

function realizarRegistro(e) {
    e.preventDefault();
    const nome = document.getElementById('regNome').value.trim();
    const nasc = document.getElementById('regNascimento').value;
    const senha = document.getElementById('regSenha').value;
    const id = nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '_');
    
    if (estadoApp.alunos.some(a => a.id === id)) return alert('Esse nome já está cadastrado. Faça login.');
    if (senha.length < 3) return alert('Por favor, crie uma senha mais forte (mínimo 3 caracteres).');

    const novoUsuario = { 
        id, nome, nascimento: nasc, senha: senha, tipo: 'aluno', pontos: 0, avatar: nome.substring(0,2).toUpperCase() 
    };
    
    estadoApp.alunos.push(novoUsuario);
    salvarDados();
    
    estadoApp.usuarioLogado = novoUsuario;
    localStorage.setItem('ebd_sessao_atual', novoUsuario.id);
    
    document.getElementById('regSenha').value = ''; 
    atualizarTelaAuth();
}

function fazerLogout() {
    estadoApp.usuarioLogado = null;
    localStorage.removeItem('ebd_sessao_atual');
    atualizarTelaAuth();
}

function salvarDados() {
    localStorage.setItem('ebd_alunos', JSON.stringify(estadoApp.alunos));
    localStorage.setItem('ebd_resumos', JSON.stringify(estadoApp.resumos));
    localStorage.setItem('ebd_historico', JSON.stringify(estadoApp.historico));
    localStorage.setItem('ebd_sugestoes', JSON.stringify(estadoApp.sugestoes));
    localStorage.setItem('ebd_desafio', JSON.stringify(estadoApp.desafioAtual));
    localStorage.setItem('ebd_votacao', JSON.stringify(estadoApp.votacaoAtual));
}

function atualizarTelaAuth() {
    if (!estadoApp.usuarioLogado) {
        document.getElementById('telaAuth').classList.remove('hidden');
        document.getElementById('appContainer').classList.add('hidden');
        return;
    }
    document.getElementById('telaAuth').classList.add('hidden');
    document.getElementById('appContainer').classList.remove('hidden');

    const u = estadoApp.usuarioLogado;
    document.getElementById('topbarUserName').textContent = u.nome;
    document.getElementById('topbarUserRole').textContent = u.tipo === 'professor' ? 'Professor' : 'Aluno';
    document.getElementById('userName').textContent = u.nome;
    document.getElementById('userAvatar').textContent = u.avatar;
    document.getElementById('userBadge').textContent = u.tipo === 'professor' ? 'Professor / Líder' : 'Aluno / Jovem';

    const alunoStats = document.getElementById('alunoStats');

    if (u.tipo === 'aluno') {
        document.getElementById('painelAluno').classList.remove('hidden');
        document.getElementById('painelExtratoAluno').classList.remove('hidden');
        document.getElementById('painelProfessor').classList.add('hidden');
        
        alunoStats.classList.remove('hidden');
        
        document.getElementById('statPontos').textContent = u.pontos || 0;
        const apenasAlunos = estadoApp.alunos.filter(a => a.tipo === 'aluno');
        const pos = [...apenasAlunos].sort((a,b) => b.pontos - a.pontos).findIndex(a => a.id === u.id) + 1;
        document.getElementById('statPosicao').textContent = (pos > 0 ? pos : 1) + 'º';

        renderizarDesafioAluno();
        renderizarVotacaoAluno();
        renderizarHistoricoAluno(u.id);
    } else {
        document.getElementById('painelProfessor').classList.remove('hidden');
        document.getElementById('painelAluno').classList.add('hidden');
        document.getElementById('painelExtratoAluno').classList.add('hidden');
        
        alunoStats.classList.add('hidden');
        
        document.getElementById('cfgDesafioTitulo').value = estadoApp.desafioAtual.titulo;
        document.getElementById('cfgDesafioPrazo').value = estadoApp.desafioAtual.prazo;
        document.getElementById('cfgDesafioMisterio').checked = estadoApp.desafioAtual.misterio === true;
        
        renderizarSelectProfAluno();
        renderizarResumosPendentes();
        renderizarMuralSugestoes();
        renderizarVotacaoProf();
        renderizarAlunosGeral();
    }

    renderizarRankingGeral();
}

// ============== RANKING GERAL ==============
function renderizarRankingGeral() {
    const tbody = document.getElementById('tabelaRankingGeral');
    const apenasAlunos = estadoApp.alunos.filter(a => a.tipo === 'aluno');
    const rankingOrdenado = [...apenasAlunos].sort((a,b) => (b.pontos || 0) - (a.pontos || 0));
    
    if (rankingOrdenado.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="py-4 text-center text-xs text-slate-500">Nenhum aluno cadastrado para o Ranking.</td></tr>`;
        return;
    }

    tbody.innerHTML = rankingOrdenado.map((aluno, index) => {
        let medalha = '';
        if (index === 0) medalha = '<span class="text-amber-400 font-bold"><i class="fa-solid fa-crown mr-1"></i> 1º</span>';
        else if (index === 1) medalha = '<span class="text-slate-300 font-bold">2º</span>';
        else if (index === 2) medalha = '<span class="text-amber-700 font-bold">3º</span>';
        else medalha = `<span class="text-slate-500">${index + 1}º</span>`;
        const nivel = Math.floor((aluno.pontos || 0) / 10) + 1;

        return `
            <tr class="hover:bg-slate-800/40 transition">
                <td class="py-3 px-2 sm:px-4 font-bold">${medalha}</td>
                <td class="py-3 px-2 sm:px-4 flex items-center space-x-3">
                    <div class="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-brand-600/20 text-brand-400 font-bold text-[10px] sm:text-xs flex items-center justify-center border border-brand-500/30">${aluno.avatar}</div>
                    <span class="font-semibold text-white truncate max-w-[100px] sm:max-w-xs">${aluno.nome}</span>
                </td>
                <td class="py-3 px-2 sm:px-4 text-center text-slate-300">
                    <span class="bg-brand-500/10 border border-brand-500/20 text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded text-brand-400">Nv. ${nivel}</span>
                </td>
                <td class="py-3 px-2 sm:px-4 text-right font-extrabold text-brand-400">${aluno.pontos || 0} pts</td>
            </tr>
        `;
    }).join('');
}

// ============== ALUNO: EXTRATO ==============
function renderizarHistoricoAluno(id) {
    const container = document.getElementById('listaHistoricoAluno');
    const meusPontos = estadoApp.historico.filter(h => h.alunoId === id).reverse();
    if(meusPontos.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-500 italic">Nenhum ponto registrado ainda.</p>`;
        return;
    }
    container.innerHTML = meusPontos.map(h => `
        <div class="flex justify-between items-center bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50">
            <div>
                <p class="text-xs font-bold text-white">${h.motivo}</p>
                <p class="text-[10px] text-slate-400">${h.data.split('-').reverse().join('/')}</p>
            </div>
            <span class="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded"> +${h.pontos} pt </span>
        </div>
    `).join('');
}

// ============== ALUNO: SUGESTÕES ==============
function enviarSugestao(e) {
    e.preventDefault();
    const texto = document.getElementById('inputSugestao').value;
    estadoApp.sugestoes.unshift({
        alunoNome: estadoApp.usuarioLogado.nome,
        texto: texto,
        data: new Date().toLocaleDateString('pt-BR')
    });
    salvarDados();
    document.getElementById('inputSugestao').value = '';
    alert('Sugestão enviada para os professores!');
}

// ============== DESAFIO E RESUMOS (COM MISTÉRIO) ==============
function renderizarDesafioAluno() {
    const desafio = estadoApp.desafioAtual;
    document.getElementById('alunoDesafioTitulo').textContent = desafio.titulo;
    document.getElementById('alunoDesafioPrazo').textContent = desafio.prazo ? desafio.prazo.split('-').reverse().join('/') : '--';

    const formResumo = document.getElementById('formResumoAluno');
    const areaMisterio = document.getElementById('areaMisterio');
    const textarea = document.getElementById('resumoTexto');
    const btnEnviar = document.getElementById('btnEnviarResumo');
    const msgPrazo = document.getElementById('msgPrazoEncerrado');
    const hoje = obterDataLocalString();

    if (desafio.misterio) {
        formResumo.classList.add('hidden');
        areaMisterio.classList.remove('hidden');
        return; 
    } else {
        formResumo.classList.remove('hidden');
        areaMisterio.classList.add('hidden');
    }

    if (hoje > desafio.prazo) {
        textarea.disabled = true;
        textarea.classList.add('opacity-40', 'cursor-not-allowed', 'bg-slate-900');
        textarea.placeholder = "Envio encerrado. Aguarde o próximo desafio.";
        btnEnviar.classList.add('hidden');
        msgPrazo.classList.remove('hidden');
    } else {
        textarea.disabled = false;
        textarea.classList.remove('opacity-40', 'cursor-not-allowed', 'bg-slate-900');
        textarea.placeholder = "Escreva seu resumo ou respostas aqui...";
        btnEnviar.classList.remove('hidden');
        msgPrazo.classList.add('hidden');
    }
}

function salvarDesafio(e) {
    e.preventDefault();
    estadoApp.desafioAtual = {
        titulo: document.getElementById('cfgDesafioTitulo').value,
        prazo: document.getElementById('cfgDesafioPrazo').value,
        misterio: document.getElementById('cfgDesafioMisterio').checked
    };
    salvarDados();
    alert('Desafio e Modo Mistério atualizados com sucesso!');
}

function enviarResumo(e) {
    e.preventDefault();
    if (estadoApp.desafioAtual.misterio) {
        alert("O Modo Mistério está ativado. Envio bloqueado.");
        return;
    }

    const hoje = obterDataLocalString();
    if (hoje > estadoApp.desafioAtual.prazo) {
        alert("Erro: O prazo para este desafio já foi encerrado.");
        return;
    }

    const texto = document.getElementById('resumoTexto').value;
    estadoApp.resumos.unshift({
        id: Date.now(),
        alunoId: estadoApp.usuarioLogado.id,
        alunoNome: estadoApp.usuarioLogado.nome,
        titulo: estadoApp.desafioAtual.titulo,
        texto: texto,
        status: 'pendente'
    });
    salvarDados();
    document.getElementById('resumoTexto').value = '';
    alert('Resumo enviado para validação!');
}

// ============== VOTAÇÕES ==============
function salvarVotacao(e) {
    e.preventDefault();
    estadoApp.votacaoAtual = {
        pergunta: document.getElementById('cfgVotoPergunta').value,
        opcoes: [
            { id: 1, texto: document.getElementById('cfgVotoOp1').value, votos: 0 },
            { id: 2, texto: document.getElementById('cfgVotoOp2').value, votos: 0 }
        ],
        votaram: []
    };
    salvarDados();
    document.getElementById('cfgVotoPergunta').value = '';
    document.getElementById('cfgVotoOp1').value = '';
    document.getElementById('cfgVotoOp2').value = '';
    alert("Votação iniciada!");
    renderizarVotacaoProf();
}

function renderizarVotacaoAluno() {
    const area = document.getElementById('areaVotacaoAluno');
    const container = document.getElementById('opcoesVotacao');
    const v = estadoApp.votacaoAtual;
    
    if(!v) { area.classList.add('hidden'); return; }
    area.classList.remove('hidden');
    document.getElementById('votacaoPergunta').textContent = v.pergunta;

    if (v.votaram.includes(estadoApp.usuarioLogado.id)) {
        const totalVotos = v.opcoes.reduce((acc, op) => acc + op.votos, 0);
        container.innerHTML = v.opcoes.map(op => {
            const pct = totalVotos === 0 ? 0 : Math.round((op.votos / totalVotos) * 100);
            return `
            <div class="mb-2">
                <div class="flex justify-between text-xs sm:text-sm mb-1"><span>${op.texto}</span> <span class="font-bold">${pct}%</span></div>
                <div class="w-full bg-slate-800 rounded-full h-2.5 sm:h-3"><div class="bg-brand-500 h-2.5 sm:h-3 rounded-full" style="width: ${pct}%"></div></div>
            </div>`;
        }).join('');
    } else {
        container.innerHTML = v.opcoes.map(op => `
            <button onclick="registrarVoto(${op.id})" class="w-full text-left bg-slate-800 hover:bg-slate-700 border border-slate-700 p-3 sm:p-4 rounded-xl text-xs sm:text-sm transition shadow">
                <i class="fa-regular fa-circle text-slate-400 mr-2"></i> ${op.texto}
            </button>
        `).join('');
    }
}

function registrarVoto(opId) {
    const v = estadoApp.votacaoAtual;
    const op = v.opcoes.find(o => o.id === opId);
    op.votos++;
    v.votaram.push(estadoApp.usuarioLogado.id);
    salvarDados();
    renderizarVotacaoAluno();
}

function renderizarVotacaoProf() {
    const res = document.getElementById('resultadoVotacaoProf');
    const v = estadoApp.votacaoAtual;
    if(!v) { res.classList.add('hidden'); return; }
    
    res.classList.remove('hidden');
    const total = v.opcoes.reduce((acc, o) => acc + o.votos, 0);
    res.innerHTML = `<div class="font-bold mb-2 border-b border-slate-700 pb-1">Enquete Ativa: ${v.pergunta} (${total} votos)</div>` + 
        v.opcoes.map(op => `<div class="flex justify-between py-1"><span>${op.texto}</span> <span class="text-brand-400 font-bold">${op.votos} votos</span></div>`).join('');
}

// ============== PROFESSOR: FUNÇÕES E GESTÃO ==============
function renderizarSelectProfAluno() {
    const select = document.getElementById('profAlunoSelect');
    select.innerHTML = estadoApp.alunos.filter(a => a.tipo === 'aluno').map(a => `<option value="${a.id}">${a.nome}</option>`).join('');
}

function lancarPontos(e) {
    e.preventDefault();
    const data = document.getElementById('profDataPonto').value;
    const alunoId = document.getElementById('profAlunoSelect').value;
    const [pontosAdd, motivo] = document.getElementById('profTipoPontos').value.split('|');
    
    const aluno = estadoApp.alunos.find(a => a.id === alunoId);
    if (!aluno) return;

    aluno.pontos = (aluno.pontos || 0) + parseInt(pontosAdd);
    estadoApp.historico.push({ id: Date.now(), alunoId: aluno.id, data: data, motivo: motivo, pontos: parseInt(pontosAdd) });
    
    salvarDados();
    renderizarRankingGeral();
    renderizarAlunosGeral();
    alert(`Lançado: +${pontosAdd} pontos para ${aluno.nome} (${motivo}).`);
}

function renderizarMuralSugestoes() {
    const container = document.getElementById('listaSugestoesProf');
    if(estadoApp.sugestoes.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-500 italic">Nenhuma sugestão ainda.</p>`;
        return;
    }
    container.innerHTML = estadoApp.sugestoes.map(s => `
        <div class="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
            <div class="flex justify-between items-center mb-1"><span class="text-xs font-bold text-amber-400">${s.alunoNome}</span><span class="text-[10px] text-slate-500">${s.data}</span></div>
            <p class="text-xs text-slate-300">${s.texto}</p>
        </div>
    `).join('');
}

function renderizarResumosPendentes() {
    const container = document.getElementById('listaResumosPendentes');
    const pendentes = estadoApp.resumos.filter(r => r.status === 'pendente');

    if (pendentes.length === 0) { container.innerHTML = `<p class="text-xs text-slate-500 italic">Nenhum resumo pendente de validação.</p>`; return; }

    container.innerHTML = pendentes.map(r => `
        <div class="bg-slate-800/50 p-4 rounded-xl flex flex-col gap-2 border border-slate-700/50">
            <div><span class="text-xs font-semibold text-brand-400">${r.alunoNome}</span> • <span class="text-xs text-slate-400">${r.titulo}</span></div>
            <p class="text-xs sm:text-sm text-slate-300 bg-slate-900/60 p-3 rounded-lg">${r.texto}</p>
            <button onclick="aprovarResumo(${r.id})" class="self-end bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition shadow-lg mt-2"><i class="fa-solid fa-check mr-1"></i> Aprovar (+1 pt)</button>
        </div>
    `).join('');
}

function aprovarResumo(id) {
    const resumo = estadoApp.resumos.find(r => r.id === id);
    if (resumo) {
        resumo.status = 'aprovado';
        const aluno = estadoApp.alunos.find(a => a.id === resumo.alunoId);
        if (aluno) {
            aluno.pontos = (aluno.pontos || 0) + 1;
            estadoApp.historico.push({ id: Date.now(), alunoId: aluno.id, data: obterDataLocalString(), motivo: 'Resumo Aprovado', pontos: 1 });
        }
        salvarDados();
        renderizarResumosPendentes();
        renderizarRankingGeral();
        renderizarAlunosGeral();
        alert('Aprovado!');
    }
}

// ============== PROFESSOR: CONTROLE E EDIÇÃO DE ALUNOS ==============
function renderizarAlunosGeral() {
    const container = document.getElementById('listaAlunosGeral');
    const apenasAlunos = estadoApp.alunos.filter(a => a.tipo === 'aluno');

    if (apenasAlunos.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-500 italic">Nenhum jovem matriculado.</p>`;
        return;
    }

    container.innerHTML = apenasAlunos.map(a => `
        <div class="bg-slate-800/40 border border-slate-700/50 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="flex items-center space-x-3">
                <div class="w-9 h-9 rounded-lg bg-brand-600/20 text-brand-400 font-bold text-xs flex items-center justify-center border border-brand-500/30">${a.avatar}</div>
                <div>
                    <h5 class="font-bold text-xs text-white">${a.nome}</h5>
                    <span class="text-[10px] text-slate-400">Nasc: ${a.nascimento ? a.nascimento.split('-').reverse().join('/') : 'Não informada'}</span>
                </div>
            </div>
            <div class="flex items-center gap-3 self-end sm:self-center">
                <span class="text-xs font-bold text-brand-400 bg-brand-500/10 px-2.5 py-1 rounded-lg border border-brand-500/20">${a.pontos || 0} pts</span>
                <div class="flex items-center gap-2 border-l border-slate-700 pl-3">
                    <button onclick="abrirModalEditarAluno('${a.id}')" class="text-slate-400 hover:text-brand-400 transition" title="Editar Dados"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button onclick="excluirAluno('${a.id}')" class="text-slate-400 hover:text-red-400 transition" title="Excluir Aluno"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        </div>
    `).join('');
}

function excluirAluno(id) {
    if (confirm("Tem certeza que deseja excluir este jovem? Todo o histórico dele será perdido.")) {
        estadoApp.alunos = estadoApp.alunos.filter(a => a.id !== id);
        estadoApp.resumos = estadoApp.resumos.filter(r => r.alunoId !== id);
        estadoApp.historico = estadoApp.historico.filter(h => h.alunoId !== id);
        salvarDados();
        atualizarTelaAuth();
        alert("Aluno excluído com sucesso.");
    }
}

function abrirModalEditarAluno(id) {
    const aluno = estadoApp.alunos.find(a => a.id === id);
    if (!aluno) return;
    
    document.getElementById('editIdAluno').value = aluno.id;
    document.getElementById('editNome').value = aluno.nome;
    document.getElementById('editSenha').value = ''; 
    document.getElementById('editNascimento').value = aluno.nascimento || '';
    document.getElementById('editPontos').value = aluno.pontos || 0;
    
    document.getElementById('modalEditarAluno').classList.remove('hidden');
}

function fecharModalEditarAluno() {
    document.getElementById('modalEditarAluno').classList.add('hidden');
}

function salvarEdicaoAluno(e) {
    e.preventDefault();
    const id = document.getElementById('editIdAluno').value;
    const aluno = estadoApp.alunos.find(a => a.id === id);
    
    if (aluno) {
        aluno.nome = document.getElementById('editNome').value;
        aluno.nascimento = document.getElementById('editNascimento').value;
        aluno.pontos = parseInt(document.getElementById('editPontos').value) || 0;
        aluno.avatar = aluno.nome.substring(0,2).toUpperCase();
        
        const novaSenha = document.getElementById('editSenha').value;
        if (novaSenha.trim() !== '') {
            aluno.senha = novaSenha;
        }
        
        salvarDados();
        atualizarTelaAuth();
        fecharModalEditarAluno();
        alert("Dados do aluno atualizados com sucesso!");
    }
}