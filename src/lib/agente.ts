// Agente temporario de demonstracao do Festivity.
// Nao usa IA nem chave de API: procura palavras-chave na pergunta e
// responde com um texto pronto. Funciona offline, o que ajuda na feira.
// Para remover depois: apague este arquivo, AgentePage.tsx e a rota /agente.

interface Tema {
  palavras: string[];
  resposta: string;
}

const temas: Tema[] = [
  {
    palavras: ['sobre', 'festao', 'festivity', 'o que e', 'para que serve', 'finalidade', 'objetivo', 'apresent'],
    resposta:
      'O Festivity é uma plataforma para organizar eventos do começo ao fim: casamentos, aniversários, 15 anos, confraternizações e outros. Você reúne convidados, presentes, orçamento e fornecedores em um só lugar.',
  },
  {
    palavras: ['criar', 'cadastrar evento', 'novo evento', 'comecar', 'montar evento'],
    resposta:
      'Para criar um evento, clique em "Criar evento". São 4 passos: escolher o tipo, preencher os detalhes (nome, data, local), escrever uma descrição e confirmar. Depois você cai no painel do evento.',
  },
  {
    palavras: ['tipo', 'tipos', 'casamento', 'aniversario', '15 anos', 'formatura', 'cha de bebe', 'batizado', 'corporativo', 'confraternizacao'],
    resposta:
      'O Festivity atende vários tipos de evento: casamento, 15 anos, aniversário, formatura, chá de bebê, chá de panela, batizado, corporativo e outros. Cada tipo mostra só as ferramentas que fazem sentido para ele.',
  },
  {
    palavras: ['convidado', 'convidados', 'convite', 'rsvp', 'confirmar presenca', 'presenca', 'lista de convidados'],
    resposta:
      'Na área de convidados você cadastra as pessoas e acompanha quem confirmou, quem ainda não respondeu e quem recusou. Cada convidado recebe um link de convite individual, em que ele mesmo confirma a presença.',
  },
  {
    palavras: ['presente', 'presentes', 'lista de presentes', 'reservar', 'reserva', 'gift'],
    resposta:
      'A lista de presentes mostra os itens desejados, com preços em lojas diferentes. O convidado pode reservar um presente para que ninguém compre o mesmo. Quem organiza acompanha o que já foi escolhido ou recebido.',
  },
  {
    palavras: ['orcamento', 'gasto', 'gastos', 'custo', 'custos', 'dinheiro', 'financeiro'],
    resposta:
      'No controle de orçamento você lista os gastos previstos do evento, marca o que já foi contratado ou pago e acompanha o total. Assim você não estoura o valor combinado.',
  },
  {
    palavras: ['fornecedor', 'fornecedores', 'profissional', 'profissionais', 'servico', 'servicos', 'marketplace', 'fotografo', 'fotografia', 'buffet', 'decoracao', 'dj', 'maquiagem', 'espaco', 'contratar', 'contratacao'],
    resposta:
      'Na aba Serviços você encontra fotógrafos, decoradores, buffets, DJs, maquiadores e espaços para eventos. Dá para filtrar por categoria, buscar por nome ou cidade e ver o perfil de cada profissional. Os profissionais da demonstração são fictícios.',
  },
  {
    palavras: ['preco', 'custa', 'pagamento', 'pagar', 'gratis', 'cobra', 'assinatura', 'comissao'],
    resposta:
      'Nesta versão de demonstração, o uso é gratuito e não há pagamentos. A forma de ganho para os profissionais, como uma comissão sobre cada contratação, é uma proposta que ainda não está implementada.',
  },
  {
    palavras: ['login', 'entrar', 'conta', 'senha', 'cadastro', 'registrar'],
    resposta:
      'Você cria uma conta em "Cadastro" e entra com e-mail e senha. Assim, os eventos ficam vinculados a você e podem ser vistos de outro dispositivo.',
  },
  {
    palavras: ['tecnologia', 'tecnologias', 'react', 'banco', 'backend', 'programacao', 'como foi feito', 'feito com', 'codigo', 'typescript'],
    resposta:
      'O Festivity é feito com React e TypeScript no site, e Node.js com Express no servidor. Os dados ficam em um banco SQLite, controlado pelo Prisma. Tudo roda em um notebook, sem precisar de internet.',
  },
  {
    palavras: ['demo', 'demonstracao', 'testar', 'como usar', 'como funciona', 'tutorial', 'passo a passo'],
    resposta:
      'Para testar: crie uma conta, clique em "Criar evento", preencha os dados e explore convidados, presentes e orçamento. Na tela inicial do painel há também a opção de carregar um evento de exemplo.',
  },
  {
    palavras: ['oi', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'tudo bem', 'eae', 'e ai'],
    resposta:
      'Olá! Sou o assistente de demonstração do Festivity. Posso explicar o que é a plataforma, os tipos de evento, convidados, presentes, orçamento e serviços. O que você quer saber?',
  },
];

const RESPOSTA_PADRAO =
  'Não entendi bem a pergunta. Posso falar sobre: o que é o Festivity, como criar um evento, tipos de evento, convidados, lista de presentes, orçamento, serviços e fornecedores, cadastro e tecnologia usada.';

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Escolhe o tema com mais palavras-chave encontradas na pergunta. */
export function responder(pergunta: string): string {
  const texto = ` ${normalizar(pergunta)} `;
  if (!texto.trim()) return 'Escreva uma pergunta para eu responder.';

  let melhor: Tema | null = null;
  let melhorPontos = 0;

  for (const tema of temas) {
    let pontos = 0;
    for (const palavra of tema.palavras) {
      const chave = normalizar(palavra);
      if (chave && texto.includes(` ${chave} `)) pontos += 2;
      else if (chave && texto.includes(chave)) pontos += 1;
    }
    if (pontos > melhorPontos) {
      melhorPontos = pontos;
      melhor = tema;
    }
  }

  return melhor ? melhor.resposta : RESPOSTA_PADRAO;
}

export const sugestoes = [
  'O que é o Festivity?',
  'Como criar um evento?',
  'Quais tipos de evento existem?',
  'Como funciona a lista de presentes?',
  'Como encontro fornecedores?',
  'Qual a tecnologia usada?',
];
