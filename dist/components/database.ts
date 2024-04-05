import * as Keyv from "keyv";

export class GuildAutoConnectChannelDatabase {

    private db: Keyv

    constructor() {
        this.db = new Keyv("sqlite://database/autoconnect.db");
    }

    async saveAutoConnectChannel(guildId: string, channelId: string, textChannelId: string) {
        await this.db.set(guildId, JSON.stringify({ channelId: channelId , textChannelId: textChannelId }));
    }

    async getAutoConnectChannel(guildId: string): Promise< { channelId : string , textChannelId : string } | undefined> {
        const value = await this.db.get(guildId);
        if (value) {
            return JSON.parse(value) as { channelId : string , textChannelId : string };
        }
        return undefined;
    }

    async deleteAutoConnectChannel(guildId: string) {
        await this.db.delete(guildId);
    }

}

export class UserDatabase {

    private db: Keyv

    constructor() {
        this.db = new Keyv("sqlite://database/user.db");
    }

    async saveSpeaker(userId: string, speakerId: string) {
        await this.db.set(userId, speakerId);
    }

    async getSpeaker(userId: string): Promise<string | undefined> {
        const value = await this.db.get(userId);
        if (value) {
            return value;
        }
        return "3"
    }

    async deleteSpeaker(userId: string) {
        await this.db.delete(userId);
    }

    async resetSpeaker(userId: string) {
        await this.db.set(userId, "3")
    }
}

export class DictionaryDatabase {

    private db: Keyv

    constructor() {
        this.db = new Keyv("sqlite://database/dictionary.db");
    }

    async saveDictionary(guildId: string, word: string, pronunciation: string) {
        if (word === ",0,0,") word = "00"
        const data = {
            word: word,
            pronunciation: pronunciation
        }
        const oldData = await this.db.get(guildId);
        if (oldData) {
            const add = oldData.split(',0,0,') as string[];
            add.push(JSON.stringify(data));
            await this.db.set(guildId, add.join(',0,0,'));
        }
        else {
            await this.db.set(guildId, [JSON.stringify(data)].join(',0,0,'));
        }
    }

    async getDictionary(guildId: string): Promise<{ word: string, pronunciation: string }[] | undefined> {
        const value = await this.db.get(guildId) as string;
        console.log(value)
        if (value) {
            const split = value.split(',0,0,') as string[];
            console.log(split)
            return split.map(data => JSON.parse(data));
        }
        return undefined;
    }

    async deleteDictionary(guildId: string, word: string) {
        const oldData = await this.db.get(guildId);
        if (oldData) {
            const add = oldData.split(',0,0,') as { word: string, pronunciation: string }[];
            const newData = add.filter(data => data.word !== word);
            if (newData.length === 0) {
                await this.db.delete(guildId);
            }
            else await this.db.set(guildId, newData.join(',0,0,'));
            return 0
        }
        else {
            return -1;
        }
    }
}