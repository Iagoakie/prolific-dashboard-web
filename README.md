#  Prolific Dashboard Web

Um painel web de análise temporal e estatísticas avançadas para histórico de pesquisas do **Prolific**, projetado sob a filosofia de design premium da **Apple (estilo iOS/macOS)**.

Este projeto substitui painéis tradicionais por uma interface tátil, minimalista e limpa, repleta de micro-animações responsivas e visual refinado de vidro fosco (*glassmorphic panels*).

---

## ✨ Recursos Principais

### 1. 🎨 Estética Premium Apple (iOS & macOS Sonoma)
* **Glassmorphism**: Painéis criados com efeitos de translucidez realistas usando `backdrop-filter: blur()`.
* **Cores HSL Curadas**: Paleta de cores moderna com suporte total a **Modo Claro** e **Modo Escuro** nativos.
* **Auroras Flutuantes**: Fundos animados com luzes dinâmicas que trazem profundidade física ao dashboard.
* **Micro-interações de Mola (Bouncy Spring)**: Botões, abas e cards utilizam uma física de toque amortecido com curvas bezier customizadas (`cubic-bezier(0.175, 0.885, 0.32, 1.275)`), encolhendo levemente no clique e retornando com efeito elástico.
* **Mobile-First UX**: Layout totalmente adaptativo. No celular, o menu lateral se transforma em uma **iOS Bottom Tab Bar** e a visualização de detalhes desliza de baixo para cima como uma **iOS Bottom Sheet** com puxador tátil.

### 2. 📊 Estatísticas & Análise Temporal Avançada
* **7 Cards de KPI no Painel Geral**:
  * Ganhos Totais Aprovados.
  * Faturamento de Hoje (com sumários convertidos).
  * Valor Represado (em revisão).
  * Média de Ganhos por Estudo.
  * Taxa de Aprovação global.
  * Recorde Histórico de Melhor Dia.
  * Recorde Histórico de Melhor Mês.
* **Aba de Análise Temporal Especializada**:
  * Grade de KPIs dedicados a recordes e médias temporais.
  * **Média Diária** por dia com tarefas aprovadas e **Média Mensal** por mês ativo.
  * Gráfico de Rendimento Mensal expansivo.
  * Gráfico de Atividade por Dia da Semana (Total vs Aprovado).
  * Gráfico de Estudos por Faixas Horárias (24 horas).
  * **Cruzamento Diário e Período (Stacked Bar Chart)**: Mostra em formato empilhado o volume de estudos divididos por período do dia (*Madrugada 00-06h, Manhã 06-12h, Tarde 12-18h e Noite 18-00h*) para cada dia da semana.

### 3. ⚙️ Funcionalidades Práticas
* **Importação Dual**: O dashboard lê automaticamente um arquivo de dados local (`default_data.csv`) ao carregar, e também suporta **Upload Manual via Drag-and-Drop** de novos arquivos CSV da Prolific.
* **Câmbio em Tempo Real**: Um painel de ajustes (iCloud-Style) permite calibrar as taxas de câmbio de **GBP para BRL** e **USD para BRL** com recálculo instantâneo de todo o dashboard em memória (sem recarregar a página).
* **Filtros Segmentados**: Filtre seus estudos instantaneamente por status de aprovação usando *iOS Segmented Controls*.

---

## 🛠️ Tecnologias Utilizadas

* **React (Vite)** — Estruturação de componentes e renderização ultrarrápida (HMR).
* **Recharts** — Gráficos vetoriais de alta performance totalmente estilizados para combinar com os painéis transparentes.
* **Lucide Icons** — Conjunto de ícones minimalistas de linha.
* **Vanilla CSS3** — Estilização limpa, sem dependências de frameworks como Tailwind, permitindo total controle sobre as transições de mola e efeitos de desfoque.

---

## 🚀 Como Rodar o Projeto Localmente

Certifique-se de ter o [Node.js](https://nodejs.org/) instalado em sua máquina.

1. **Clone o repositório ou baixe os arquivos**:
   ```bash
   git clone https://github.com/seu-usuario/prolific-dashboard-web.git
   cd prolific-dashboard-web
   ```

2. **Instale as dependências**:
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

4. **Acesse no navegador**:
   Abra `http://localhost:5173`.

---

## 🌐 Como Publicar no Vercel

O Vercel é a plataforma ideal para hospedar este projeto de forma rápida e gratuita:

1. Suba o código para o seu repositório do **GitHub**.
2. Conecte sua conta do GitHub ao [Vercel](https://vercel.com).
3. Importe o repositório do projeto no painel do Vercel.
4. O Vercel identificará automaticamente que se trata de um projeto **Vite**. Basta clicar em **Deploy**.
5. Em menos de 1 minuto, seu dashboard estará online com um link público seguro!
