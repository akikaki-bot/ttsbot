import { PUBLIC_VOICEVOXAPI_KEY } from "../secrets";
import { MakeVoiceBuffer } from "./makeVoiceBuffer"

const makevoicebuffer = new MakeVoiceBuffer(PUBLIC_VOICEVOXAPI_KEY)

export class QueueSystem {

    private queue : { guildId : string , queue : Map<string, object> }[] = [];

    constructor(){
        this.queue = [];
    }

    public getNumberOfQueue( guildId : string ) : number {
        const queue = this.queue.find( q => q.guildId === guildId );
        if( queue ){
            return queue.queue.size;
        }
        return 0;
    }

    public async addQueue( queueText : string , guildId : string , speakerId : number = 3 ) : Promise<void> {
        const accent = await makevoicebuffer.getAccent( queueText , speakerId)
        if( accent.status === 0 ) return;

        const queue = this.queue.find( q => q.guildId === guildId );
        if( queue ){
            queue.queue.set(queueText, accent.accent );
        } else {
            this.queue.push({
                guildId : guildId,
                queue : new Map([[queueText,accent.accent]])
            });
        }
    }

    public getFirstQueue( guildId : string ) : object | undefined {
        const queue = this.queue.find( q => q.guildId === guildId );
        //console.log(queue.queue.entries().next().value[1])
        if( queue ){
            if(typeof queue.queue.entries().next().value === "undefined") return;
            return queue.queue.entries().next().value[1];
        }
    }

    public queueShift( guildId : string ) : void {
        const queue = this.queue.find( q => q.guildId === guildId );
        if( queue ){
            if(typeof queue.queue.entries().next().value[0] === "undefined") return queue.queue.clear();
            queue.queue.delete(queue.queue.entries().next().value[0]);
        }
    }

    public clearQueue( guildId : string ) : void {
        const queue = this.queue.find( q => q.guildId === guildId );
        if( queue ){
            queue.queue.clear();
        }
    }
}