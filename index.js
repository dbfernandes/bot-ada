const { Client, GatewayIntentBits, ChannelType } = require('discord.js');
const dotenv = require('dotenv')
const cron = require('node-cron');

dotenv.config();
const FORUM_CHANNEL_ID = process.env.FORUM_CHANNEL_ID;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const TEMPLATE = `Data: {{DATA}}
Membro da equipe:

Tarefa Atual:
Código do Jira: WF-251

**1. O que foi feito ontem?**

**2. O que será feito hoje?**

**3. Há algum impedimento?**`;

async function criarDaily() {
  const canal = await client.channels.fetch(FORUM_CHANNEL_ID);
  if (canal.type !== ChannelType.GuildForum) {
    console.error('O canal não é um fórum.');
    return;
  }

  const data = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', timeZone: 'America/Manaus',
  });

  await canal.threads.create({
    name: `Daily ${data}`,
    message: { content: TEMPLATE.replace('{{DATA}}', data) },
  });

  console.log(`Post "Daily ${data}" criado.`);
}

client.once('clientReady', () => {
  console.log(`Logado como ${client.user.tag}`);

  // Seg a Sex às 05:00, horário de Manaus
  cron.schedule('0 5 * * 1-5', criarDaily, {
    timezone: 'America/Manaus',
  });
});

client.login(DISCORD_TOKEN);