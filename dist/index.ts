import {
    Client,
    GatewayIntentBits,
    GuildMember,
    TextChannel,
    VoiceChannel,
} from "discord.js";
import { QueueSystem } from "./components/queueSystem";
import { MakeVoiceBuffer } from "./components/makeVoiceBuffer";
import { CommandList } from "./constants/command";
import { GuildVoiceChannelCaches } from "./components/guildJoinCaches";
import { EmbedBuilder } from "@discordjs/builders";
import { VoiceConnection, VoiceConnectionStatus, joinVoiceChannel } from "@discordjs/voice";
import { textToSpeach } from "./components/textToSpeach";
import { DISCORD_BOT_TOKEN } from "./secrets";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessageReactions
    ],
});

const queue = new QueueSystem();
const voiceBuffer = new MakeVoiceBuffer("S_616741c7w-634");
const guildJoinedCache = new Map<string, { connectionManager : VoiceConnection }>();
const guildCache = new GuildVoiceChannelCaches();


client.on("ready" , async ( ) => {
    console.log(`[READY] Logged in as ${client.user?.tag}!`)
    
    const usage = await voiceBuffer.getUsage();
    if( typeof usage.points !== "undefined" ){
        console.log(`[USAGE] Points : ${usage.points} , Reset in : ${usage.resetInHours} hours`);   
    }
        
    await client.application?.commands.set( CommandList )
})

client.on('messageCreate', async message => {
    if( message.author.bot ) return;
    console.log(`[MESSAGE] ${message.content}`)
    if(message.content === " " || message.content.length === 0 || typeof message.content === "undefined") return;
    if( guildCache.IsTTSChannel( message.channelId )){
        console.log(`[TTS] ${message.content}`)
        //const EmojiRegix = /^\p{RGI_Emoji}$/v
        //<:hikakin_:978295056349929542>
        const DiscordEmojiRegix = /\:[a-z]+\:[0-9]+/g
        const URLRegix = /https?:\/\/[\w!?/+\-_~;.,*&@#$%()'[\]]+/g
        const DiscordUniqueId = /[0-9]{18}/g

        const ReplacedContent = message.content
                                        //.replace(EmojiRegix , "絵文字")
                                        .replace(DiscordEmojiRegix, "絵文字")
                                        .replace(URLRegix, "URL")
                                        //.replace(DiscordUniqueId , "あいでぃー")

        queue.addQueue( ReplacedContent, message.guildId as string );
        const connection = guildJoinedCache.get( message.guildId as string );
        if(!connection || typeof connection === "undefined") {
            const channel = message.guild?.channels.cache.get(message.channelId);
            if( channel?.isTextBased() && channel instanceof ( TextChannel || VoiceChannel )){
                await channel.send({
                    content : "マネージャーが見つからないため、再度参加処理を行ってください。"
                })
            }
            queue.clearQueue(message.guildId as string);
            guildCache.disconnectVoiceChannel(message.channelId);
            guildJoinedCache.delete(message.guildId as string);
            return;
        }
        if( queue.getNumberOfQueue( message.guildId as string ) === 1 ){
            if( connection.connectionManager.state.status === VoiceConnectionStatus.Signalling){
                console.log(`[TTS] sended packet to gateway, but its not complete yet.`)
            }
            await textToSpeach(
                connection,
                message,
                queue,
                voiceBuffer,
                guildCache,
                guildJoinedCache
            );
        }
    }
})

client.on('interactionCreate', async interaction => {
    if( !interaction.isCommand() ) return;
    const { commandName } = interaction;

    if( commandName === "join" ){
        const isJoinedChannel = guildJoinedCache.has( interaction.guildId as string );
        if( isJoinedChannel ){
            await interaction.reply({
                embeds : [
                    new EmbedBuilder().setTitle('既に参加しています。').setDescription(`既に参加状態となっています。`)
                ]
            });
            return;
        }

        const getUser = await interaction.guild?.members.fetch(interaction.user.id);
        if( getUser instanceof GuildMember ){
            const memberVC = getUser.voice.channel;
            if(!memberVC) { 
                await interaction.reply({
                    embeds : [
                        new EmbedBuilder().setTitle('参加することが不可能です。').setDescription(`ボイスチャンネルに参加してから実行してください。`)
                    ]
                });
                return
            }
            if(!memberVC.joinable){
                await interaction.reply({
                    embeds : [
                        new EmbedBuilder().setTitle('参加することが不可能です。').setDescription(`BOTに参加権限がありません。`)
                    ]
                });
                return
            }
            const connection = joinVoiceChannel({
                guildId : String(interaction.guildId),
                channelId : String(memberVC.id),
                adapterCreator : memberVC.guild.voiceAdapterCreator,
                selfMute : false,
            })

            console.log(connection.state.status)

            guildCache.addVoiceChannel({
                guildId : interaction.guildId as string,
                voiceChannelId : memberVC.id,
                messageChannelId : interaction.channelId as string
            })



            guildJoinedCache.set(
                interaction.guildId as string , 
                { 
                    connectionManager : connection 
                }
            );

            await interaction.reply({
                embeds : [
                    new EmbedBuilder().setTitle('TTS機能を有効にしました。').setDescription(`このTTSBotはVoiceVox並びにVoiceVox公開APIを利用しています。\nこのBOTは非公式のBOTです。\n利用時はVoiceVoxの利用規約に従ってください。`)
                ]
            });
        }
        else {
            await interaction.reply({
                embeds : [
                    new EmbedBuilder().setTitle('エラーによりステージが見つかりませんでした。').setDescription(`ボイスチャンネルを解決できませんでした。`)
                ]
            });
        }
    }

    if( commandName === "leave") {
        const isJoinedChannel = guildJoinedCache.has( interaction.guildId as string );
        if( !isJoinedChannel ){
            await interaction.reply({
                embeds : [
                    new EmbedBuilder().setTitle('参加していません').setDescription(`VCに接続していません。`)
                ]
            });
            return;
        }

        const getUser = await interaction.guild?.members.fetch(interaction.user.id);
        if( getUser instanceof GuildMember ){
            const memberVC = getUser.voice.channel;
            if(!memberVC) { 
                await interaction.reply({
                    embeds : [
                        new EmbedBuilder().setTitle('参加することが不可能です。').setDescription(`ボイスチャンネルに参加してから実行してください。`)
                    ]
                });
                return
            }
            if(!memberVC.joinable){
                await interaction.reply({
                    embeds : [
                        new EmbedBuilder().setTitle('参加することが不可能です。').setDescription(`BOTに参加権限がありません。`)
                    ]
                });
                return
            }

            const manager = guildJoinedCache.get(interaction.guildId as string);
            manager?.connectionManager.destroy();

            queue.clearQueue(interaction.guildId as string);
            guildCache.disconnectVoiceChannel(interaction.channelId);
            guildJoinedCache.delete(interaction.guildId as string);

            await interaction.reply({
                embeds : [
                    new EmbedBuilder().setTitle('TTS機能を無効にしました。').setDescription(`このTTSBotはVoiceVox並びにVoiceVox公開APIを利用しています。\nこのBOTは非公式のBOTです。\n利用時はVoiceVoxの利用規約に従ってください。`)
                ]
            });
        }
        else {
            await interaction.reply({
                embeds : [
                    new EmbedBuilder().setTitle('エラーによりステージが見つかりませんでした。').setDescription(`ボイスチャンネルを解決できませんでした。`)
                ]
            });
        }
    }
})

client.login(DISCORD_BOT_TOKEN)