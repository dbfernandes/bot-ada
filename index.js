const { Client, GatewayIntentBits, ChannelType } = require('discord.js');
const dotenv = require('dotenv')
const cron = require('node-cron');
const Holidays = require('date-holidays');

const hd = new Holidays('BR', 'AM');

dotenv.config();
const FORUM_CHANNEL_ID = process.env.FORUM_CHANNEL_ID;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CARGO_EQUIPE_ID = process.env.CARGO_EQUIPE_ID;
const MEMBROS_DAILY = process.env.MEMBROS_DAILY.split(',').map(id => id.trim());

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

let threadDeHoje = null;

const TEMPLATE = `Data: {{DATA}}
Membro da equipe:

Tarefa Atual:
Códigos do Jira: SCRUM-251

1. O que foi feito ontem?

- Status da Tarefa:
- Porcentagem de conclusão:
- Pull Request aberto: 

2. O que irei fazer hoje?

3. Existe algum impedimento bloqueando meu trabalho?
`;

function isFeriado(date) {
  return hd.isHoliday(date) !== false;
}

async function criarDaily() {
  const hoje = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Manaus' }));

  if (isFeriado(hoje)) {
    console.log(`Feriado em ${hoje.toLocaleDateString('pt-BR')} — daily não criada.`);
    return;
  }

  const canal = await client.channels.fetch(FORUM_CHANNEL_ID);

  if (canal.type !== ChannelType.GuildText) {
    console.error('O canal não é um canal de texto.');
    return;
  }

  const data = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', timeZone: 'America/Manaus',
  });

  threadDeHoje = await canal.threads.create({
    name: `Daily ${data}`,
    autoArchiveDuration: 1440,
    type: ChannelType.PublicThread,
    reason: 'Thread diária de daily scrum',
  });
  const thread = threadDeHoje;

  await thread.send({
    content: `<@&${CARGO_EQUIPE_ID}>\n\n${TEMPLATE.replace('{{DATA}}', data)}`,
    allowedMentions: { roles: [CARGO_EQUIPE_ID] },
  });

  console.log(`Thread "Daily ${data}" criada.`);
}


async function cobrarDaily() {
  if (!threadDeHoje) {
    console.log('Nenhuma thread criada hoje — cobrança ignorada.');
    return;
  }

  const hoje = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Manaus' }));
  if (isFeriado(hoje)) return;

  const mensagens = await threadDeHoje.messages.fetch({ limit: 100 });
  const quemPostou = new Set(
    mensagens.filter(m => !m.author.bot).map(m => m.author.id)
  );

  const ausentes = MEMBROS_DAILY.filter(id => !quemPostou.has(id));

  if (ausentes.length === 0) {
    console.log('Todos já escreveram a daily!');
    return;
  }

  const mencoes = ausentes.map(id => `<@${id}>`).join(' ');
  await threadDeHoje.send(
    `${mencoes}\n\nA daily ainda não foi registrada! Por favor, escreva a Daily assim que possível.`
  );

  console.log(`Cobrança enviada para ${ausentes.length} membro(s).`);
}

client.once('clientReady', () => {
  console.log(`Logado como ${client.user.tag}`);

  cron.schedule('0 8 * * 1-5', criarDaily, { timezone: 'America/Manaus' });
  cron.schedule('0 10 * * 1-5', cobrarDaily, { timezone: 'America/Manaus' });
});

client.login(DISCORD_TOKEN);