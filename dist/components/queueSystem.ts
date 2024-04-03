

export class QueueSystem {

    private queue : { guildId : string , queue : Map<string,string> }[] = [];

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

    public addQueue( queueText : string , guildId : string ) : void {
        const queue = this.queue.find( q => q.guildId === guildId );
        if( queue ){
            queue.queue.set(queueText,queueText);
        } else {
            this.queue.push({
                guildId : guildId,
                queue : new Map([[queueText,queueText]])
            });
        }
    }

    public getFirstQueue( guildId : string ) : string | undefined {
        const queue = this.queue.find( q => q.guildId === guildId );
        if( queue ){
            if(typeof queue.queue.entries().next().value === "undefined") return;
            return queue.queue.entries().next().value[0];
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