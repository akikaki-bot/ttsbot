


export class MakeVoiceBuffer {

    private apiKey: string;
    private API_URL = "https://deprecatedapis.tts.quest/";

    private CACHE_buffer : Map<string,Buffer> = new Map();
    //private Queue : string[] = [];

    constructor ( apiKey : string ){
        this.apiKey = apiKey;
        this.CACHE_buffer = new Map();

    }

    public async makeVoiceBuffer( text : string ) : Promise<VoiceBufferResponse> {
        console.log(`[MakeVoiceBuffer] makeVoiceBuffer : ${text}`)
        if( this.CACHE_buffer.has(text) ){
            return { status : 1 , audioBuffer : this.CACHE_buffer.get(text) as Buffer }
        }
        else {
            const buffer = await this.getVoiceBuffer(text);
            if( buffer.status === 1 ){
                this.CACHE_buffer.set(
                    text,
                    buffer.audioBuffer
                );
                return {
                    status : 1,
                    audioBuffer : buffer.audioBuffer
                }
            } else {
                return {
                    status : 0,
                    message : buffer.message
                }
            }
        }
    }

    public async getUsage() : Promise<{ status : 1 , points : number , resetInHours : number }> {
        const response = await fetch(`${this.API_URL}v2/api?key=${this.apiKey}`)
        if( response.ok ){
            console.log(`OK`)
            return await response.json() as {
                status : 1
                points : number,
                resetInHours : number
            };
        }
        else {
            throw new Error("Failed to fetch");
        }
    }

    private async getVoiceBuffer( text : string ) : Promise<VoiceBufferResponse> {
        const response = await fetch(`${this.API_URL}v2/voicevox/audio?text=${text}&key=${this.apiKey}`)
        if(!response.ok) return { status : 0 , message : JSON.stringify(await response.json()) }
        const buffer = await response.arrayBuffer();
        return { status : 1 , audioBuffer : Buffer.from(buffer) }
    }
}

export type VoiceBufferResponse = VoiceBufferSuccessResponse | VoiceBufferErrorResponse;

export interface VoiceBufferSuccessResponse {
    status : 1,
    audioBuffer : Buffer
}

export interface VoiceBufferErrorResponse {
    status : 0,
    message : string
}