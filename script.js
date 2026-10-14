// ================= CONFIGURAÇÃO DO SUPABASE =================
const SUPABASE_URL = 'https://iaadqwzjfyduwprobimb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhYWRxd3pqZnlkdXdwcm9iaW1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3MzgyNzIsImV4cCI6MjEwNzMxNDI3Mn0.PC9pysl9XX_cEo9BcEOau0OU3xbm6eCtQUMBGo0DE0E';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Banco de Devocionais de Filipenses
const devocionais = [
    { titulo: "Alegria em meio às algemas", texto: "Mesmo preso, Paulo encontrava motivos para se alegrar e espalhar o evangelho. Hoje, escolha focar naquilo que Deus está a fazer, e não nas suas limitações ou problemas.", versiculo: "Filipenses 1:12" },
    { titulo: "O Viver é Cristo", texto: "Para Paulo, viver significava servir a Cristo, e morrer seria lucro. Qual é a sua maior motivação para acordar todos os dias? Que Jesus seja o centro de hoje.", versiculo: "Filipenses 1:21" },
    { titulo: "A Atitude de Cristo", texto: "Jesus abriu mão da sua glória para nos servir. Pratique a humildade hoje, colocando as necessidades dos outros antes das suas, sem buscar reconhecimento.", versiculo: "Filipenses 2:5-7" },
    { titulo: "Brilhando como Estrelas", texto: "Num mundo corrompido, somos chamados a brilhar através de atitudes sem murmuração. Evite reclamar hoje e seja luz onde você passar!", versiculo: "Filipenses 2:14-15" },
    { titulo: "Esquecendo o Passado", texto: "Não deixe os seus erros do passado definirem o seu futuro com Deus. Prossiga para o alvo e para a vocação celestial que Ele tem para si!", versiculo: "Filipenses 3:13-14" },
    { titulo: "A Nossa Pátria está nos Céus", texto: "A nossa verdadeira cidadania não é terrena, mas celestial. Viva o dia de hoje com os olhos fixos na eternidade e nas promessas do Senhor.", versiculo: "Filipenses 3:20" },
    { titulo: "Alegria Constante", texto: "A verdadeira alegria do cristão não depende das circunstâncias ao seu redor, mas do Senhor. Regozijai-vos sempre!", versiculo: "Filipenses 4:4" },
    { titulo: "Paz que Excede o Entendimento", texto: "Entregue as suas ansiedades e medos a Deus em oração. A paz dEle, que ninguém consegue explicar, guardará a sua mente e o seu coração.", versiculo: "Filipenses 4:6-7" },
    { titulo: "Filtre a sua Mente", texto: "Tudo o que é verdadeiro, nobre e puro... pense nisso! Filtre o que você consome nas redes sociais e alimente a sua mente com o que edifica.", versiculo: "Filipenses 4:8" },
    { titulo: "Posso todas as coisas", texto: "A nossa força não vem de nós mesmos, mas daquele que nos fortalece em qualquer situação, seja na fartura ou na escassez.", versiculo: "Filipenses 4:13" }
];

