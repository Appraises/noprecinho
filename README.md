# 🛒 NoPrecinho: O Waze dos Preços

> **Economize tempo e dinheiro em cada compra.**  
> *Versão Atual: 1.2.0*

![Status](https://img.shields.io/badge/Status-Em_Desenvolvimento-yellow) ![License](https://img.shields.io/badge/License-MIT-blue) ![Stack](https://img.shields.io/badge/Stack-Fullstack-green)

---

## 💡 A Ideia 

### O Problema
Você já parou para pensar quanto dinheiro perdeu comprando o mesmo produto por um preço muito maior no mercado da esquina? Ou quanto tempo gastou indo de mercado em mercado procurando as melhores ofertas? A inflação varia, os preços mudam diariamente e a falta de informação nos custa caro.

### A Solução
O **NoPrecinho** nasceu com uma missão simples: ser o **"Waze dos Preços"**.
Assim como o Waze nos guia pelo melhor caminho para fugir do trânsito, o NoPrecinho guia você pelas melhores ofertas para fugir dos preços altos. É uma plataforma colaborativa e inteligente que monitora, compara e otimiza suas compras em tempo real.

Não é apenas sobre achar o produto mais barato. É sobre achar a **Cesta de Compras ideal**, considerando o deslocamento e a disponibilidade dos itens.

---

## ✨ Funcionalidades Principais

### 🗺️ Otimização Inteligente de Rotas
Nosso algoritmo exclusivo não apenas compara preços, ele calcula a logística da sua compra:
- **Compra Única**: Qual o mercado mais barato que tem *todos* os itens da sua lista?
- **Rota Multi-Lojas**: Vale a pena ir em dois lugares? Se a economia cobrir o custo do combustível/transporte, o app sugere uma rota otimizada (ex: *Lojas Americanas -> GBarbosa*).
- **Custo de Deslocamento**: O app calcula automaticamente o custo estimado de combustível para chegar até a oferta.

### 📱 Lista de Compras Dinâmica
- Adicione itens rapidamente com busca inteligente.
- Marque itens como "comprados" enquanto passeia pelo mercado.
- **Exclusivo Mobile**: Interface adaptada com botões acessíveis e remoção rápida de itens.

### 📍 Mapa Interativo (Aracaju & Região)
- Visualize todas as lojas cadastradas no mapa.
- Pins coloridos indicam a categoria da loja (Mercado, Farmácia, Pet Shop, Posto de Combustível).
- Ao selecionar uma oferta, o mapa foca automaticamente na loja e traça a rota.

### 🤝 Colaborativo (Crowdsourcing)
- O poder está na comunidade. Usuários podem cadastrar preços e validar ofertas.
- Sistema de reputação e confiança nas informações.

---

## 🛠️ Stack Tecnológico

O projeto foi construído utilizando as tecnologias mais modernas do mercado para garantir performance e escalabilidade.

### Backend (API)
- **Node.js + Express**: Alta performance para requisições assíncronas.
- **TypeScript**: Tipagem estática para código mais seguro e manutenível.
- **Prisma ORM**: Manipulação de banco de dados moderna e intuitiva.
- **PostgreSQL**: Banco de dados relacional robusto.
- **Autenticação**: JWT (JSON Web Tokens) e Bcrypt para segurança dos dados.

### Frontend (Web App)
- **Vite**: Build tool de última geração, ultra-rápido.
- **Vanilla JavaScript (ES6+)**: Performance pura, sem overhead de frameworks pesados para a interface do mapa.
- **Leaflet.js**: Biblioteca líder para mapas interativos open-source.
- **CSS3 Moderno**: Variáveis CSS, Flexbox e Grid para responsividade total.

---

## 🚀 Como Rodar o Projeto

Siga os passos abaixo para ter o NoPrecinho rodando na sua máquina.

### Pré-requisitos
- Node.js (v18+)
- PostgreSQL (Rodando localmente ou via Docker)
- Git

### 1. Clonar o Repositório
```bash
git clone https://github.com/Appraises/noprecinho.git
cd noprecinho
```

### 2. Configurar o Backend
```bash
cd server
cp .env.example .env
# Edite o arquivo .env com suas credenciais do banco de dados (DATABASE_URL)
```

**Instalar dependências e configurar Banco de Dados:**
```bash
npm install
npm run db:push    # Cria as tabelas no banco
npm run db:seed    # Popula o banco com dados de teste (Lojas, Produtos, Preços)
```

**Iniciar o Servidor:**
```bash
npm run dev
# O servidor rodará em http://localhost:3000
```

### 3. Configurar o Frontend
Abra um novo terminal na raiz do projeto (`noprecinho/`):

```bash
npm install
npm run dev
# O frontend rodará em http://localhost:5173
```

Acesse `http://localhost:5173` e aproveite!

---

## 🧪 Dados de Teste (Seed Massivo)

Para facilitar o desenvolvimento e testes, incluímos um script de **Seed Massivo** que popula o banco de dados com:
- ~45 Lojas em Aracaju (distribuídas geograficamente).
- ~700 Produtos variados (Hortifruti, Mercearia, Farmácia, Pet, Combustível).
- Centenas de preços simulados com variações para testar o algoritmo de otimização.

Para rodar o seed novamente:
```bash
cd server
npm run db:seed
```

---

## 🔮 O Futuro (Roadmap)

- [ ] **Leitura de Notas Fiscais (OCR)**: Tirar foto da nota e cadastrar preços automaticamente.
- [ ] **Histórico de Preços**: Gráficos mostrando a evolução do preço do "Tomate" nos últimos meses.
- [ ] **Alertas de Oferta**: Ser avisado quando a "Cerveja" estiver abaixo de R$ 3,00.
- [ ] **App Nativo**: Versão React Native para iOS e Android.

---

Desenvolvido com ❤️ pelo time **NoPrecinho**. 
*Economize, Compare, Compre Melhor.*
