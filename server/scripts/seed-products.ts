import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed script for retail market products
 * Run with: npx tsx scripts/seed-products.ts
 */

const products = [
    // ============ ALIMENTOS BÁSICOS ============
    { name: 'Arroz Branco 5kg', category: 'mercado', unit: 'pct', brand: 'Tio João', aliases: ['arroz', 'arroz tipo 1', 'arroz branco'] },
    { name: 'Arroz Integral 1kg', category: 'mercado', unit: 'pct', brand: 'Camil', aliases: ['arroz integral'] },
    { name: 'Arroz Parboilizado 5kg', category: 'mercado', unit: 'pct', brand: 'Camil', aliases: ['arroz parboilizado'] },
    { name: 'Feijão Carioca 1kg', category: 'mercado', unit: 'pct', brand: 'Camil', aliases: ['feijão', 'feijão carioca'] },
    { name: 'Feijão Preto 1kg', category: 'mercado', unit: 'pct', brand: 'Kicaldo', aliases: ['feijão preto'] },
    { name: 'Feijão Fradinho 1kg', category: 'mercado', unit: 'pct', brand: 'Camil', aliases: ['feijão fradinho', 'feijão de corda'] },
    { name: 'Açúcar Cristal 1kg', category: 'mercado', unit: 'pct', brand: 'União', aliases: ['açúcar', 'açúcar cristal'] },
    { name: 'Açúcar Refinado 1kg', category: 'mercado', unit: 'pct', brand: 'União', aliases: ['açúcar refinado'] },
    { name: 'Açúcar Demerara 1kg', category: 'mercado', unit: 'pct', brand: 'Native', aliases: ['açúcar demerara', 'açúcar mascavo'] },
    { name: 'Sal Refinado 1kg', category: 'mercado', unit: 'pct', brand: 'Cisne', aliases: ['sal', 'sal de cozinha'] },
    { name: 'Farinha de Trigo 1kg', category: 'mercado', unit: 'pct', brand: 'Dona Benta', aliases: ['farinha', 'farinha de trigo'] },
    { name: 'Farinha de Mandioca 500g', category: 'mercado', unit: 'pct', brand: 'Yoki', aliases: ['farinha de mandioca', 'farofa'] },
    { name: 'Fubá 500g', category: 'mercado', unit: 'pct', brand: 'Yoki', aliases: ['fubá', 'fubá mimoso'] },
    { name: 'Macarrão Espaguete 500g', category: 'mercado', unit: 'pct', brand: 'Barilla', aliases: ['macarrão', 'espaguete', 'massa'] },
    { name: 'Macarrão Parafuso 500g', category: 'mercado', unit: 'pct', brand: 'Adria', aliases: ['macarrão parafuso', 'fusilli'] },
    { name: 'Macarrão Penne 500g', category: 'mercado', unit: 'pct', brand: 'Barilla', aliases: ['penne', 'macarrão penne'] },
    { name: 'Macarrão Instantâneo', category: 'mercado', unit: 'un', brand: 'Nissin', aliases: ['miojo', 'lámen', 'macarrão instantâneo'] },

    // ============ ÓLEOS E GORDURAS ============
    { name: 'Óleo de Soja 900ml', category: 'mercado', unit: 'un', brand: 'Soya', aliases: ['óleo', 'óleo de soja', 'óleo de cozinha'] },
    { name: 'Óleo de Canola 900ml', category: 'mercado', unit: 'un', brand: 'Liza', aliases: ['óleo canola'] },
    { name: 'Azeite de Oliva 500ml', category: 'mercado', unit: 'un', brand: 'Gallo', aliases: ['azeite', 'azeite de oliva'] },
    { name: 'Azeite Extra Virgem 500ml', category: 'mercado', unit: 'un', brand: 'Andorinha', aliases: ['azeite extra virgem'] },
    { name: 'Manteiga com Sal 200g', category: 'mercado', unit: 'un', brand: 'Aviação', aliases: ['manteiga', 'manteiga com sal'] },
    { name: 'Manteiga sem Sal 200g', category: 'mercado', unit: 'un', brand: 'Qualy', aliases: ['manteiga sem sal'] },
    { name: 'Margarina 500g', category: 'mercado', unit: 'un', brand: 'Qualy', aliases: ['margarina'] },

    // ============ LATICÍNIOS ============
    { name: 'Leite Integral 1L', category: 'mercado', unit: 'un', brand: 'Parmalat', aliases: ['leite', 'leite integral'] },
    { name: 'Leite Desnatado 1L', category: 'mercado', unit: 'un', brand: 'Itambé', aliases: ['leite desnatado'] },
    { name: 'Leite Semidesnatado 1L', category: 'mercado', unit: 'un', brand: 'Piracanjuba', aliases: ['leite semidesnatado'] },
    { name: 'Leite em Pó 400g', category: 'mercado', unit: 'un', brand: 'Ninho', aliases: ['leite em pó', 'leite ninho'] },
    { name: 'Leite Condensado 395g', category: 'mercado', unit: 'un', brand: 'Moça', aliases: ['leite condensado', 'leite moça'] },
    { name: 'Creme de Leite 200g', category: 'mercado', unit: 'un', brand: 'Nestlé', aliases: ['creme de leite'] },
    { name: 'Queijo Mussarela 500g', category: 'mercado', unit: 'kg', brand: 'Tirolez', aliases: ['mussarela', 'queijo mussarela'] },
    { name: 'Queijo Prato 500g', category: 'mercado', unit: 'kg', brand: 'Tirolez', aliases: ['queijo prato'] },
    { name: 'Queijo Minas Frescal 500g', category: 'mercado', unit: 'un', brand: 'Tirolez', aliases: ['queijo minas', 'queijo minas frescal'] },
    { name: 'Requeijão Cremoso 200g', category: 'mercado', unit: 'un', brand: 'Catupiry', aliases: ['requeijão', 'catupiry'] },
    { name: 'Iogurte Natural 170g', category: 'mercado', unit: 'un', brand: 'Nestlé', aliases: ['iogurte', 'iogurte natural'] },
    { name: 'Iogurte Morango 170g', category: 'mercado', unit: 'un', brand: 'Danone', aliases: ['iogurte morango'] },
    { name: 'Bebida Láctea 1L', category: 'mercado', unit: 'un', brand: 'Batavo', aliases: ['bebida láctea'] },

    // ============ CARNES E PROTEÍNAS ============
    { name: 'Frango Inteiro Congelado', category: 'mercado', unit: 'kg', brand: 'Sadia', aliases: ['frango', 'frango inteiro', 'frango congelado'] },
    { name: 'Peito de Frango', category: 'mercado', unit: 'kg', brand: 'Perdigão', aliases: ['peito de frango', 'filé de frango'] },
    { name: 'Coxa e Sobrecoxa de Frango', category: 'mercado', unit: 'kg', brand: 'Sadia', aliases: ['coxa de frango', 'sobrecoxa'] },
    { name: 'Carne Moída Patinho', category: 'mercado', unit: 'kg', brand: null, aliases: ['carne moída', 'patinho moído'] },
    { name: 'Carne de Primeira (Alcatra)', category: 'mercado', unit: 'kg', brand: null, aliases: ['alcatra', 'carne de primeira'] },
    { name: 'Carne de Segunda (Acém)', category: 'mercado', unit: 'kg', brand: null, aliases: ['acém', 'carne de segunda'] },
    { name: 'Picanha', category: 'mercado', unit: 'kg', brand: null, aliases: ['picanha', 'carne para churrasco'] },
    { name: 'Costela Bovina', category: 'mercado', unit: 'kg', brand: null, aliases: ['costela', 'costela bovina'] },
    { name: 'Linguiça Calabresa 500g', category: 'mercado', unit: 'un', brand: 'Seara', aliases: ['linguiça calabresa', 'calabresa'] },
    { name: 'Linguiça Toscana 500g', category: 'mercado', unit: 'un', brand: 'Perdigão', aliases: ['linguiça toscana'] },
    { name: 'Salsicha 500g', category: 'mercado', unit: 'un', brand: 'Sadia', aliases: ['salsicha', 'hot dog'] },
    { name: 'Presunto 200g', category: 'mercado', unit: 'un', brand: 'Sadia', aliases: ['presunto', 'presunto fatiado'] },
    { name: 'Mortadela 200g', category: 'mercado', unit: 'un', brand: 'Seara', aliases: ['mortadela'] },
    { name: 'Bacon 250g', category: 'mercado', unit: 'un', brand: 'Perdigão', aliases: ['bacon'] },
    { name: 'Ovos Brancos 12un', category: 'mercado', unit: 'dz', brand: 'Mantiqueira', aliases: ['ovos', 'ovo', 'dúzia de ovos'] },
    { name: 'Ovos Caipira 10un', category: 'mercado', unit: 'cx', brand: 'Happy Eggs', aliases: ['ovos caipira', 'ovo caipira'] },

    // ============ ENLATADOS E CONSERVAS ============
    { name: 'Atum em Lata 170g', category: 'mercado', unit: 'un', brand: 'Gomes da Costa', aliases: ['atum', 'atum enlatado'] },
    { name: 'Sardinha em Lata 125g', category: 'mercado', unit: 'un', brand: 'Coqueiro', aliases: ['sardinha', 'sardinha enlatada'] },
    { name: 'Molho de Tomate 340g', category: 'mercado', unit: 'un', brand: 'Heinz', aliases: ['molho de tomate', 'extrato de tomate'] },
    { name: 'Extrato de Tomate 350g', category: 'mercado', unit: 'un', brand: 'Elefante', aliases: ['extrato de tomate'] },
    { name: 'Milho Verde em Lata 200g', category: 'mercado', unit: 'un', brand: 'Quero', aliases: ['milho verde', 'milho em lata'] },
    { name: 'Ervilha em Lata 200g', category: 'mercado', unit: 'un', brand: 'Goiás Verde', aliases: ['ervilha', 'ervilha em lata'] },
    { name: 'Palmito 300g', category: 'mercado', unit: 'un', brand: 'Hemmer', aliases: ['palmito'] },
    { name: 'Azeitona Verde 200g', category: 'mercado', unit: 'un', brand: 'Gallo', aliases: ['azeitona', 'azeitona verde'] },
    { name: 'Seleta de Legumes 200g', category: 'mercado', unit: 'un', brand: 'Quero', aliases: ['seleta', 'legumes em lata'] },

    // ============ BEBIDAS ============
    { name: 'Água Mineral 500ml', category: 'mercado', unit: 'un', brand: 'Crystal', aliases: ['água', 'água mineral'] },
    { name: 'Água Mineral 1,5L', category: 'mercado', unit: 'un', brand: 'Crystal', aliases: ['água 1,5', 'garrafa de água'] },
    { name: 'Refrigerante Cola 2L', category: 'mercado', unit: 'un', brand: 'Coca-Cola', aliases: ['coca-cola', 'coca', 'refrigerante'] },
    { name: 'Refrigerante Guaraná 2L', category: 'mercado', unit: 'un', brand: 'Antarctica', aliases: ['guaraná', 'guaraná antarctica'] },
    { name: 'Refrigerante Laranja 2L', category: 'mercado', unit: 'un', brand: 'Fanta', aliases: ['fanta', 'fanta laranja'] },
    { name: 'Suco de Laranja 1L', category: 'mercado', unit: 'un', brand: 'Del Valle', aliases: ['suco de laranja', 'suco'] },
    { name: 'Suco de Uva 1L', category: 'mercado', unit: 'un', brand: 'Aurora', aliases: ['suco de uva'] },
    { name: 'Cerveja Lata 350ml', category: 'mercado', unit: 'un', brand: 'Brahma', aliases: ['cerveja', 'cerveja lata'] },
    { name: 'Cerveja Long Neck 355ml', category: 'mercado', unit: 'un', brand: 'Heineken', aliases: ['heineken', 'cerveja long neck'] },
    { name: 'Vinho Tinto 750ml', category: 'mercado', unit: 'un', brand: 'Concha y Toro', aliases: ['vinho', 'vinho tinto'] },
    { name: 'Café em Pó 500g', category: 'mercado', unit: 'un', brand: 'Pilão', aliases: ['café', 'café em pó', 'café torrado'] },
    { name: 'Café Solúvel 100g', category: 'mercado', unit: 'un', brand: 'Nescafé', aliases: ['nescafé', 'café solúvel'] },
    { name: 'Chá Mate 1L', category: 'mercado', unit: 'un', brand: 'Matte Leão', aliases: ['chá mate', 'mate'] },
    { name: 'Achocolatado em Pó 400g', category: 'mercado', unit: 'un', brand: 'Nescau', aliases: ['nescau', 'achocolatado', 'toddy'] },

    // ============ PÃO E PADARIA ============
    { name: 'Pão de Forma 500g', category: 'mercado', unit: 'un', brand: 'Pullman', aliases: ['pão de forma', 'pão'] },
    { name: 'Pão Francês', category: 'mercado', unit: 'kg', brand: null, aliases: ['pão francês', 'pãozinho'] },
    { name: 'Bisnaguinha 300g', category: 'mercado', unit: 'un', brand: 'Pullman', aliases: ['bisnaguinha', 'bisnaga'] },
    { name: 'Torrada 160g', category: 'mercado', unit: 'un', brand: 'Bauducco', aliases: ['torrada', 'torrada bauducco'] },
    { name: 'Bolacha Maisena 200g', category: 'mercado', unit: 'un', brand: 'Marilan', aliases: ['bolacha maisena', 'biscoito maisena'] },
    { name: 'Bolacha Recheada 130g', category: 'mercado', unit: 'un', brand: 'Oreo', aliases: ['oreo', 'bolacha recheada'] },
    { name: 'Biscoito Água e Sal 200g', category: 'mercado', unit: 'un', brand: 'Piraquê', aliases: ['biscoito água e sal', 'biscoito salgado'] },
    { name: 'Biscoito Cream Cracker 400g', category: 'mercado', unit: 'un', brand: 'Nestlé', aliases: ['cream cracker'] },

    // ============ CEREAIS E MATINAIS ============
    { name: 'Cereal Sucrilhos 300g', category: 'mercado', unit: 'un', brand: 'Kellogg\'s', aliases: ['sucrilhos', 'cereal'] },
    { name: 'Granola 800g', category: 'mercado', unit: 'un', brand: 'Jasmine', aliases: ['granola'] },
    { name: 'Aveia em Flocos 200g', category: 'mercado', unit: 'un', brand: 'Quaker', aliases: ['aveia', 'aveia em flocos'] },
    { name: 'Barra de Cereal 66g', category: 'mercado', unit: 'un', brand: 'Nutry', aliases: ['barra de cereal'] },

    // ============ TEMPEROS E CONDIMENTOS ============
    { name: 'Ketchup 400g', category: 'mercado', unit: 'un', brand: 'Heinz', aliases: ['ketchup', 'catchup'] },
    { name: 'Mostarda 200g', category: 'mercado', unit: 'un', brand: 'Heinz', aliases: ['mostarda'] },
    { name: 'Maionese 500g', category: 'mercado', unit: 'un', brand: 'Hellmann\'s', aliases: ['maionese'] },
    { name: 'Vinagre 750ml', category: 'mercado', unit: 'un', brand: 'Castelo', aliases: ['vinagre'] },
    { name: 'Shoyu 150ml', category: 'mercado', unit: 'un', brand: 'Sakura', aliases: ['shoyu', 'molho de soja'] },
    { name: 'Pimenta do Reino 30g', category: 'mercado', unit: 'un', brand: 'Kitano', aliases: ['pimenta', 'pimenta do reino'] },
    { name: 'Orégano 10g', category: 'mercado', unit: 'un', brand: 'Kitano', aliases: ['orégano'] },
    { name: 'Cominho 30g', category: 'mercado', unit: 'un', brand: 'Kitano', aliases: ['cominho'] },
    { name: 'Colorau 80g', category: 'mercado', unit: 'un', brand: 'Kitano', aliases: ['colorau', 'colorífico'] },
    { name: 'Tempero Completo 300g', category: 'mercado', unit: 'un', brand: 'Arisco', aliases: ['tempero', 'tempero completo', 'sazon'] },
    { name: 'Caldo de Galinha 57g', category: 'mercado', unit: 'un', brand: 'Knorr', aliases: ['caldo de galinha', 'caldo knorr'] },
    { name: 'Alho Picado 200g', category: 'mercado', unit: 'un', brand: 'Arisco', aliases: ['alho', 'alho picado'] },

    // ============ HIGIENE PESSOAL ============
    { name: 'Sabonete 90g', category: 'mercado', unit: 'un', brand: 'Dove', aliases: ['sabonete', 'sabonete dove'] },
    { name: 'Shampoo 400ml', category: 'mercado', unit: 'un', brand: 'Pantene', aliases: ['shampoo'] },
    { name: 'Condicionador 400ml', category: 'mercado', unit: 'un', brand: 'Pantene', aliases: ['condicionador'] },
    { name: 'Creme Dental 90g', category: 'mercado', unit: 'un', brand: 'Colgate', aliases: ['creme dental', 'pasta de dente'] },
    { name: 'Escova de Dente', category: 'mercado', unit: 'un', brand: 'Oral-B', aliases: ['escova de dente'] },
    { name: 'Desodorante Roll-on 50ml', category: 'mercado', unit: 'un', brand: 'Rexona', aliases: ['desodorante', 'desodorante roll-on'] },
    { name: 'Papel Higiênico 12un', category: 'mercado', unit: 'pct', brand: 'Neve', aliases: ['papel higiênico', 'papel higienico'] },
    { name: 'Absorvente Noturno 8un', category: 'mercado', unit: 'pct', brand: 'Always', aliases: ['absorvente', 'absorvente noturno'] },
    { name: 'Fralda Descartável M 40un', category: 'mercado', unit: 'pct', brand: 'Pampers', aliases: ['fralda', 'fralda descartável'] },

    // ============ LIMPEZA ============
    { name: 'Detergente 500ml', category: 'mercado', unit: 'un', brand: 'Ypê', aliases: ['detergente', 'detergente de louça'] },
    { name: 'Sabão em Pó 1kg', category: 'mercado', unit: 'un', brand: 'Omo', aliases: ['sabão em pó', 'omo'] },
    { name: 'Sabão em Barra 5un', category: 'mercado', unit: 'pct', brand: 'Ypê', aliases: ['sabão em barra'] },
    { name: 'Amaciante 2L', category: 'mercado', unit: 'un', brand: 'Comfort', aliases: ['amaciante'] },
    { name: 'Água Sanitária 2L', category: 'mercado', unit: 'un', brand: 'Qboa', aliases: ['água sanitária', 'qboa'] },
    { name: 'Desinfetante 2L', category: 'mercado', unit: 'un', brand: 'Pinho Sol', aliases: ['desinfetante', 'pinho sol'] },
    { name: 'Limpador Multiuso 500ml', category: 'mercado', unit: 'un', brand: 'Veja', aliases: ['multiuso', 'veja'] },
    { name: 'Esponja de Aço 8un', category: 'mercado', unit: 'pct', brand: 'Bombril', aliases: ['bombril', 'esponja de aço', 'palha de aço'] },
    { name: 'Esponja de Louça 3un', category: 'mercado', unit: 'pct', brand: 'Scotch-Brite', aliases: ['esponja', 'esponja de louça'] },
    { name: 'Saco de Lixo 50L 20un', category: 'mercado', unit: 'pct', brand: 'Dover Roll', aliases: ['saco de lixo'] },
    { name: 'Papel Toalha 2un', category: 'mercado', unit: 'pct', brand: 'Snob', aliases: ['papel toalha'] },

    // ============ HORTIFRUTI ============
    { name: 'Banana Prata', category: 'hortifruti', unit: 'kg', brand: null, aliases: ['banana', 'banana prata'] },
    { name: 'Maçã Fuji', category: 'hortifruti', unit: 'kg', brand: null, aliases: ['maçã', 'maçã fuji'] },
    { name: 'Laranja Pêra', category: 'hortifruti', unit: 'kg', brand: null, aliases: ['laranja', 'laranja pêra'] },
    { name: 'Limão Tahiti', category: 'hortifruti', unit: 'kg', brand: null, aliases: ['limão', 'limão tahiti'] },
    { name: 'Mamão Papaya', category: 'hortifruti', unit: 'un', brand: null, aliases: ['mamão', 'mamão papaya'] },
    { name: 'Melancia', category: 'hortifruti', unit: 'kg', brand: null, aliases: ['melancia'] },
    { name: 'Uva Itália', category: 'hortifruti', unit: 'kg', brand: null, aliases: ['uva', 'uva itália'] },
    { name: 'Manga Palmer', category: 'hortifruti', unit: 'kg', brand: null, aliases: ['manga', 'manga palmer'] },
    { name: 'Abacaxi', category: 'hortifruti', unit: 'un', brand: null, aliases: ['abacaxi'] },
    { name: 'Morango 300g', category: 'hortifruti', unit: 'cx', brand: null, aliases: ['morango'] },
    { name: 'Tomate', category: 'hortifruti', unit: 'kg', brand: null, aliases: ['tomate', 'tomate salada'] },
    { name: 'Cebola', category: 'hortifruti', unit: 'kg', brand: null, aliases: ['cebola'] },
    { name: 'Alho Cabeça', category: 'hortifruti', unit: 'un', brand: null, aliases: ['alho cabeça', 'cabeça de alho'] },
    { name: 'Batata Inglesa', category: 'hortifruti', unit: 'kg', brand: null, aliases: ['batata', 'batata inglesa'] },
    { name: 'Batata Doce', category: 'hortifruti', unit: 'kg', brand: null, aliases: ['batata doce'] },
    { name: 'Cenoura', category: 'hortifruti', unit: 'kg', brand: null, aliases: ['cenoura'] },
    { name: 'Beterraba', category: 'hortifruti', unit: 'kg', brand: null, aliases: ['beterraba'] },
    { name: 'Abóbora Moranga', category: 'hortifruti', unit: 'kg', brand: null, aliases: ['abóbora', 'moranga'] },
    { name: 'Pepino', category: 'hortifruti', unit: 'un', brand: null, aliases: ['pepino'] },
    { name: 'Pimentão Verde', category: 'hortifruti', unit: 'un', brand: null, aliases: ['pimentão', 'pimentão verde'] },
    { name: 'Alface Crespa', category: 'hortifruti', unit: 'un', brand: null, aliases: ['alface', 'alface crespa'] },
    { name: 'Couve Manteiga', category: 'hortifruti', unit: 'mç', brand: null, aliases: ['couve', 'couve manteiga'] },
    { name: 'Repolho', category: 'hortifruti', unit: 'un', brand: null, aliases: ['repolho'] },
    { name: 'Brócolis', category: 'hortifruti', unit: 'un', brand: null, aliases: ['brócolis'] },
    { name: 'Couve-Flor', category: 'hortifruti', unit: 'un', brand: null, aliases: ['couve-flor'] },
    { name: 'Cheiro Verde', category: 'hortifruti', unit: 'mç', brand: null, aliases: ['cheiro verde', 'coentro', 'cebolinha'] },

    // ============ CONGELADOS ============
    { name: 'Pizza Congelada 460g', category: 'mercado', unit: 'un', brand: 'Sadia', aliases: ['pizza congelada', 'pizza'] },
    { name: 'Lasanha Congelada 600g', category: 'mercado', unit: 'un', brand: 'Perdigão', aliases: ['lasanha', 'lasanha congelada'] },
    { name: 'Hambúrguer Bovino 672g', category: 'mercado', unit: 'un', brand: 'Seara', aliases: ['hambúrguer', 'hamburguer'] },
    { name: 'Nuggets de Frango 300g', category: 'mercado', unit: 'un', brand: 'Sadia', aliases: ['nuggets', 'nugget'] },
    { name: 'Batata Frita Congelada 1kg', category: 'mercado', unit: 'un', brand: 'McCain', aliases: ['batata frita congelada', 'batata palito'] },
    { name: 'Sorvete 2L', category: 'mercado', unit: 'un', brand: 'Kibon', aliases: ['sorvete'] },

    // ============ DOCES E SOBREMESAS ============
    { name: 'Chocolate ao Leite 170g', category: 'mercado', unit: 'un', brand: 'Nestlé', aliases: ['chocolate', 'chocolate ao leite'] },
    { name: 'Bombom 250g', category: 'mercado', unit: 'cx', brand: 'Garoto', aliases: ['bombom'] },
    { name: 'Gelatina em Pó 85g', category: 'mercado', unit: 'un', brand: 'Dr. Oetker', aliases: ['gelatina'] },
    { name: 'Pudim 200g', category: 'mercado', unit: 'un', brand: 'Royal', aliases: ['pudim'] },
    { name: 'Doce de Leite 400g', category: 'mercado', unit: 'un', brand: 'Viçosa', aliases: ['doce de leite'] },
    { name: 'Goiabada 600g', category: 'mercado', unit: 'un', brand: 'Quero', aliases: ['goiabada'] },
];

async function seedProducts() {
    console.log('🌱 Seeding products...');

    let created = 0;
    let skipped = 0;

    for (const product of products) {
        try {
            await prisma.product.upsert({
                where: { name: product.name },
                update: {
                    aliases: product.aliases,
                    category: product.category,
                    unit: product.unit,
                    brand: product.brand
                },
                create: {
                    name: product.name,
                    category: product.category,
                    unit: product.unit,
                    brand: product.brand,
                    aliases: product.aliases
                }
            });
            created++;
        } catch (error) {
            console.warn(`Skipped ${product.name}: ${error.message}`);
            skipped++;
        }
    }

    console.log(`✅ Created/updated ${created} products`);
    if (skipped > 0) console.log(`⚠️ Skipped ${skipped} products`);
}

// Run seeder
seedProducts()
    .then(() => {
        console.log('🎉 Product seeding complete!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Error seeding products:', error);
        process.exit(1);
    })
    .finally(() => {
        prisma.$disconnect();
    });
