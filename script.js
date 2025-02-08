const SUPABASE_URL = "https://iybeziyilpfsrohcbyek.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5YmV6aXlpbHBmc3JvaGNieWVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg5ODM2NDcsImV4cCI6MjA1NDU1OTY0N30.lz9FGU-lBJ8UVQzzLO_V2778MNZrHz98EL5aahuxnsE";

let supabase;
let total = 0;
let lista;
let totalSpan;

// Garantir que o Supabase seja carregado corretamente
window.addEventListener("DOMContentLoaded", () => {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    lista = document.getElementById("lista");
    totalSpan = document.getElementById("total");
    carregarListaAtual();
    carregarHistorico();
});

// Adicionar item no banco
async function adicionarItem() {
    let nome = document.getElementById("nome").value;
    let preco = parseFloat(document.getElementById("preco").value);
    let quantidade = parseInt(document.getElementById("quantidade").value);

    if (!nome || isNaN(preco) || preco <= 0 || isNaN(quantidade) || quantidade <= 0) {
        alert("Preencha corretamente os campos!");
        return;
    }

    let { data, error } = await supabase
        .from("compras_ativas")
        .insert([{ nome, preco, quantidade, data_criacao: new Date().toISOString() }]);

    if (error) {
        console.error("Erro ao adicionar item:", error);
        alert("Erro ao adicionar item.");
    } else {
        console.log("Item adicionado:", data);
        carregarListaAtual();
    }

    document.getElementById("nome").value = "";
    document.getElementById("preco").value = "";
    document.getElementById("quantidade").value = "";
}

// Carregar lista atual de compras para somar o total
async function carregarListaAtual() {
    if (!supabase) {
        console.error("Supabase ainda não foi inicializado.");
        return;
    }

    let { data, error } = await supabase
        .from("compras_ativas")
        .select("*")
        .order("data_criacao", { ascending: false });

    if (error) {
        console.error("Erro ao carregar lista atual:", error);
        alert("Erro ao carregar lista atual.");
        return;
    }

    lista.innerHTML = "";
    total = 0;

    data.forEach(item => {
        let precoTotal = item.preco * item.quantidade;
        total += precoTotal;

        let itemDiv = document.createElement("div");
        itemDiv.classList.add("item");
        itemDiv.innerHTML = `${item.nome} (x${item.quantidade}) - R$ ${precoTotal.toFixed(2)}
            <button onclick="removerItem('${item.id}')">X</button>`;
        lista.appendChild(itemDiv);
    });

    totalSpan.innerText = total.toFixed(2);
}

// Enviar lista atual para o histórico e limpar compras ativas
// Enviar lista atual para o histórico e limpar compras ativas
async function enviarParaHistorico() {
    if (!supabase) {
        console.error("Supabase ainda não foi inicializado.");
        return;
    }

    let { data, error } = await supabase
        .from("compras_ativas")
        .select("*");

    if (error || !data || data.length === 0) {
        console.error("Erro ao carregar compras ativas:", error);
        alert("Nenhuma compra para enviar ao histórico.");
        return;
    }

    // Removendo o campo "id" para evitar conflito de chave primária
    let historicoData = data.map(({ id, ...rest }) => ({ ...rest, data_criacao: new Date().toISOString() }));

    let { error: insertError } = await supabase
        .from("compras") // Movendo para compras sem id duplicado
        .insert(historicoData);

    if (insertError) {
        console.error("Erro ao mover para histórico:", insertError);
        alert("Erro ao enviar para o histórico.");
        return;
    }

    // Correção: Deleta todos os registros da tabela "compras_ativas"
    let { error: deleteError } = await supabase
        .from("compras_ativas")
        .delete()
        .gt("id", "00000000-0000-0000-0000-000000000000"); // Garante que só deleta IDs válidos

    if (deleteError) {
        console.error("Erro ao limpar compras ativas:", deleteError);
        alert("Erro ao limpar compras ativas.");
        return;
    }

    carregarListaAtual();
    carregarHistorico();
}

// Carregar histórico de compras
async function carregarHistorico() {
    if (!supabase) {
        console.error("Supabase ainda não foi inicializado.");
        return;
    }

    let { data, error } = await supabase
        .from("compras")
        .select("*")
        .order("data_criacao", { ascending: false });

    if (error) {
        console.error("Erro ao carregar histórico:", error);
        alert("Erro ao carregar histórico.");
        return;
    }

    let historicoDiv = document.getElementById("historico");
    historicoDiv.innerHTML = "<h3>Histórico de Compras</h3>";

    if (!data || data.length === 0) {
        historicoDiv.innerHTML += "<p>Nenhum histórico encontrado.</p>";
        return;
    }

    let comprasPorData = {};
    
    data.forEach(item => {
        let dataFormatada = new Date(item.data_criacao).toLocaleDateString();
        if (!comprasPorData[dataFormatada]) {
            comprasPorData[dataFormatada] = [];
        }
        comprasPorData[dataFormatada].push(item);
    });
    
    for (let data in comprasPorData) {
        historicoDiv.innerHTML += `<h4>${data}</h4>`;
        comprasPorData[data].forEach(item => {
            let precoTotal = item.preco * item.quantidade;
            historicoDiv.innerHTML += `<p>${item.nome} (x${item.quantidade}) - R$ ${precoTotal.toFixed(2)}</p>`;
        });
    }
}
