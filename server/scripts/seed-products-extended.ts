import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Extended product seed with brand variations
 * Run with: npx tsx scripts/seed-products-extended.ts
 */

const products = [
    // ============ ARROZ - VARIAÇÕES DE MARCA ============
    { name: 'Arroz Branco Tio João 5kg', category: 'mercado', unit: 'pct', brand: 'Tio João', aliases: ['arroz tio joão', 'arroz branco 5kg'] },
    { name: 'Arroz Branco Camil 5kg', category: 'mercado', unit: 'pct', brand: 'Camil', aliases: ['arroz camil'] },
    { name: 'Arroz Branco Prato Fino 5kg', category: 'mercado', unit: 'pct', brand: 'Prato Fino', aliases: ['arroz prato fino'] },
    { name: 'Arroz Branco Kika 5kg', category: 'mercado', unit: 'pct', brand: 'Kika', aliases: ['arroz kika'] },
    { name: 'Arroz Branco Urbano 5kg', category: 'mercado', unit: 'pct', brand: 'Urbano', aliases: ['arroz urbano'] },
    { name: 'Arroz Integral Camil 1kg', category: 'mercado', unit: 'pct', brand: 'Camil', aliases: ['arroz integral camil'] },
    { name: 'Arroz Integral Tio João 1kg', category: 'mercado', unit: 'pct', brand: 'Tio João', aliases: ['arroz integral tio joão'] },
    { name: 'Arroz Parboilizado Camil 5kg', category: 'mercado', unit: 'pct', brand: 'Camil', aliases: ['arroz parboilizado camil'] },
    { name: 'Arroz Parboilizado Tio João 5kg', category: 'mercado', unit: 'pct', brand: 'Tio João', aliases: ['arroz parboilizado tio joão'] },

    // ============ FEIJÃO - VARIAÇÕES DE MARCA ============
    { name: 'Feijão Carioca Camil 1kg', category: 'mercado', unit: 'pct', brand: 'Camil', aliases: ['feijão camil'] },
    { name: 'Feijão Carioca Kicaldo 1kg', category: 'mercado', unit: 'pct', brand: 'Kicaldo', aliases: ['feijão kicaldo'] },
    { name: 'Feijão Carioca Qualitá 1kg', category: 'mercado', unit: 'pct', brand: 'Qualitá', aliases: ['feijão qualitá'] },
    { name: 'Feijão Carioca Broto Legal 1kg', category: 'mercado', unit: 'pct', brand: 'Broto Legal', aliases: ['feijão broto legal'] },
    { name: 'Feijão Preto Camil 1kg', category: 'mercado', unit: 'pct', brand: 'Camil', aliases: ['feijão preto camil'] },
    { name: 'Feijão Preto Kicaldo 1kg', category: 'mercado', unit: 'pct', brand: 'Kicaldo', aliases: ['feijão preto kicaldo'] },

    // ============ AÇÚCAR - VARIAÇÕES DE MARCA ============
    { name: 'Açúcar Cristal União 1kg', category: 'mercado', unit: 'pct', brand: 'União', aliases: ['açúcar união'] },
    { name: 'Açúcar Cristal Caravelas 1kg', category: 'mercado', unit: 'pct', brand: 'Caravelas', aliases: ['açúcar caravelas'] },
    { name: 'Açúcar Cristal Da Barra 1kg', category: 'mercado', unit: 'pct', brand: 'Da Barra', aliases: ['açúcar da barra'] },
    { name: 'Açúcar Refinado União 1kg', category: 'mercado', unit: 'pct', brand: 'União', aliases: ['açúcar refinado união'] },
    { name: 'Açúcar Refinado Caravelas 1kg', category: 'mercado', unit: 'pct', brand: 'Caravelas', aliases: ['açúcar refinado caravelas'] },
    { name: 'Açúcar Demerara Native 1kg', category: 'mercado', unit: 'pct', brand: 'Native', aliases: ['açúcar demerara native'] },
    { name: 'Açúcar Demerara União 1kg', category: 'mercado', unit: 'pct', brand: 'União', aliases: ['açúcar demerara união'] },

    // ============ ÓLEO - VARIAÇÕES DE MARCA ============
    { name: 'Óleo de Soja Soya 900ml', category: 'mercado', unit: 'un', brand: 'Soya', aliases: ['óleo soya'] },
    { name: 'Óleo de Soja Liza 900ml', category: 'mercado', unit: 'un', brand: 'Liza', aliases: ['óleo liza'] },
    { name: 'Óleo de Soja Qualitá 900ml', category: 'mercado', unit: 'un', brand: 'Qualitá', aliases: ['óleo qualitá'] },
    { name: 'Óleo de Soja ABC 900ml', category: 'mercado', unit: 'un', brand: 'ABC', aliases: ['óleo abc'] },
    { name: 'Óleo de Girassol Liza 900ml', category: 'mercado', unit: 'un', brand: 'Liza', aliases: ['óleo girassol liza'] },
    { name: 'Óleo de Milho Liza 500ml', category: 'mercado', unit: 'un', brand: 'Liza', aliases: ['óleo milho'] },

    // ============ AZEITE - VARIAÇÕES DE MARCA ============
    { name: 'Azeite Gallo 500ml', category: 'mercado', unit: 'un', brand: 'Gallo', aliases: ['azeite gallo'] },
    { name: 'Azeite Andorinha 500ml', category: 'mercado', unit: 'un', brand: 'Andorinha', aliases: ['azeite andorinha'] },
    { name: 'Azeite Borges 500ml', category: 'mercado', unit: 'un', brand: 'Borges', aliases: ['azeite borges'] },
    { name: 'Azeite Carbonell 500ml', category: 'mercado', unit: 'un', brand: 'Carbonell', aliases: ['azeite carbonell'] },
    { name: 'Azeite Cocinero 500ml', category: 'mercado', unit: 'un', brand: 'Cocinero', aliases: ['azeite cocinero'] },

    // ============ LEITE - VARIAÇÕES DE MARCA ============
    { name: 'Leite Integral Parmalat 1L', category: 'mercado', unit: 'un', brand: 'Parmalat', aliases: ['leite parmalat'] },
    { name: 'Leite Integral Itambé 1L', category: 'mercado', unit: 'un', brand: 'Itambé', aliases: ['leite itambé'] },
    { name: 'Leite Integral Piracanjuba 1L', category: 'mercado', unit: 'un', brand: 'Piracanjuba', aliases: ['leite piracanjuba'] },
    { name: 'Leite Integral Elegê 1L', category: 'mercado', unit: 'un', brand: 'Elegê', aliases: ['leite elegê'] },
    { name: 'Leite Integral Nestlé 1L', category: 'mercado', unit: 'un', brand: 'Nestlé', aliases: ['leite nestlé'] },
    { name: 'Leite Desnatado Parmalat 1L', category: 'mercado', unit: 'un', brand: 'Parmalat', aliases: ['leite desnatado parmalat'] },
    { name: 'Leite Desnatado Itambé 1L', category: 'mercado', unit: 'un', brand: 'Itambé', aliases: ['leite desnatado itambé'] },
    { name: 'Leite em Pó Ninho 400g', category: 'mercado', unit: 'un', brand: 'Ninho', aliases: ['leite ninho'] },
    { name: 'Leite em Pó Itambé 400g', category: 'mercado', unit: 'un', brand: 'Itambé', aliases: ['leite em pó itambé'] },
    { name: 'Leite em Pó Piracanjuba 400g', category: 'mercado', unit: 'un', brand: 'Piracanjuba', aliases: ['leite em pó piracanjuba'] },

    // ============ LEITE CONDENSADO - VARIAÇÕES DE MARCA ============
    { name: 'Leite Condensado Moça 395g', category: 'mercado', unit: 'un', brand: 'Moça', aliases: ['leite moça'] },
    { name: 'Leite Condensado Piracanjuba 395g', category: 'mercado', unit: 'un', brand: 'Piracanjuba', aliases: ['leite condensado piracanjuba'] },
    { name: 'Leite Condensado Italac 395g', category: 'mercado', unit: 'un', brand: 'Italac', aliases: ['leite condensado italac'] },
    { name: 'Leite Condensado Elegê 395g', category: 'mercado', unit: 'un', brand: 'Elegê', aliases: ['leite condensado elegê'] },

    // ============ CREME DE LEITE - VARIAÇÕES DE MARCA ============
    { name: 'Creme de Leite Nestlé 200g', category: 'mercado', unit: 'un', brand: 'Nestlé', aliases: ['creme de leite nestlé'] },
    { name: 'Creme de Leite Piracanjuba 200g', category: 'mercado', unit: 'un', brand: 'Piracanjuba', aliases: ['creme de leite piracanjuba'] },
    { name: 'Creme de Leite Italac 200g', category: 'mercado', unit: 'un', brand: 'Italac', aliases: ['creme de leite italac'] },
    { name: 'Creme de Leite Elegê 200g', category: 'mercado', unit: 'un', brand: 'Elegê', aliases: ['creme de leite elegê'] },

    // ============ CAFÉ - VARIAÇÕES DE MARCA ============
    { name: 'Café Pilão 500g', category: 'mercado', unit: 'un', brand: 'Pilão', aliases: ['café pilão'] },
    { name: 'Café Melitta 500g', category: 'mercado', unit: 'un', brand: 'Melitta', aliases: ['café melitta'] },
    { name: 'Café 3 Corações 500g', category: 'mercado', unit: 'un', brand: '3 Corações', aliases: ['café 3 corações'] },
    { name: 'Café Bom Jesus 500g', category: 'mercado', unit: 'un', brand: 'Bom Jesus', aliases: ['café bom jesus'] },
    { name: 'Café Caboclo 500g', category: 'mercado', unit: 'un', brand: 'Caboclo', aliases: ['café caboclo'] },
    { name: 'Café Santa Clara 500g', category: 'mercado', unit: 'un', brand: 'Santa Clara', aliases: ['café santa clara'] },
    { name: 'Café Solúvel Nescafé 100g', category: 'mercado', unit: 'un', brand: 'Nescafé', aliases: ['nescafé'] },
    { name: 'Café Solúvel Pilão 100g', category: 'mercado', unit: 'un', brand: 'Pilão', aliases: ['café solúvel pilão'] },

    // ============ REFRIGERANTES - VARIAÇÕES ============
    { name: 'Coca-Cola 2L', category: 'mercado', unit: 'un', brand: 'Coca-Cola', aliases: ['coca-cola', 'coca'] },
    { name: 'Coca-Cola Zero 2L', category: 'mercado', unit: 'un', brand: 'Coca-Cola', aliases: ['coca zero'] },
    { name: 'Coca-Cola Lata 350ml', category: 'mercado', unit: 'un', brand: 'Coca-Cola', aliases: ['coca lata'] },
    { name: 'Guaraná Antarctica 2L', category: 'mercado', unit: 'un', brand: 'Antarctica', aliases: ['guaraná antarctica'] },
    { name: 'Guaraná Antarctica Lata 350ml', category: 'mercado', unit: 'un', brand: 'Antarctica', aliases: ['guaraná lata'] },
    { name: 'Fanta Laranja 2L', category: 'mercado', unit: 'un', brand: 'Fanta', aliases: ['fanta laranja'] },
    { name: 'Fanta Uva 2L', category: 'mercado', unit: 'un', brand: 'Fanta', aliases: ['fanta uva'] },
    { name: 'Sprite 2L', category: 'mercado', unit: 'un', brand: 'Sprite', aliases: ['sprite'] },
    { name: 'Pepsi 2L', category: 'mercado', unit: 'un', brand: 'Pepsi', aliases: ['pepsi'] },
    { name: 'Kuat 2L', category: 'mercado', unit: 'un', brand: 'Kuat', aliases: ['kuat'] },
    { name: 'Schweppes Citrus 2L', category: 'mercado', unit: 'un', brand: 'Schweppes', aliases: ['schweppes'] },

    // ============ CERVEJAS - VARIAÇÕES DE MARCA ============
    { name: 'Cerveja Brahma Lata 350ml', category: 'mercado', unit: 'un', brand: 'Brahma', aliases: ['brahma'] },
    { name: 'Cerveja Skol Lata 350ml', category: 'mercado', unit: 'un', brand: 'Skol', aliases: ['skol'] },
    { name: 'Cerveja Antarctica Lata 350ml', category: 'mercado', unit: 'un', brand: 'Antarctica', aliases: ['antarctica'] },
    { name: 'Cerveja Itaipava Lata 350ml', category: 'mercado', unit: 'un', brand: 'Itaipava', aliases: ['itaipava'] },
    { name: 'Cerveja Kaiser Lata 350ml', category: 'mercado', unit: 'un', brand: 'Kaiser', aliases: ['kaiser'] },
    { name: 'Cerveja Heineken Long Neck 330ml', category: 'mercado', unit: 'un', brand: 'Heineken', aliases: ['heineken'] },
    { name: 'Cerveja Budweiser Long Neck 330ml', category: 'mercado', unit: 'un', brand: 'Budweiser', aliases: ['budweiser'] },
    { name: 'Cerveja Stella Artois Long Neck 330ml', category: 'mercado', unit: 'un', brand: 'Stella Artois', aliases: ['stella artois'] },
    { name: 'Cerveja Corona Long Neck 330ml', category: 'mercado', unit: 'un', brand: 'Corona', aliases: ['corona'] },

    // ============ SABÃO EM PÓ - VARIAÇÕES DE MARCA ============
    { name: 'Sabão em Pó Omo 1kg', category: 'mercado', unit: 'un', brand: 'Omo', aliases: ['omo'] },
    { name: 'Sabão em Pó Ariel 1kg', category: 'mercado', unit: 'un', brand: 'Ariel', aliases: ['ariel'] },
    { name: 'Sabão em Pó Ace 1kg', category: 'mercado', unit: 'un', brand: 'Ace', aliases: ['ace'] },
    { name: 'Sabão em Pó Tixan Ypê 1kg', category: 'mercado', unit: 'un', brand: 'Ypê', aliases: ['tixan ypê'] },
    { name: 'Sabão em Pó Brilhante 1kg', category: 'mercado', unit: 'un', brand: 'Brilhante', aliases: ['brilhante'] },
    { name: 'Sabão Líquido Omo 3L', category: 'mercado', unit: 'un', brand: 'Omo', aliases: ['omo líquido'] },
    { name: 'Sabão Líquido Ariel 3L', category: 'mercado', unit: 'un', brand: 'Ariel', aliases: ['ariel líquido'] },

    // ============ AMACIANTE - VARIAÇÕES DE MARCA ============
    { name: 'Amaciante Comfort 2L', category: 'mercado', unit: 'un', brand: 'Comfort', aliases: ['comfort'] },
    { name: 'Amaciante Downy 2L', category: 'mercado', unit: 'un', brand: 'Downy', aliases: ['downy'] },
    { name: 'Amaciante Mon Bijou 2L', category: 'mercado', unit: 'un', brand: 'Mon Bijou', aliases: ['mon bijou'] },
    { name: 'Amaciante Ypê 2L', category: 'mercado', unit: 'un', brand: 'Ypê', aliases: ['amaciante ypê'] },

    // ============ DETERGENTE - VARIAÇÕES DE MARCA ============
    { name: 'Detergente Ypê 500ml', category: 'mercado', unit: 'un', brand: 'Ypê', aliases: ['detergente ypê'] },
    { name: 'Detergente Limpol 500ml', category: 'mercado', unit: 'un', brand: 'Limpol', aliases: ['limpol'] },
    { name: 'Detergente Minuano 500ml', category: 'mercado', unit: 'un', brand: 'Minuano', aliases: ['minuano'] },
    { name: 'Detergente Louçabras 500ml', category: 'mercado', unit: 'un', brand: 'Louçabras', aliases: ['louçabras'] },

    // ============ DESINFETANTE - VARIAÇÕES DE MARCA ============
    { name: 'Desinfetante Pinho Sol 1L', category: 'mercado', unit: 'un', brand: 'Pinho Sol', aliases: ['pinho sol'] },
    { name: 'Desinfetante Veja 1L', category: 'mercado', unit: 'un', brand: 'Veja', aliases: ['veja desinfetante'] },
    { name: 'Desinfetante Lysoform 1L', category: 'mercado', unit: 'un', brand: 'Lysoform', aliases: ['lysoform'] },
    { name: 'Desinfetante Pato 500ml', category: 'mercado', unit: 'un', brand: 'Pato', aliases: ['pato'] },
    { name: 'Desinfetante Ypê 2L', category: 'mercado', unit: 'un', brand: 'Ypê', aliases: ['desinfetante ypê'] },

    // ============ ÁGUA SANITÁRIA - VARIAÇÕES DE MARCA ============
    { name: 'Água Sanitária Qboa 2L', category: 'mercado', unit: 'un', brand: 'Qboa', aliases: ['qboa'] },
    { name: 'Água Sanitária Super Globo 2L', category: 'mercado', unit: 'un', brand: 'Super Globo', aliases: ['super globo'] },
    { name: 'Água Sanitária Ypê 2L', category: 'mercado', unit: 'un', brand: 'Ypê', aliases: ['água sanitária ypê'] },

    // ============ PAPEL HIGIÊNICO - VARIAÇÕES DE MARCA ============
    { name: 'Papel Higiênico Neve 12un', category: 'mercado', unit: 'pct', brand: 'Neve', aliases: ['neve'] },
    { name: 'Papel Higiênico Personal 12un', category: 'mercado', unit: 'pct', brand: 'Personal', aliases: ['personal'] },
    { name: 'Papel Higiênico Mili 12un', category: 'mercado', unit: 'pct', brand: 'Mili', aliases: ['mili'] },
    { name: 'Papel Higiênico Sublime 12un', category: 'mercado', unit: 'pct', brand: 'Sublime', aliases: ['sublime'] },

    // ============ CREME DENTAL - VARIAÇÕES DE MARCA ============
    { name: 'Creme Dental Colgate 90g', category: 'mercado', unit: 'un', brand: 'Colgate', aliases: ['colgate'] },
    { name: 'Creme Dental Oral-B 90g', category: 'mercado', unit: 'un', brand: 'Oral-B', aliases: ['oral-b'] },
    { name: 'Creme Dental Close Up 90g', category: 'mercado', unit: 'un', brand: 'Close Up', aliases: ['close up'] },
    { name: 'Creme Dental Sorriso 90g', category: 'mercado', unit: 'un', brand: 'Sorriso', aliases: ['sorriso'] },
    { name: 'Creme Dental Sensodyne 90g', category: 'mercado', unit: 'un', brand: 'Sensodyne', aliases: ['sensodyne'] },

    // ============ SHAMPOO - VARIAÇÕES DE MARCA ============
    { name: 'Shampoo Pantene 400ml', category: 'mercado', unit: 'un', brand: 'Pantene', aliases: ['pantene'] },
    { name: 'Shampoo Dove 400ml', category: 'mercado', unit: 'un', brand: 'Dove', aliases: ['shampoo dove'] },
    { name: 'Shampoo Head & Shoulders 400ml', category: 'mercado', unit: 'un', brand: 'Head & Shoulders', aliases: ['head shoulders'] },
    { name: 'Shampoo Seda 325ml', category: 'mercado', unit: 'un', brand: 'Seda', aliases: ['seda'] },
    { name: 'Shampoo Elseve 400ml', category: 'mercado', unit: 'un', brand: 'Elseve', aliases: ['elseve'] },
    { name: 'Shampoo TRESemmé 400ml', category: 'mercado', unit: 'un', brand: 'TRESemmé', aliases: ['tresemmé'] },
    { name: 'Shampoo Clear 400ml', category: 'mercado', unit: 'un', brand: 'Clear', aliases: ['clear'] },

    // ============ SABONETE - VARIAÇÕES DE MARCA ============
    { name: 'Sabonete Dove 90g', category: 'mercado', unit: 'un', brand: 'Dove', aliases: ['sabonete dove'] },
    { name: 'Sabonete Lux 85g', category: 'mercado', unit: 'un', brand: 'Lux', aliases: ['sabonete lux'] },
    { name: 'Sabonete Palmolive 85g', category: 'mercado', unit: 'un', brand: 'Palmolive', aliases: ['palmolive'] },
    { name: 'Sabonete Protex 85g', category: 'mercado', unit: 'un', brand: 'Protex', aliases: ['protex'] },
    { name: 'Sabonete Nivea 90g', category: 'mercado', unit: 'un', brand: 'Nivea', aliases: ['sabonete nivea'] },
    { name: 'Sabonete Francis 90g', category: 'mercado', unit: 'un', brand: 'Francis', aliases: ['francis'] },

    // ============ DESODORANTE - VARIAÇÕES DE MARCA ============
    { name: 'Desodorante Rexona Roll-on 50ml', category: 'mercado', unit: 'un', brand: 'Rexona', aliases: ['rexona'] },
    { name: 'Desodorante Dove Roll-on 50ml', category: 'mercado', unit: 'un', brand: 'Dove', aliases: ['desodorante dove'] },
    { name: 'Desodorante Nivea Roll-on 50ml', category: 'mercado', unit: 'un', brand: 'Nivea', aliases: ['desodorante nivea'] },
    { name: 'Desodorante Axe Aerosol 150ml', category: 'mercado', unit: 'un', brand: 'Axe', aliases: ['axe'] },
    { name: 'Desodorante Old Spice 150ml', category: 'mercado', unit: 'un', brand: 'Old Spice', aliases: ['old spice'] },

    // ============ FRALDAS - VARIAÇÕES DE MARCA ============
    { name: 'Fralda Pampers M 40un', category: 'mercado', unit: 'pct', brand: 'Pampers', aliases: ['pampers m'] },
    { name: 'Fralda Pampers G 36un', category: 'mercado', unit: 'pct', brand: 'Pampers', aliases: ['pampers g'] },
    { name: 'Fralda Huggies M 36un', category: 'mercado', unit: 'pct', brand: 'Huggies', aliases: ['huggies m'] },
    { name: 'Fralda Huggies G 32un', category: 'mercado', unit: 'pct', brand: 'Huggies', aliases: ['huggies g'] },
    { name: 'Fralda Personal M 40un', category: 'mercado', unit: 'pct', brand: 'Personal', aliases: ['fralda personal'] },
    { name: 'Fralda MamyPoko M 38un', category: 'mercado', unit: 'pct', brand: 'MamyPoko', aliases: ['mamypoko'] },

    // ============ MACARRÃO - VARIAÇÕES DE MARCA ============
    { name: 'Macarrão Espaguete Barilla 500g', category: 'mercado', unit: 'pct', brand: 'Barilla', aliases: ['barilla espaguete'] },
    { name: 'Macarrão Espaguete Adria 500g', category: 'mercado', unit: 'pct', brand: 'Adria', aliases: ['adria espaguete'] },
    { name: 'Macarrão Espaguete Renata 500g', category: 'mercado', unit: 'pct', brand: 'Renata', aliases: ['renata espaguete'] },
    { name: 'Macarrão Espaguete Gallo 500g', category: 'mercado', unit: 'pct', brand: 'Gallo', aliases: ['gallo espaguete'] },
    { name: 'Macarrão Penne Barilla 500g', category: 'mercado', unit: 'pct', brand: 'Barilla', aliases: ['barilla penne'] },
    { name: 'Macarrão Parafuso Adria 500g', category: 'mercado', unit: 'pct', brand: 'Adria', aliases: ['adria parafuso'] },
    { name: 'Miojo Nissin Galinha Caipira', category: 'mercado', unit: 'un', brand: 'Nissin', aliases: ['miojo nissin', 'nissin'] },
    { name: 'Miojo Nissin Carne', category: 'mercado', unit: 'un', brand: 'Nissin', aliases: ['miojo carne'] },

    // ============ MOLHO DE TOMATE - VARIAÇÕES DE MARCA ============
    { name: 'Molho de Tomate Heinz 340g', category: 'mercado', unit: 'un', brand: 'Heinz', aliases: ['molho heinz'] },
    { name: 'Molho de Tomate Barilla 400g', category: 'mercado', unit: 'un', brand: 'Barilla', aliases: ['molho barilla'] },
    { name: 'Molho de Tomate Pomarola 340g', category: 'mercado', unit: 'un', brand: 'Pomarola', aliases: ['pomarola'] },
    { name: 'Molho de Tomate Quero 340g', category: 'mercado', unit: 'un', brand: 'Quero', aliases: ['molho quero'] },
    { name: 'Extrato de Tomate Elefante 340g', category: 'mercado', unit: 'un', brand: 'Elefante', aliases: ['extrato elefante'] },
    { name: 'Extrato de Tomate Quero 340g', category: 'mercado', unit: 'un', brand: 'Quero', aliases: ['extrato quero'] },

    // ============ BISCOITOS/BOLACHAS - VARIAÇÕES DE MARCA ============
    { name: 'Biscoito Oreo 130g', category: 'mercado', unit: 'un', brand: 'Oreo', aliases: ['oreo'] },
    { name: 'Biscoito Negresco 140g', category: 'mercado', unit: 'un', brand: 'Nestlé', aliases: ['negresco'] },
    { name: 'Biscoito Passatempo 130g', category: 'mercado', unit: 'un', brand: 'Nestlé', aliases: ['passatempo'] },
    { name: 'Biscoito Trakinas 126g', category: 'mercado', unit: 'un', brand: 'Trakinas', aliases: ['trakinas'] },
    { name: 'Biscoito Belvita 75g', category: 'mercado', unit: 'un', brand: 'Belvita', aliases: ['belvita'] },
    { name: 'Biscoito Club Social 144g', category: 'mercado', unit: 'un', brand: 'Club Social', aliases: ['club social'] },
    { name: 'Biscoito Cream Cracker Piraquê 200g', category: 'mercado', unit: 'un', brand: 'Piraquê', aliases: ['cream cracker piraquê'] },
    { name: 'Biscoito Cream Cracker Marilan 400g', category: 'mercado', unit: 'un', brand: 'Marilan', aliases: ['cream cracker marilan'] },

    // ============ ACHOCOLATADO - VARIAÇÕES DE MARCA ============
    { name: 'Achocolatado Nescau 400g', category: 'mercado', unit: 'un', brand: 'Nescau', aliases: ['nescau'] },
    { name: 'Achocolatado Toddy 400g', category: 'mercado', unit: 'un', brand: 'Toddy', aliases: ['toddy'] },
    { name: 'Achocolatado Ovomaltine 400g', category: 'mercado', unit: 'un', brand: 'Ovomaltine', aliases: ['ovomaltine'] },
    { name: 'Achocolatado Chocolatto 400g', category: 'mercado', unit: 'un', brand: 'Chocolatto', aliases: ['chocolatto'] },

    // ============ MARGARINA/MANTEIGA - VARIAÇÕES DE MARCA ============
    { name: 'Margarina Qualy 500g', category: 'mercado', unit: 'un', brand: 'Qualy', aliases: ['qualy'] },
    { name: 'Margarina Delícia 500g', category: 'mercado', unit: 'un', brand: 'Delícia', aliases: ['delícia margarina'] },
    { name: 'Margarina Primor 500g', category: 'mercado', unit: 'un', brand: 'Primor', aliases: ['primor'] },
    { name: 'Margarina Doriana 500g', category: 'mercado', unit: 'un', brand: 'Doriana', aliases: ['doriana'] },
    { name: 'Manteiga Aviação com Sal 200g', category: 'mercado', unit: 'un', brand: 'Aviação', aliases: ['manteiga aviação'] },
    { name: 'Manteiga Itambé com Sal 200g', category: 'mercado', unit: 'un', brand: 'Itambé', aliases: ['manteiga itambé'] },
    { name: 'Manteiga Elegê com Sal 200g', category: 'mercado', unit: 'un', brand: 'Elegê', aliases: ['manteiga elegê'] },

    // ============ QUEIJOS - VARIAÇÕES DE MARCA ============
    { name: 'Queijo Mussarela Tirolez 500g', category: 'mercado', unit: 'kg', brand: 'Tirolez', aliases: ['mussarela tirolez'] },
    { name: 'Queijo Mussarela Président 500g', category: 'mercado', unit: 'kg', brand: 'Président', aliases: ['mussarela président'] },
    { name: 'Queijo Prato Tirolez 500g', category: 'mercado', unit: 'kg', brand: 'Tirolez', aliases: ['queijo prato tirolez'] },
    { name: 'Requeijão Catupiry 200g', category: 'mercado', unit: 'un', brand: 'Catupiry', aliases: ['catupiry'] },
    { name: 'Requeijão Polenghi 200g', category: 'mercado', unit: 'un', brand: 'Polenghi', aliases: ['requeijão polenghi'] },
    { name: 'Cream Cheese Philadelphia 150g', category: 'mercado', unit: 'un', brand: 'Philadelphia', aliases: ['philadelphia', 'cream cheese'] },

    // ============ IOGURTE - VARIAÇÕES DE MARCA ============
    { name: 'Iogurte Danone Morango 170g', category: 'mercado', unit: 'un', brand: 'Danone', aliases: ['danone morango'] },
    { name: 'Iogurte Activia 170g', category: 'mercado', unit: 'un', brand: 'Activia', aliases: ['activia'] },
    { name: 'Iogurte Batavo 170g', category: 'mercado', unit: 'un', brand: 'Batavo', aliases: ['iogurte batavo'] },
    { name: 'Iogurte Nestlé 170g', category: 'mercado', unit: 'un', brand: 'Nestlé', aliases: ['iogurte nestlé'] },
    { name: 'Iogurte Grego Vigor 100g', category: 'mercado', unit: 'un', brand: 'Vigor', aliases: ['iogurte grego'] },
    { name: 'Danoninho Bandeja 320g', category: 'mercado', unit: 'un', brand: 'Danone', aliases: ['danoninho'] },

    // ============ CHOCOLATES - VARIAÇÕES DE MARCA ============
    { name: 'Chocolate Lacta ao Leite 90g', category: 'mercado', unit: 'un', brand: 'Lacta', aliases: ['lacta ao leite'] },
    { name: 'Chocolate Nestlé Classic 90g', category: 'mercado', unit: 'un', brand: 'Nestlé', aliases: ['nestlé classic'] },
    { name: 'Chocolate Garoto ao Leite 90g', category: 'mercado', unit: 'un', brand: 'Garoto', aliases: ['garoto ao leite'] },
    { name: 'Chocolate Bis 126g', category: 'mercado', unit: 'un', brand: 'Lacta', aliases: ['bis'] },
    { name: 'Bombom Sonho de Valsa 23g', category: 'mercado', unit: 'un', brand: 'Lacta', aliases: ['sonho de valsa'] },
    { name: 'Bombom Ouro Branco 22g', category: 'mercado', unit: 'un', brand: 'Lacta', aliases: ['ouro branco'] },
    { name: 'Bombom Serenata de Amor 25g', category: 'mercado', unit: 'un', brand: 'Garoto', aliases: ['serenata de amor'] },

    // ============ SALGADINHOS - VARIAÇÕES DE MARCA ============
    { name: 'Batata Ruffles Original 76g', category: 'mercado', unit: 'un', brand: 'Ruffles', aliases: ['ruffles'] },
    { name: 'Batata Ruffles Churrasco 76g', category: 'mercado', unit: 'un', brand: 'Ruffles', aliases: ['ruffles churrasco'] },
    { name: 'Batata Lays Original 86g', category: 'mercado', unit: 'un', brand: 'Lays', aliases: ['lays'] },
    { name: 'Doritos Queijo Nacho 96g', category: 'mercado', unit: 'un', brand: 'Doritos', aliases: ['doritos'] },
    { name: 'Cheetos Requeijão 40g', category: 'mercado', unit: 'un', brand: 'Cheetos', aliases: ['cheetos'] },
    { name: 'Salgadinho Fandangos 45g', category: 'mercado', unit: 'un', brand: 'Fandangos', aliases: ['fandangos'] },
    { name: 'Amendoim Japonês Elma Chips 145g', category: 'mercado', unit: 'un', brand: 'Elma Chips', aliases: ['amendoim japonês'] },

    // ============ CONGELADOS - VARIAÇÕES DE MARCA ============
    { name: 'Pizza Sadia Mussarela 440g', category: 'mercado', unit: 'un', brand: 'Sadia', aliases: ['pizza sadia'] },
    { name: 'Pizza Perdigão Calabresa 460g', category: 'mercado', unit: 'un', brand: 'Perdigão', aliases: ['pizza perdigão'] },
    { name: 'Pizza Seara Mussarela 440g', category: 'mercado', unit: 'un', brand: 'Seara', aliases: ['pizza seara'] },
    { name: 'Lasanha Sadia Bolonhesa 600g', category: 'mercado', unit: 'un', brand: 'Sadia', aliases: ['lasanha sadia'] },
    { name: 'Lasanha Perdigão 600g', category: 'mercado', unit: 'un', brand: 'Perdigão', aliases: ['lasanha perdigão'] },
    { name: 'Nuggets Sadia 300g', category: 'mercado', unit: 'un', brand: 'Sadia', aliases: ['nuggets sadia'] },
    { name: 'Nuggets Perdigão 300g', category: 'mercado', unit: 'un', brand: 'Perdigão', aliases: ['nuggets perdigão'] },
    { name: 'Hambúrguer Seara Gourmet 672g', category: 'mercado', unit: 'un', brand: 'Seara', aliases: ['hambúrguer seara'] },
    { name: 'Hambúrguer Sadia 672g', category: 'mercado', unit: 'un', brand: 'Sadia', aliases: ['hambúrguer sadia'] },
    { name: 'Batata McCain Palito 1kg', category: 'mercado', unit: 'un', brand: 'McCain', aliases: ['mccain'] },

    // ============ SORVETES - VARIAÇÕES DE MARCA ============
    { name: 'Sorvete Kibon 2L', category: 'mercado', unit: 'un', brand: 'Kibon', aliases: ['kibon'] },
    { name: 'Sorvete Nestlé 2L', category: 'mercado', unit: 'un', brand: 'Nestlé', aliases: ['sorvete nestlé'] },
    { name: 'Picolé Kibon', category: 'mercado', unit: 'un', brand: 'Kibon', aliases: ['picolé kibon'] },
    { name: 'Picolé Nestlé', category: 'mercado', unit: 'un', brand: 'Nestlé', aliases: ['picolé nestlé'] },

    // ============ FARMÁCIA - MEDICAMENTOS COMUNS ============
    { name: 'Dipirona 500mg 10cp', category: 'farmacia', unit: 'cx', brand: 'Genérico', aliases: ['dipirona'] },
    { name: 'Dorflex 36cp', category: 'farmacia', unit: 'cx', brand: 'Sanofi', aliases: ['dorflex'] },
    { name: 'Paracetamol 750mg 20cp', category: 'farmacia', unit: 'cx', brand: 'Genérico', aliases: ['paracetamol'] },
    { name: 'Ibuprofeno 400mg 20cp', category: 'farmacia', unit: 'cx', brand: 'Genérico', aliases: ['ibuprofeno'] },
    { name: 'Buscopan Composto 20cp', category: 'farmacia', unit: 'cx', brand: 'Boehringer', aliases: ['buscopan'] },
    { name: 'Advil 400mg 8cp', category: 'farmacia', unit: 'cx', brand: 'GSK', aliases: ['advil'] },
    { name: 'Tylenol 750mg 20cp', category: 'farmacia', unit: 'cx', brand: 'J&J', aliases: ['tylenol'] },
    { name: 'Benegrip 6cp', category: 'farmacia', unit: 'cx', brand: 'GSK', aliases: ['benegrip'] },
    { name: 'Vitamina C Cebion 1g 10cp', category: 'farmacia', unit: 'cx', brand: 'Merck', aliases: ['vitamina c', 'cebion'] },
    { name: 'Ômega 3 1000mg 60cp', category: 'farmacia', unit: 'cx', brand: 'Genérico', aliases: ['ômega 3', 'omega 3'] },
    { name: 'Centrum Adulto 30cp', category: 'farmacia', unit: 'cx', brand: 'Pfizer', aliases: ['centrum'] },
    { name: 'Band-Aid 10un', category: 'farmacia', unit: 'cx', brand: 'J&J', aliases: ['band-aid', 'curativo'] },
    { name: 'Água Oxigenada 100ml', category: 'farmacia', unit: 'un', brand: 'Genérico', aliases: ['água oxigenada'] },
    { name: 'Álcool 70% 1L', category: 'farmacia', unit: 'un', brand: 'Genérico', aliases: ['álcool 70', 'álcool etílico'] },
    { name: 'Algodão 50g', category: 'farmacia', unit: 'un', brand: 'Genérico', aliases: ['algodão'] },

    // ============ PET - RAÇÕES E PRODUTOS ============
    { name: 'Ração Golden Cães Adulto 15kg', category: 'pet', unit: 'un', brand: 'Golden', aliases: ['ração golden'] },
    { name: 'Ração Pedigree Cães Adulto 15kg', category: 'pet', unit: 'un', brand: 'Pedigree', aliases: ['ração pedigree'] },
    { name: 'Ração Royal Canin Cães 15kg', category: 'pet', unit: 'un', brand: 'Royal Canin', aliases: ['royal canin cães'] },
    { name: 'Ração Premier Cães 15kg', category: 'pet', unit: 'un', brand: 'Premier', aliases: ['ração premier'] },
    { name: 'Ração Whiskas Gatos Adulto 10kg', category: 'pet', unit: 'un', brand: 'Whiskas', aliases: ['whiskas'] },
    { name: 'Ração GranPlus Gatos 10kg', category: 'pet', unit: 'un', brand: 'GranPlus', aliases: ['granplus gatos'] },
    { name: 'Sachê Whiskas Gatos 85g', category: 'pet', unit: 'un', brand: 'Whiskas', aliases: ['sachê whiskas'] },
    { name: 'Sachê Pedigree Cães 100g', category: 'pet', unit: 'un', brand: 'Pedigree', aliases: ['sachê pedigree'] },
    { name: 'Antipulgas Bravecto Cães', category: 'pet', unit: 'un', brand: 'Bravecto', aliases: ['bravecto'] },
    { name: 'Antipulgas Nexgard Cães', category: 'pet', unit: 'un', brand: 'Nexgard', aliases: ['nexgard'] },
    { name: 'Shampoo para Cães 500ml', category: 'pet', unit: 'un', brand: 'Genérico', aliases: ['shampoo cachorro'] },
    { name: 'Areia para Gatos 4kg', category: 'pet', unit: 'un', brand: 'Genérico', aliases: ['areia de gato'] },

    // ============ COMBUSTÍVEL ============
    { name: 'Gasolina Comum', category: 'combustivel', unit: 'L', brand: null, aliases: ['gasolina', 'gasolina comum'] },
    { name: 'Gasolina Aditivada', category: 'combustivel', unit: 'L', brand: null, aliases: ['gasolina aditivada'] },
    { name: 'Etanol', category: 'combustivel', unit: 'L', brand: null, aliases: ['álcool', 'etanol', 'álcool combustível'] },
    { name: 'Diesel S10', category: 'combustivel', unit: 'L', brand: null, aliases: ['diesel s10', 'diesel'] },
    { name: 'Diesel Comum', category: 'combustivel', unit: 'L', brand: null, aliases: ['diesel comum'] },
    { name: 'GNV', category: 'combustivel', unit: 'm³', brand: null, aliases: ['gás natural', 'gnv'] },
];

async function seedProducts() {
    console.log('🌱 Seeding extended products with brand variations...');

    let created = 0;
    let skipped = 0;

    for (const product of products) {
        try {
            await prisma.product.upsert({
                where: { name: product.name },
                update: { aliases: product.aliases, category: product.category, unit: product.unit, brand: product.brand },
                create: { name: product.name, category: product.category, unit: product.unit, brand: product.brand, aliases: product.aliases },
            });
            created++;
        } catch (error) {
            skipped++;
        }
    }

    console.log(`✅ Created/updated ${created} products`);
    if (skipped > 0) console.log(`⚠️ Skipped ${skipped} products`);

    const totalProducts = await prisma.product.count();
    console.log(`📊 Total products in database: ${totalProducts}`);
}

seedProducts()
    .then(() => { console.log('🎉 Extended product seeding complete!'); process.exit(0); })
    .catch((error) => { console.error('❌ Error:', error); process.exit(1); })
    .finally(() => { prisma.$disconnect(); });
