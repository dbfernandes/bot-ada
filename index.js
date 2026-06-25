const { Client, GatewayIntentBits, ChannelType } = require('discord.js');
const dotenv = require('dotenv')
const cron = require('node-cron');

dotenv.config();
const FORUM_CHANNEL_ID = process.env.FORUM_CHANNEL_ID;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CARGO_EQUIPE_ID = process.env.CARGO_EQUIPE_ID;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

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

async function criarDaily() {
  const canal = await client.channels.fetch(FORUM_CHANNEL_ID);

  if (canal.type !== ChannelType.GuildText) {
    console.error('O canal não é um canal de texto.');
    return;
  }

  const data = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', timeZone: 'America/Manaus',
  });

  const thread = await canal.threads.create({
    name: `Daily ${data}`,
    autoArchiveDuration: 1440,
    type: ChannelType.PublicThread,
    reason: 'Thread diária de daily scrum',
  });

  await thread.send({
    content: `<@&${CARGO_EQUIPE_ID}>\n\n${TEMPLATE.replace('{{DATA}}', data)}`,
    allowedMentions: { roles: [CARGO_EQUIPE_ID] },
  });

  console.log(`Thread "Daily ${data}" criada.`);
}


client.once('clientReady', () => {
  console.log(`Logado como ${client.user.tag}`);

  // Seg a Sex às 05:00, horário de Manaus
  cron.schedule('0 8 * * 1-5', criarDaily, {
    timezone: 'America/Manaus',
  });
});

client.login(DISCORD_TOKEN);