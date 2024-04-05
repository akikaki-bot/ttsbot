import * as Keyv from "keyv";


export class UserDatabase {

    private db : Keyv

    constructor(){
        this.db = new Keyv("sqlite://database/user.db");
    }

    async saveSpeaker( userId : string , speakerId : string ){
        await this.db.set(userId, speakerId);
    }

    async getSpeaker( userId : string ) : Promise<string | undefined>{
        const value = await this.db.get(userId);
        if( value ){
            return value;
        }
        return "3"
    }

    async deleteSpeaker( userId : string ){
        await this.db.delete(userId);
    }

    async resetSpeaker( userId : string ){
        await this.db.set( userId , "3")
    }
}