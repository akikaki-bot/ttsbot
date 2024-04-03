

export class GuildVoiceChannelCaches {

    private CACHE_voiceChannel : Map<MessageChannelId , TTSInfomationData> = new Map();

    constructor( ){
        this.CACHE_voiceChannel = new Map();   
    }

    public addVoiceChannel( data : TTSInfomationData ) : void {
        this.CACHE_voiceChannel.set(data.messageChannelId,data);
    }

    public IsTTSChannel (messageChannelId : MessageChannelId ) : boolean {
        return this.CACHE_voiceChannel.has(messageChannelId);
    }

    public disconnectVoiceChannel( messageChannelId : MessageChannelId ) : void {
        this.CACHE_voiceChannel.delete(messageChannelId);
    }
}

export interface TTSInfomationData {
    guildId : GuildId,
    voiceChannelId : VoiceChannelId,
    messageChannelId : MessageChannelId
}

type MessageChannelId = string
type VoiceChannelId = string
type GuildId = string