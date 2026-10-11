// ================= CONFIGURAÇÃO DO SUPABASE =================
const SUPABASE_URL = 'https://iaadqwzjfyduwprobimb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhYWRxd3pqZnlkdXdwcm9iaW1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3MzgyNzIsImV4cCI6MjEwNzMxNDI3Mn0.PC9pysl9XX_cEo9BcEOau0OU3xbm6eCtQUMBGo0DE0E';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let estadoApp = {
    usuarioLogado: null,
    alunos: [],
    resumos: [],
    historico: [],
    sugestoes: [],
    desafioAtual: { titulo: "Preparem-se...", prazo: "2026-10-18", misterio: true },
    votacaoAtual: null
};

// Função para criptografar a senha em SHA-256
async function criptografarSenha(senha) {
    const encoder = new TextEncoder();
    const data = encoder.encode(senha);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function obterDataLocalString() {
    const dataLocal = new Date();
    const ano = dataLocal.getFullYear();
    const mes = String(dataLocal.getMonth() + 1).padStart(2, '0');
    const dia = String(dataLocal.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}

document.addEventListener('DOMContentLoaded', async () => {
    const elData = document.getElementById('profDataPonto');
    if (elData) elData.value = obterDataLocalString();

    await carregarDadosDoServidor();

    const usuarioSalvoId = localStorage.getItem('ebd_sessao_atual');
    if (usuarioSalvoId) {
        const usuario = estadoApp.alunos.find(a => String(a.id) === String(usuarioSalvoId));
        if (usuario) estadoApp.usuarioLogado = usuario;
    }

    atualizarTelaAuth();
});

async function carregarDadosDoServidor() {
    try {
        // Buscando da tabela 'matriculados'
        const { data: dAlunos } = await supabaseClient.from('matriculados').select('*');
        if (dAlunos) estadoApp.alunos = dAlunos;

        const { data: dHist } = await supabaseClient.from('historico').select('*');
        if (dHist) estadoApp.historico = dHist;

        const { data: dConfigs } = await supabaseClient.from('configuracoes').select('*');
        if (dConfigs) {
            const cfgDesafio = dConfigs.find(c => c.chave === 'desafio');
            if (cfgDesafio) estadoApp.desafioAtual = cfgDesafio.valor;

            const cfgVotacao = dConfigs.find(c => c.chave === 'votacao');
            if (cfgVotacao) estadoApp.votacaoAtual = cfgVotacao.valor;
        }
    } catch (err) {
        console.error("Erro ao sincronizar com o Supabase:", err);
    }
}

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

async function realizarLogin(e) {
    e.preventDefault();
    const nomeDigitado = document.getElementById('loginNome').value.trim().toLowerCase();
    const senhaDigitada = document.getElementById('loginSenha').value;
    
    await carregarDadosDoServidor(); 
    const usuario = estadoApp.alunos.find(a => a.nome.toLowerCase() === nomeDigitado);
    
    if (!usuario) {
        return alert('Usuário não encontrado! Verifique o nome digitado.');
    }

    const senhaHashDigitada = await criptografarSenha(senhaDigitada);

    if (senhaHashDigitada !== usuario.senha) {
        return alert('Senha incorreta!');
    }
    
    estadoApp.usuarioLogado = usuario;
    localStorage.setItem('ebd_sessao_atual', usuario.id);
    
    document.getElementById('loginSenha').value = ''; 
    atualizarTelaAuth();
}

async function realizarRegistro(e) {
    e.preventDefault();
    const nome = document.getElementById('regNome').value.trim();
    const nasc = document.getElementById('regNascimento').value;
    const senha = document.getElementById('regSenha').value;
    
    await carregarDadosDoServidor();

    if (estadoApp.alunos.some(a => a.nome.toLowerCase() === nome.toLowerCase())) {
        return alert('Esse nome já está cadastrado. Faça login.');
    }
    if (senha.length < 3) {
        return alert('Por favor, crie uma senha mais forte (mínimo 3 caracteres).');
    }

    const senhaHash = await criptografarSenha(senha);

    // Se a tabela estiver vazia, o primeiro usuário cadastrado vira PROFESSOR automaticamente!
    const tipoUsuario = estadoApp.alunos.length === 0 ? 'professor' : 'aluno';

    const novoUsuario = { 
        nome: nome, 
        nascimento: nasc, 
        senha: senhaHash, 
        tipo: tipoUsuario, 
        pontos: 0, 
        avatar: nome.substring(0,2).toUpperCase() 
    };

    const { data, error } = await supabaseClient.from('matriculados').insert([novoUsuario]).select();
    
    if (error) {
        alert('Erro ao registrar no servidor.');
        console.error(error);
        return;
    }

    if (data && data.length > 0) {
        estadoApp.alunos.push(data[0]);
        estadoApp.usuarioLogado = data[0];
        localStorage.setItem('ebd_sessao_atual', data[0].id);
    }
    
    document.getElementById('regSenha').value = ''; 
    atualizarTelaAuth();
}

function fazerLogout() {
    estadoApp.usuarioLogado = null;
    localStorage.removeItem('ebd_sessao_atual');
    atualizarTelaAuth();
}

async function salvarDesafioServidor() {
    await supabaseClient.from('configuracoes').upsert({
        chave: 'desafio',
        valor: estadoApp.desafioAtual
    });
}

async function salvarVotacaoServidor() {
    await supabaseClient.from('configuracoes').upsert({
        chave: 'votacao',
        valor: estadoApp.votacaoAtual
    });
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

function renderizarHistoricoAluno(id) {
    const container = document.getElementById('listaHistoricoAluno');
    const meusPontos = estadoApp.historico.filter(h => String(h.aluno_id) === String(id)).reverse();
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

async function enviarSugestao(e) {
    e.preventDefault();
    const texto = document.getElementById('inputSugestao').value;
    alert('Sugestão enviada para os professores!');
    document.getElementById('inputSugestao').value = '';
}

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

async function salvarDesafio(e) {
    e.preventDefault();
    estadoApp.desafioAtual = {
        titulo: document.getElementById('cfgDesafioTitulo').value,
        prazo: document.getElementById('cfgDesafioPrazo').value,
        misterio: document.getElementById('cfgDesafioMisterio').checked
    };
    await salvarDesafioServidor();
    alert('Desafio e Modo Mistério atualizados na nuvem!');
}

async function enviarResumo(e) {
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

    alert('Resumo enviado para validação!');
    document.getElementById('resumoTexto').value = '';
}

async function salvarVotacao(e) {
    e.preventDefault();
    estadoApp.votacaoAtual = {
        pergunta: document.getElementById('cfgVotoPergunta').value,
        opcoes: [
            { id: 1, texto: document.getElementById('cfgVotoOp1').value, votos: 0 },
            { id: 2, texto: document.getElementById('cfgVotoOp2').value, votos: 0 }
        ],
        votaram: []
    };
    await salvarVotacaoServidor();
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
    container.innerHTML = `<p class="text-xs text-slate-400">Enquete ativa na plataforma.</p>`;
}

function renderizarVotacaoProf() {
    const res = document.getElementById('resultadoVotacaoProf');
    const v = estadoApp.votacaoAtual;
    if(!v) { res.classList.add('hidden'); return; }
    
    res.classList.remove('hidden');
    res.innerHTML = `<div class="font-bold mb-2">Enquete Ativa: ${v.pergunta}</div>`;
}

function renderizarSelectProfAluno() {
    const select = document.getElementById('profAlunoSelect');
    select.innerHTML = estadoApp.alunos.filter(a => a.tipo === 'aluno').map(a => `<option value="${a.id}">${a.nome}</option>`).join('');
}

async function lancarPontos(e) {
    e.preventDefault();
    const data = document.getElementById('profDataPonto').value;
    const alunoId = document.getElementById('profAlunoSelect').value;
    const [pontosAdd, motivo] = document.getElementById('profTipoPontos').value.split('|');
    
    const aluno = estadoApp.alunos.find(a => String(a.id) === String(alunoId));
    if (!aluno) return;

    const novosPontos = (aluno.pontos || 0) + parseInt(pontosAdd);

    await supabaseClient.from('matriculados').update({ pontos: novosPontos }).eq('id', alunoId);
    
    await supabaseClient.from('historico').insert([{
        aluno_id: alunoId,
        data: data,
        motivo: motivo,
        pontos: parseInt(pontosAdd)
    }]);

    await carregarDadosDoServidor();
    renderizarRankingGeral();
    renderizarAlunosGeral();
    alert(`Lançado: +${pontosAdd} pontos para ${aluno.nome} (${motivo}).`);
}

function renderizarMuralSugestoes() {
    document.getElementById('listaSugestoesProf').innerHTML = `<p class="text-xs text-slate-500 italic">Nenhuma sugestão nova.</p>`;
}

function renderizarResumosPendentes() {
    document.getElementById('listaResumosPendentes').innerHTML = `<p class="text-xs text-slate-500 italic">Nenhum resumo pendente.</p>`;
}

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

async function excluirAluno(id) {
    if (confirm("Tem certeza que deseja excluir este jovem? Todo o histórico dele será apagado.")) {
        await supabaseClient.from('historico').delete().eq('aluno_id', id);
        await supabaseClient.from('matriculados').delete().eq('id', id);
        
        await carregarDadosDoServidor();
        atualizarTelaAuth();
        alert("Aluno excluído com sucesso.");
    }
}

function abrirModalEditarAluno(id) {
    const aluno = estadoApp.alunos.find(a => String(a.id) === String(id));
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

async function salvarEdicaoAluno(e) {
    e.preventDefault();
    const id = document.getElementById('editIdAluno').value;
    
    const dadosAtualizados = {
        nome: document.getElementById('editNome').value,
        nascimento: document.getElementById('editNascimento').value,
        pontos: parseInt(document.getElementById('editPontos').value) || 0,
        avatar: document.getElementById('editNome').value.substring(0,2).toUpperCase()
    };
    
    const novaSenha = document.getElementById('editSenha').value;
    if (novaSenha.trim() !== '') {
        dadosAtualizados.senha = await criptografarSenha(novaSenha);
    }
    
    await supabaseClient.from('matriculados').update(dadosAtualizados).eq('id', id);
    
    await carregarDadosDoServidor();
    atualizarTelaAuth();
    fecharModalEditarAluno();
    alert("Dados do aluno atualizados com sucesso no servidor!");
}