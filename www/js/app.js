// FR Sistema - Lógica de geração de PDF
// Usa o template PDF embarcado no app e sobrepõe os campos preenchidos

let pdfDoc = null;
let pdfPage1 = null;
let pdfPage2 = null;

// Inicializar quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    // Carregar o template PDF
    carregarTemplate();
});

// Carregar o template PDF de assets
async function carregarTemplate() {
    try {
        const response = await fetch('assets/template_FR.pdf');
        const arrayBuffer = await response.arrayBuffer();
        
        // Usar pdf-lib para carregar o template
        const { PDFDocument } = PDFLib;
        pdfDoc = await PDFDocument.load(arrayBuffer);
        
        pdfPage1 = pdfDoc.getPage(0);
        pdfPage2 = pdfDoc.getPage(1);
        
        console.log('Template PDF carregado com sucesso');
    } catch (err) {
        console.error('Erro ao carregar template:', err);
        mostrarStatus('Erro ao carregar template do PDF', 'error');
    }
}

// Coordenadas do template (extraídas do PDF original)
// Formato: [x, y] em pontos PDF (y cresce para baixo no sistema do app)
const CAMPOS = {
    // Página 1
    numero:        { page: 1, x: 100, y: 140 },
    marca:         { page: 1, x: 285, y: 153 },
    tombamento:    { page: 1, x: 140, y: 153 },
    modelo:        { page: 1, x: 430, y: 153 },
    placa:         { page: 1, x: 530, y: 153 },
    condutor:      { page: 1, x: 160, y: 189 },
    cargo:         { page: 1, x: 410, y: 189 },
    unidade:       { page: 1, x: 530, y: 189 },
    
    partida_km:    { page: 1, x: 60, y: 366 },
    partida_hora:  { page: 1, x: 180, y: 366 },
    portaria:      { page: 1, x: 470, y: 338 },
    retorno_km:    { page: 1, x: 60, y: 391 },
    
    descricao:     { page: 1, x: 80, y: 232 },
    locais:        { page: 1, x: 210, y: 246 },
    
    data:          { page: 1, x: 120, y: 769 },
    assinatura:    { page: 1, x: 285, y: 783 },
    
    // Página 2
    saida_km:      { page: 2, x: 40, y: 170 },
    saida_hora:    { page: 2, x: 125, y: 166 },
    itinerario:    { page: 2, x: 275, y: 166 },
    chegada_km:    { page: 2, x: 440, y: 170 },
    chegada_hora:  { page: 2, x: 515, y: 166 },
};

// Combustível - posição do X para cada opção
const COMBUSTIVEL_POS = {
    cheio:   { page: 1, x: 258, y: 359 },
    3_4:     { page: 1, x: 262, y: 372 },
    1_2:     { page: 1, x: 262, y: 390 },
    1_4:     { page: 1, x: 262, y: 406 },
};

function gerarPDF() {
    if (!pdfDoc) {
        mostrarStatus('Template ainda não carregado. Aguarde...', 'error');
        return;
    }
    
    try {
        // Coletar dados do formulário
        const dados = {
            numero: getValor('numero'),
            marca: getValor('marca'),
            tombamento: getValor('tombamento'),
            modelo: getValor('modelo'),
            placa: getValor('placa'),
            condutor: getValor('condutor'),
            cargo: getValor('cargo'),
            unidade: getValor('unidade'),
            
            partida_km: getValor('partida_km'),
            partida_hora: getValor('partida_hora'),
            portaria: getValor('portaria'),
            retorno_km: getValor('retorno_km'),
            
            descricao: getValor('descricao'),
            locais: getValor('locais'),
            
            data: getValor('data'),
            assinatura: getValor('assinatura'),
            
            saida_km: getValor('saida_km'),
            saida_hora: getValor('saida_hora'),
            itinerario: getValor('itinerario'),
            chegada_km: getValor('chegada_km'),
            chegada_hora: getValor('chegada_hora'),
            
            combustivel: getCombustivelSelecionado(),
        };
        
        // Preencher campos de texto
        Object.keys(dados).forEach(campo => {
            if (campo === 'combustivel') return;
            const valor = dados[campo];
            if (!valor) return;
            
            const pos = CAMPOS[campo];
            if (!pos) return;
            
            const page = pos.page === 1 ? pdfPage1 : pdfPage2;
            
            // Desenhar texto no PDF
            page.drawText(valor, {
                x: pos.x,
                y: pos.y,
                size: 9,
                color: PDFLib.rgb(0, 0, 0),
            });
        });
        
        // Marcar combustível selecionado (desenhar X)
        const comb = dados.combustivel;
        if (comb && COMBUSTIVEL_POS[comb]) {
            const pos = COMBUSTIVEL_POS[comb];
            const page = pos.page === 1 ? pdfPage1 : pdfPage2;
            page.drawText('X', {
                x: pos.x,
                y: pos.y,
                size: 9,
                color: PDFLib.rgb(0, 0, 0),
            });
        }
        
        // Salvar o PDF
        pdfDoc.save().then(async (pdfBytes) => {
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            
            // Salvar no dispositivo
            salvarPDF(blob, dados);
            
            mostrarStatus('PDF gerado com sucesso!', 'success');
        });
        
    } catch (err) {
        console.error('Erro ao gerar PDF:', err);
        mostrarStatus('Erro ao gerar PDF: ' + err.message, 'error');
    }
}

