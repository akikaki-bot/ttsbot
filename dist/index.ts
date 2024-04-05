import {
    ActivityType,
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
import { DISCORD_BOT_TOKEN, PUBLIC_VOICEVOXAPI_KEY } from "./secrets";
import { DictionaryDatabase, GuildAutoConnectChannelDatabase, UserDatabase } from "./components/database";
import { SelectSpeaker } from "./components/selectSpeaker";
import { messageContentFilter } from "./components/filter";

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

// Runtime Classes
const queue = new QueueSystem();
const voiceBuffer = new MakeVoiceBuffer(PUBLIC_VOICEVOXAPI_KEY);
const guildJoinedCache = new Map<string, { connectionManager : VoiceConnection }>();
const guildCache = new GuildVoiceChannelCaches();
const speakerDB = new UserDatabase();
const dictionaryDB = new DictionaryDatabase();
const GuildAutoCHDB = new GuildAutoConnectChannelDatabase();
//

// Commands
const SelectCommand = new SelectSpeaker();
//

client.on("ready" , async ( ) => {
    console.log(`[READY] Logged in as ${client.user?.tag}!`)

    client.user?.setActivity({
        name : "/join | ただの TTSBot",
        type : ActivityType.Playing
    })
    
    /*
    const usage = await voiceBuffer.getUsage();
    if( typeof usage.points !== "undefined" ){
        console.log(`[USAGE] Points : ${usage.points} , Reset in : ${usage.resetInHours} hours`);   
    }
    */
        
    await client.application?.commands.set( CommandList )
})

client.on('messageCreate', async message => {
    if( message.author.bot ) return;
    if(message.content === " " || message.content.length === 0 || typeof message.content === "undefined") return;
    if( guildCache.IsTTSChannel( message.channelId )){
        console.log(`[TTS] ${message.content}`)
        //const EmojiRegix = /^\p{RGI_Emoji}$/v
        //<:hikakin_:978295056349929542>
        

        const speakerId = await speakerDB.getSpeaker( message.author.id );
        const ReplacedContent = await messageContentFilter( message.guildId as string , message.content )

        await queue.addQueue( ReplacedContent, message.guildId as string , speakerId ? parseInt(speakerId) : 3 );
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

client.on('voiceStateUpdate', async (oldState, newState) => {

    const autoChannel = await GuildAutoCHDB.getAutoConnectChannel( newState.guild.id );
    if( oldState.channelId !== null && newState.channelId === null ){
        // 自動切断
        if( !oldState.channel.members.has( client.user?.id as string ) ) return; // Botがいない場合は無視
        if( oldState.channel.members.size === 1){
            const manager = guildJoinedCache.get(oldState.guild.id); // マネージャー探す
            if( manager ){
                //いた
                const channelId = guildCache.getDataFromGuildId(oldState.guild.id)?.messageChannelId as string; // チャンネルID取得
                // リセット処理する（三歳児）
                manager.connectionManager.destroy();
                queue.clearQueue(oldState.guild.id);
                guildCache.disconnectVoiceChannel(channelId);
                guildJoinedCache.delete(oldState.guild.id);
                // チャンネル探して送る
                const channel = oldState.guild?.channels.cache.get(channelId);
                if( channel?.isTextBased() && channel instanceof ( TextChannel || VoiceChannel )){
                    await channel.send({
                        embeds : [
                            new EmbedBuilder().setTitle('TTS機能を無効にしました。').setDescription(`
                            【注意】
                            このBotは非公式のBotです。
                            利用にはVoiceVoxの利用規約に従う必要があります。
                            詳しくは [公式の利用規約](https://voicevox.hiroshiba.jp/term/) をご確認ください。
        
                            また、本ボットはヒホ氏によって公開されているアプリケーションである、VoiceVoxのエンジンを利用しています。
                            Youtube等で本Botを利用した動画を公開する場合は、「VoiceVox : ずんだもん」 等のクレジット表記が必要となりますので、ご注意ください。
                        
                            `)
                        ]
                    })
                }
            }
        }
    }

    if( !autoChannel ) return;
    if( newState.channel === null ) return;
    if( newState.channel.members.has(client.user?.id as string) ) return;
    if( autoChannel.channelId === newState.channelId ){
        const connection = joinVoiceChannel({
            guildId : newState.guild.id,
            channelId : newState.channelId,
            adapterCreator : newState.guild.voiceAdapterCreator,
            selfMute : false,
        })

        guildCache.addVoiceChannel({
            guildId : newState.guild.id,
            voiceChannelId : newState.channelId,
            messageChannelId : autoChannel.textChannelId
        })

        guildJoinedCache.set(
            newState.guild.id , 
            { 
                connectionManager : connection 
            }
        );

        const channel = newState.guild?.channels.cache.get(autoChannel.textChannelId);
        if( channel?.isTextBased() && channel instanceof ( TextChannel || VoiceChannel )){
            await channel.send({
                embeds : [
                    new EmbedBuilder().setTitle('自動接続').setDescription(`
                    自動接続しました。
                    
                    --- --- --- --- ---
                    
                    【注意】
                    このBotは非公式のBotです。
                    利用にはVoiceVoxの利用規約に従う必要があります。
                    詳しくは [公式の利用規約](https://voicevox.hiroshiba.jp/term/) をご確認ください。

                    また、本ボットはヒホ氏によって公開されているアプリケーションである、VoiceVoxのエンジンを利用しています。
                    Youtube等で本Botを利用した動画を公開する場合は、「VoiceVox : ずんだもん」 等のクレジット表記が必要となりますので、ご注意ください。
                
                    `)
                ]
            })
        }
    }
})

client.on('interactionCreate', async interaction => {

    if( interaction.isStringSelectMenu() ){
        if( interaction.customId === "select.speaker"){
            await SelectCommand.selectSpeaker( interaction );
        }
        if( interaction.customId === "select.emotion"){
            await SelectCommand.setEmotion( interaction );
        }
    }

    if( !interaction.isCommand() ) return;
    const { commandName } = interaction;

    if( commandName === "auto_connect"){
        const channel = interaction.options.get('channel', true).channel 
        const textChannel = interaction.options.get('textchannel', true).channel
        if( channel instanceof VoiceChannel && textChannel instanceof TextChannel){
            GuildAutoCHDB.saveAutoConnectChannel( interaction.guildId , channel.id, textChannel.id);
            await interaction.reply({
                embeds : [
                    new EmbedBuilder().setTitle('自動接続設定完了').setDescription(`自動接続するボイスチャンネルを設定しました。\n チャンネル : <#${channel.id}>`)
                ]
            })
        }
        else {
            await interaction.reply({
                embeds : [
                    new EmbedBuilder().setTitle('エラー').setDescription(`接続しようとしているチャンネルは\`音声チャンネル\`もしくは\`テキストチャンネル\`ではありません。`)
                ]
            })
        }
    }

    if( commandName === "speaker"){
        SelectCommand.firstReply( interaction )
    }

    if( commandName === "dictionary" ){
        const word = interaction.options.get('word' , true).value as string;
        const pronunciation = interaction.options.get('pronunciation', true).value as string;;
        if( word && pronunciation ){
            await dictionaryDB.saveDictionary( interaction.guildId , word , pronunciation );
            await interaction.reply({
                embeds : [
                    new EmbedBuilder().setTitle('辞書登録完了').setDescription(`辞書に登録しました。\n 単語 : ${word} \n 発音 : ${pronunciation}`)
                ]
            })
        }
    }

    if( commandName === "dictionary_delete" ){
        const word = interaction.options.get('word' , true).value as string;
        const status = await dictionaryDB.deleteDictionary( interaction.guildId , word );
        if( status === -1 ){
            await interaction.reply({
                embeds : [
                    new EmbedBuilder().setTitle('辞書削除失敗').setDescription(`辞書に登録されていません。\n 単語 : ${word}`)
                ]
            })
            return;
        }
        await interaction.reply({
            embeds : [
                new EmbedBuilder().setTitle('辞書削除完了').setDescription(`辞書から削除しました。\n 単語 : ${word}`)
            ]
        })
    }

    if( commandName === "dictionary_list" ){
        const data = await dictionaryDB.getDictionary( interaction.guildId );
        if( typeof data === "undefined"){
            await interaction.reply({
                embeds : [
                    new EmbedBuilder().setTitle('辞書一覧').setDescription(`辞書に登録されていません。`)
                ]
            })
            return;
        }
        const list = data.map( d => `単語 : ${d.word} , 発音 : ${d.pronunciation}`).join("\n");
        await interaction.reply({
            embeds : [
                new EmbedBuilder().setTitle('辞書一覧').setDescription(list)
            ]
        })
    }

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
                    new EmbedBuilder().setTitle('TTS機能を有効にしました。').setDescription(`
                        【注意】
                        このBotは非公式のBotです。
                        利用にはVoiceVoxの利用規約に従う必要があります。
                        詳しくは [公式の利用規約](https://voicevox.hiroshiba.jp/term/) をご確認ください。

                        また、本ボットはヒホ氏によって公開されているアプリケーションである、VoiceVoxのエンジンを利用しています。
                        Youtube等で本Botを利用した動画を公開する場合は、「VoiceVox : ずんだもん」 等のクレジット表記が必要となりますので、ご注意ください。
                    `)
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
                    new EmbedBuilder().setTitle('TTS機能を無効にしました。').setDescription(`
                        【注意】
                        このBotは非公式のBotです。
                        利用にはVoiceVoxの利用規約に従う必要があります。
                        詳しくは [公式の利用規約](https://voicevox.hiroshiba.jp/term/) をご確認ください。

                        また、本ボットはヒホ氏によって公開されているアプリケーションである、VoiceVoxのエンジンを利用しています。
                        Youtube等で本Botを利用した動画を公開する場合は、「VoiceVox : ずんだもん」 等のクレジット表記が必要となりますので、ご注意ください。
                    `)
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