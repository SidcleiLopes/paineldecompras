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
        .from("compras")
        .insert([{ nome, preco, quantidade, data_criacao: new Date().toISOString() }]);

    if (error) {
        console.error("Erro ao adicionar item:", error);
        alert("Erro ao adicionar item.");
    } else {
        console.log("Item adicionado:", data);
        carregarHistorico();
    }

    document.getElementById("nome").value = "";
    document.getElementById("preco").value = "";
    document.getElementById("quantidade").value = "";
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

// Remover item do banco
async function removerItem(id) {
    if (!supabase) {
        console.error("Supabase ainda não foi inicializado.");
        return;
    }

    let { error } = await supabase
        .from("compras")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Erro ao remover item:", error);
        alert("Erro ao remover item.");
    } else {
        carregarHistorico();
    }
}