function getValor(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
}

function getCombustivelSelecionado() {
    const radios = document.getElementsByName('combustivel');
    for (let r of radios) {
        if (r.checked) return r.value;
    }
    return null;
}

async function salvarPDF(blob, dados) {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const nomeArquivo = `FR_${dados.numero || 'sem_numero'}_${timestamp}.pdf`;
        
        // Converter blob para base64
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result.split(',')[1];
            const dataUrl = 'data:application/pdf;base64,' + base64;
            
            // Tentar salvar via Capacitor Filesystem (se disponível)
            if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Filesystem) {
                const { Filesystem } = window.Capacitor.Plugins;
                const dir = Filesystem.Directory ? Filesystem.Directory.Documents : 'DOCUMENTS';
                
                Filesystem.writeFile({
                    path: nomeArquivo,
                    data: base64,
                    directory: dir,
                    encoding: Filesystem.Encoding.UTF8,
                }).then(() => {
                    mostrarStatus('PDF salvo em: Documentos/' + nomeArquivo, 'success');
                }).catch((e) => {
                    console.log('Filesystem falhou, tentando download direto:', e);
                    abrirPDFNoNavegador(dataUrl, nomeArquivo);
                });
            } else {
                abrirPDFNoNavegador(dataUrl, nomeArquivo);
            }
        };
        reader.readAsDataURL(blob);
    } catch (e) {
        console.error('Erro ao salvar PDF:', e);
        mostrarStatus('Erro ao gerar PDF: ' + e.message, 'error');
    }
}

function abrirPDFNoNavegador(dataUrl, nomeArquivo) {
    try {
        // Abrir o PDF em uma nova aba/janela do WebView
        const win = window.open(dataUrl, '_blank');
        if (win) {
            mostrarStatus('PDF aberto. Use o menu para salvar/imprimir.', 'success');
        } else {
            // Se window.open for bloqueado, tentar navegar na mesma aba
            window.location.href = dataUrl;
            mostrarStatus('PDF gerado. Verifique o navegador para salvar.', 'success');
        }
    } catch (e) {
        console.error('Erro ao abrir PDF:', e);
        // Último recurso: tentar download direto
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = nomeArquivo;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        mostrarStatus('PDF gerado. Verifique a pasta Downloads.', 'success');
    }
}

function baixarPDF(blob, nomeArquivo) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomeArquivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function limparForm() {
    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        if (input.type === 'checkbox') {
            input.checked = false;
        } else {
            input.value = '';
        }
    });
    // Re-preencher data
    const hoje = new Date();
    const dia = String(hoje.getDate()).padStart(2, '0');
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const ano = hoje.getFullYear();
    document.getElementById('data').value = `${dia}/${mes}/${ano}`;
    document.getElementById('unidade').value = 'SMSUZ';
    
    mostrarStatus('Formulário limpo', 'success');
}

function mostrarStatus(msg, tipo) {
    const el = document.getElementById('status');
    el.textContent = msg;
    el.className = 'status ' + tipo;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 4000);
}

// Função auxiliar para cor RGB (usa PDFLib.rgb)