let estadoApp = {
    usuarioLogado: null,
    alunos: [],
    resumos: [],
    historico: [],
    sugestoes: [],
    motivos: [],
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

function carregarDevocionalDiario() {
    const hoje = new Date();
    const diaDoAno = Math.floor((hoje - new Date(hoje.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    const devocional = devocionais[diaDoAno % devocionais.length];
    
    const tituloEl = document.getElementById('devoTitulo');
    if(tituloEl) {
        tituloEl.textContent = devocional.titulo;
        document.getElementById('devoTexto').textContent = devocional.texto;
        document.getElementById('devoVersiculo').textContent = devocional.versiculo;
    }
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
        const { data: dAlunos } = await supabaseClient.from('matriculados').select('*');
        if (dAlunos) estadoApp.alunos = dAlunos;

        const { data: dHist } = await supabaseClient.from('historico').select('*');
        if (dHist) estadoApp.historico = dHist;

        const { data: dResumos } = await supabaseClient.from('resumos').select('*');
        if (dResumos) estadoApp.resumos = dResumos;

        const { data: dSugestoes } = await supabaseClient.from('sugestoes').select('*');
        if (dSugestoes) estadoApp.sugestoes = dSugestoes;

        const { data: dMotivos } = await supabaseClient.from('motivos_pontos').select('*');
        if (dMotivos) estadoApp.motivos = dMotivos;

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
        btnL.className = "py-2 text-xs font-bold rounded-lg transition bg-brand-600 text-white shadow";
        btnR.className = "py-2 text-xs font-bold rounded-lg transition text-slate-400 hover:text-white";
        formL.classList.remove('hidden'); formR.classList.add('hidden');
    } else {
        btnR.className = "py-2 text-xs font-bold rounded-lg transition bg-brand-600 text-white shadow";
        btnL.className = "py-2 text-xs font-bold rounded-lg transition text-slate-400 hover:text-white";
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

        carregarDevocionalDiario();
        renderizarDesafioAluno();
        renderizarVotacaoAluno();
        renderizarHistoricoAluno(u.id);
        renderizarRegrasAluno();
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
        tbody.innerHTML = `<tr><td colspan="4" class="py-4 text-center text-xs text-slate-500">Nenhum aluno cadastrado.</td></tr>`;
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
    
    container.innerHTML = meusPontos.map(h => {
        const isNegativo = h.pontos < 0;
        const corTexto = isNegativo ? 'text-red-400' : 'text-emerald-400';
        const corBg = isNegativo ? 'bg-red-500/10' : 'bg-emerald-500/10';
        const sinal = isNegativo ? '' : '+';
        
        return `
        <div class="flex justify-between items-center bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50 mb-2">
            <div>
                <p class="text-xs font-bold text-white">${h.motivo}</p>
                <p class="text-[10px] text-slate-400">${h.data.split('-').reverse().join('/')}</p>
            </div>
            <span class="text-xs font-bold ${corTexto} ${corBg} px-2 py-1 rounded"> ${sinal}${h.pontos} pt </span>
        </div>
        `;
    }).join('');
}

function renderizarRegrasAluno() {
    const container = document.getElementById('listaRegrasAluno');
    if (!container) return;
    
    if (estadoApp.motivos.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-500 italic">Nenhuma regra extra cadastrada.</p>`;
        return;
    }
    
    container.innerHTML = estadoApp.motivos.map(m => `
        <div class="flex justify-between items-center bg-slate-800 p-2.5 rounded border border-slate-700">
            <span class="text-xs text-slate-300 font-medium">${m.motivo}</span>
            <span class="text-xs font-bold text-brand-400 bg-brand-500/10 px-2 py-1 rounded">+${m.pontos} pts</span>
        </div>
    `).join('');
}

async function enviarSugestao(e) {
    e.preventDefault();
    const texto = document.getElementById('inputSugestao').value;
    const u = estadoApp.usuarioLogado;
    
    await supabaseClient.from('sugestoes').insert([{ aluno_nome: u.nome, texto: texto, data: obterDataLocalString() }]);
    alert('Sugestão enviada com sucesso!');
    document.getElementById('inputSugestao').value = '';
    await carregarDadosDoServidor();
}

function renderizarDesafioAluno() {
    const desafio = estadoApp.desafioAtual;
    const u = estadoApp.usuarioLogado;
    
    document.getElementById('alunoDesafioTitulo').textContent = desafio.titulo;
    document.getElementById('alunoDesafioPrazo').textContent = desafio.prazo ? desafio.prazo.split('-').reverse().join('/') : '--';

    const areaMisterio = document.getElementById('areaMisterio');
    const formResumo = document.getElementById('formResumoAluno');
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

    // Procura se já enviou ESTE desafio
    const resumoEnviado = estadoApp.resumos.find(r => 
        String(r.aluno_id) === String(u.id) && 
        r.texto.startsWith(`[${desafio.titulo}]`)
    );

    msgPrazo.className = "hidden mt-3 p-3 border rounded-xl text-xs font-bold text-center";

    // 1. Já enviou? Bloqueia.
    if (resumoEnviado) {
        textarea.disabled = true;
        textarea.value = "";
        textarea.classList.add('opacity-40', 'cursor-not-allowed');
        btnEnviar.classList.add('hidden');
        msgPrazo.classList.remove('hidden');

        if (resumoEnviado.status === 'aprovado') {
            textarea.placeholder = "✅ Desafio aprovado!";
            msgPrazo.classList.add('bg-emerald-500/10', 'border-emerald-500/30', 'text-emerald-400');
            msgPrazo.innerHTML = '<i class="fa-solid fa-check-circle mr-1"></i> Desafio avaliado e aprovado! (+5 XP)';
            
        } else if (resumoEnviado.status === 'recusado') {
            textarea.placeholder = "❌ Desafio recusado.";
            msgPrazo.classList.add('bg-red-500/10', 'border-red-500/30', 'text-red-400');
            msgPrazo.innerHTML = '<i class="fa-solid fa-circle-xmark mr-1"></i> O seu desafio foi recusado pelo professor e não pontuou.';
            
        } else {
            textarea.placeholder = "⏳ Aguardando avaliação...";
            msgPrazo.classList.add('bg-amber-500/10', 'border-amber-500/30', 'text-amber-400');
            msgPrazo.innerHTML = '<i class="fa-solid fa-clock-rotate-left mr-1"></i> Desafio enviado! Aguardando o professor avaliar.';
        }
        
    // 2. Prazo passou? Bloqueia.
    } else if (hoje > desafio.prazo) {
        textarea.disabled = true;
        textarea.value = "";
        textarea.placeholder = "Envio encerrado. Aguarde o próximo desafio.";
        textarea.classList.add('opacity-40', 'cursor-not-allowed');
        
        btnEnviar.classList.add('hidden');
        msgPrazo.classList.remove('hidden');
        msgPrazo.classList.add('bg-red-500/10', 'border-red-500/20', 'text-red-400');
        msgPrazo.innerHTML = '<i class="fa-solid fa-lock mr-1"></i> O prazo para envio deste desafio já encerrou.';
        
    // 3. Tudo OK? Libera campo.
    } else {
        textarea.disabled = false;
        textarea.value = "";
        textarea.placeholder = "Escreva sua resposta aqui...";
        textarea.classList.remove('opacity-40', 'cursor-not-allowed');
        
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
    if (estadoApp.desafioAtual.misterio) return alert("Modo Mistério ativado. Envio bloqueado.");
    const hoje = obterDataLocalString();
    if (hoje > estadoApp.desafioAtual.prazo) return alert("Erro: O prazo para este desafio já foi encerrado.");

    const textoDigitado = document.getElementById('resumoTexto').value;
    const u = estadoApp.usuarioLogado;
    
    // Anexa o título do desafio no topo para que possamos rastrear
    const textoFinal = `[${estadoApp.desafioAtual.titulo}]\n\n${textoDigitado}`;
    
    await supabaseClient.from('resumos').insert([{
        aluno_id: u.id, 
        aluno_nome: u.nome, 
        texto: textoFinal, 
        data: obterDataLocalString(), 
        status: 'pendente'
    }]);

    document.getElementById('resumoTexto').value = '';
    await carregarDadosDoServidor();
    atualizarTelaAuth();
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
    const container = document.getElementById('opcoesVotacao');
    const v = estadoApp.votacaoAtual;
    const u = estadoApp.usuarioLogado;
    
    if(!v || !v.pergunta) return document.getElementById('areaVotacaoAluno').classList.add('hidden');
    document.getElementById('areaVotacaoAluno').classList.remove('hidden');
    document.getElementById('votacaoPergunta').textContent = v.pergunta;
    
    if (v.votaram && v.votaram.includes(u.id)) {
        container.innerHTML = `<p class="text-xs text-emerald-400 font-bold mt-2"><i class="fa-solid fa-check"></i> Você já votou nesta enquete!</p>`;
    } else {
        container.innerHTML = v.opcoes.map(op => `
            <button onclick="registrarVoto(${op.id})" class="w-full bg-slate-800 border border-slate-700 hover:border-brand-500 hover:bg-slate-700 text-white text-xs font-bold py-2.5 rounded-xl shadow transition">
                ${op.texto}
            </button>
        `).join('');
    }
}

async function registrarVoto(opcaoId) {
    const v = estadoApp.votacaoAtual;
    if (!v.votaram) v.votaram = [];
    v.votaram.push(estadoApp.usuarioLogado.id); 
    
    const opcao = v.opcoes.find(o => o.id === opcaoId);
    if (opcao) opcao.votos += 1; 
    
    await salvarVotacaoServidor();
    await carregarDadosDoServidor();
    renderizarVotacaoAluno();
}

function renderizarVotacaoProf() {
    const res = document.getElementById('resultadoVotacaoProf');
    const v = estadoApp.votacaoAtual;
    if(!v || !v.pergunta) return res.classList.add('hidden');
    
    res.classList.remove('hidden');
    const total = v.votaram ? v.votaram.length : 0;
    
    res.innerHTML = `
        <div class="font-bold mb-3 text-brand-400 text-sm">Enquete: <span class="text-white">${v.pergunta}</span> <span class="text-xs text-slate-400">(${total} votos)</span></div>
        ${v.opcoes.map(op => `
            <div class="flex justify-between text-xs text-slate-300 bg-slate-800 p-2 rounded mb-1">
                <span>${op.texto}</span> <strong class="text-brand-400">${op.votos} votos</strong>
            </div>
        `).join('')}
    `;
}

function renderizarSelectProfAluno() {
    const selectAluno = document.getElementById('profAlunoSelect');
    if (selectAluno) selectAluno.innerHTML = estadoApp.alunos.filter(a => a.tipo === 'aluno').map(a => `<option value="${a.id}">${a.nome}</option>`).join('');

    const selectPontos = document.getElementById('profTipoPontos');
    if (selectPontos) {
        selectPontos.innerHTML = estadoApp.motivos.map(m => `<option value="${m.pontos}|${m.motivo}">${m.motivo} (+${m.pontos} pts)</option>`).join('');
    }
}

async function cadastrarMotivoPonto(e) {
    if(e) e.preventDefault();
    const motivo = document.getElementById('novoMotivoNome').value;
    const pontos = parseInt(document.getElementById('novoMotivoPontos').value);
    
    if (!motivo || isNaN(pontos)) return alert('Preencha o nome do motivo e os pontos!');
    
    await supabaseClient.from('motivos_pontos').insert([{ motivo, pontos }]);
    document.getElementById('novoMotivoNome').value = '';
    document.getElementById('novoMotivoPontos').value = '';
    
    await carregarDadosDoServidor();
    renderizarSelectProfAluno();
    alert('Regra criada com sucesso! Já pode usá-la.');
}

async function lancarPontos(e) {
    e.preventDefault();
    const data = document.getElementById('profDataPonto').value;
    const alunoId = document.getElementById('profAlunoSelect').value;
    const selectValue = document.getElementById('profTipoPontos').value;
    
    if (!selectValue || !alunoId) return alert('Selecione um aluno e uma regra.');
    
    const [pontosAdd, motivo] = selectValue.split('|');
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
    const container = document.getElementById('listaSugestoesProf');
    if (estadoApp.sugestoes.length === 0) return container.innerHTML = `<p class="text-xs text-slate-500 italic">Nenhuma sugestão.</p>`;
    
    container.innerHTML = estadoApp.sugestoes.slice().reverse().map(s => `
        <div class="bg-slate-800 p-3 rounded-xl mb-2 border border-slate-700">
            <span class="text-brand-400 text-xs font-bold">${s.aluno_nome}</span> <span class="text-[10px] text-slate-400">${s.data.split('-').reverse().join('/')}</span>
            <p class="text-xs text-slate-300 mt-1">${s.texto}</p>
        </div>
    `).join('');
}

function renderizarResumosPendentes() {
    const container = document.getElementById('listaResumosPendentes');
    const pendentes = estadoApp.resumos.filter(r => r.status === 'pendente');
    
    if (pendentes.length === 0) return container.innerHTML = `<p class="text-xs text-slate-500 italic">Nenhum desafio pendente de avaliação.</p>`;

    container.innerHTML = pendentes.map(r => {
        let tituloDesafio = "Desafio";
        let textoAluno = r.texto;
        
        // Separa o título (dentro dos colchetes) do texto principal
        if (r.texto.startsWith('[')) {
            const fimTitulo = r.texto.indexOf(']');
            if (fimTitulo !== -1) {
                tituloDesafio = r.texto.substring(1, fimTitulo);
                textoAluno = r.texto.substring(fimTitulo + 1).trim();
            }
        }

        return `
        <div class="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow">
            <div class="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-3">
                <p class="font-bold text-white text-sm flex items-center gap-2">
                    <i class="fa-solid fa-user text-brand-400"></i> ${r.aluno_nome}
                </p>
                <span class="text-[10px] bg-brand-500/20 border border-brand-500/30 text-brand-400 px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider truncate max-w-[200px]" title="${tituloDesafio}">
                    ${tituloDesafio}
                </span>
            </div>
            
            <div class="text-xs text-slate-200 mb-4 bg-slate-900 p-4 rounded-xl border border-slate-800 leading-relaxed">
                ${textoAluno.replace(/\n/g, '<br>')}
            </div>
            
            <div class="flex gap-2 justify-end">
                <button onclick="rejeitarResumo('${r.id}')" class="bg-slate-700 hover:bg-red-500/20 text-slate-300 hover:text-red-400 border border-transparent hover:border-red-500/30 text-xs px-4 py-2 rounded-xl font-bold transition">Recusar</button>
                <button onclick="aprovarResumo('${r.id}', '${r.aluno_id}')" class="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 text-xs px-4 py-2 rounded-xl font-bold transition"><i class="fa-solid fa-check mr-1"></i> Aprovar Desafio</button>
            </div>
        </div>
        `;
    }).join('');
}

async function aprovarResumo(resumo_id, aluno_id) {
    await supabaseClient.from('resumos').update({ status: 'aprovado' }).eq('id', resumo_id);
    
    const pontosAdd = 5;
    const aluno = estadoApp.alunos.find(a => String(a.id) === String(aluno_id));
    
    if (aluno) {
        const novosPontos = (aluno.pontos || 0) + pontosAdd;
        await supabaseClient.from('matriculados').update({ pontos: novosPontos }).eq('id', aluno_id);
        await supabaseClient.from('historico').insert([{ 
            aluno_id: aluno_id, 
            data: obterDataLocalString(), 
            motivo: 'Desafio Concluído', 
            pontos: pontosAdd 
        }]);
    }
    
    await carregarDadosDoServidor();
    atualizarTelaAuth();
    alert(`Desafio aprovado com sucesso! O aluno ganhou +5 pontos.`);
}

// Em vez de APAGAR do banco, agora a função apenas atualiza para RECUSADO
async function rejeitarResumo(resumo_id) {
    if(confirm("Deseja recusar este desafio? O aluno não ganhará os pontos e não poderá reenviar.")) {
        await supabaseClient.from('resumos').update({ status: 'recusado' }).eq('id', resumo_id);
        await carregarDadosDoServidor();
        atualizarTelaAuth();
    }
}

function renderizarAlunosGeral() {
    const container = document.getElementById('listaAlunosGeral');
    const apenasAlunos = estadoApp.alunos.filter(a => a.tipo === 'aluno');

    if (apenasAlunos.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-500 italic">Nenhum jovem matriculado.</p>`;
        return;
    }

    container.innerHTML = apenasAlunos.map(a => `
        <div class="bg-slate-800 border border-slate-700 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
        await supabaseClient.from('resumos').delete().eq('aluno_id', id);
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
    const novoPontos = parseInt(document.getElementById('editPontos').value) || 0;
    
    const alunoAnterior = estadoApp.alunos.find(a => String(a.id) === String(id));
    const pontosAntigos = alunoAnterior ? (alunoAnterior.pontos || 0) : 0;
    const diferenca = novoPontos - pontosAntigos;

    const dadosAtualizados = {
        nome: document.getElementById('editNome').value,
        nascimento: document.getElementById('editNascimento').value,
        pontos: novoPontos,
        avatar: document.getElementById('editNome').value.substring(0,2).toUpperCase()
    };
    
    const novaSenha = document.getElementById('editSenha').value;
    if (novaSenha.trim() !== '') {
        dadosAtualizados.senha = await criptografarSenha(novaSenha);
    }
    
    await supabaseClient.from('matriculados').update(dadosAtualizados).eq('id', id);
    
    if (diferenca !== 0) {
        const motivoAjuste = diferenca > 0 ? 'Ajuste Manual (Bônus)' : 'Ajuste Manual (Correção)';
        await supabaseClient.from('historico').insert([{
            aluno_id: id,
            data: obterDataLocalString(),
            motivo: motivoAjuste,
            pontos: diferenca 
        }]);
    }
    
    await carregarDadosDoServidor();
    atualizarTelaAuth();
    fecharModalEditarAluno();
    alert("Dados atualizados! O extrato do aluno foi corrigido automaticamente.");
}