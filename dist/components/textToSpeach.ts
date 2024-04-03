import { AudioPlayerStatus, StreamType, VoiceConnection, VoiceConnectionStatus, createAudioPlayer, createAudioResource, entersState, joinVoiceChannel } from "@discordjs/voice";
import { Message, TextChannel, VoiceChannel } from "discord.js";
import { QueueSystem } from "./queueSystem";
import { MakeVoiceBuffer } from "./makeVoiceBuffer";
import { Readable } from "stream";
import { GuildVoiceChannelCaches } from "./guildJoinCaches";


export async function textToSpeach(
    _connection : { connectionManager : VoiceConnection } ,
    message : Message,
    queue : QueueSystem,
    voiceBuffer : MakeVoiceBuffer,
    guildCache : GuildVoiceChannelCaches,
    guildJoinedCache : Map<string, { connectionManager : VoiceConnection }>
){
    if(message.guild === null || typeof message.guild === "undefined" || message.member == null || message.member.voice.channelId == null) return;

    const connectionManager = joinVoiceChannel({
        guildId : message.guild.id,
        channelId : message.member.voice.channelId,
        adapterCreator : message.guild.voiceAdapterCreator,
        selfMute : false,
    })
    const connection = { connectionManager }

    console.log(`[TTS] Status ${connection.connectionManager.state.status} ${connection.connectionManager.joinConfig.guildId}`)
    
    const queueText = queue.getFirstQueue( message.guildId as string );
    if( queueText ){
        const buffer = await voiceBuffer.makeVoiceBuffer(queueText);
        if( buffer.status === 1 ){
            const readable = Readable.from(buffer.audioBuffer);
            const resource = createAudioResource(readable , { inlineVolume: true });
            const player = createAudioPlayer()

            //if(connection.connectionManager.state.status === "destroyed") connection.connectionManager.rejoin();
            resource.volume?.setVolume(1);
            player.play( resource );

            /*
            try { 
                await entersState(player, AudioPlayerStatus.Playing, 100_000)
            }catch(err){
                connection.connectionManager.disconnect();
                queue.clearQueue(message.guildId as string);
                guildCache.disconnectVoiceChannel(message.channelId);
                guildJoinedCache.delete(message.guildId as string);
                throw err
            } */

            player.on(AudioPlayerStatus.Playing, () => {
                console.log(`Playing...`)
            })

            player.on(AudioPlayerStatus.Idle, async () => {
                console.log(`[TTS] Change to idle, shift queue`)
                queue.queueShift( message.guildId as string );
                await textToSpeach(
                    connection,
                    message,
                    queue,
                    voiceBuffer,
                    guildCache,
                    guildJoinedCache
                );
            })

            player.on('error', (error) => {
                console.error(`Error : ${error.message}`);
                queue.clearQueue(message.guildId as string);
                guildCache.disconnectVoiceChannel(message.channelId);
                guildJoinedCache.delete(message.guildId as string);
            })

            connection.connectionManager.subscribe( player )
        }
        else {
            const channel = message.guild?.channels.cache.get(message.channelId);
            if( channel?.isTextBased() && channel instanceof ( TextChannel || VoiceChannel )){
                await channel.send({
                    content : `音声の生成に失敗しました。`
                })
            }
            return;
        }
    }
}