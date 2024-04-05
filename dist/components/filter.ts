import { DictionaryDatabase } from "./database";

const dictionaryDB = new DictionaryDatabase();

export async function messageContentFilter( guildId : string , messageContent : string ){
    const DiscordEmojiRegix = /\:[a-z]+\:[0-9]+/g
    const URLRegix = /https?:\/\/[\w!?/+\-_~;.,*&@#$%()'[\]]+/g
    const DiscordUniqueId = /[0-9]{18}/g

    if( messageContent.startsWith(";")) return;

    if( messageContent.indexOf("```") !== -1 ){
        messageContent.slice( messageContent.indexOf("```") + 3 , messageContent.lastIndexOf("```") );
    }

    const dictionary = await dictionaryDB.getDictionary( guildId as string );

    if( typeof dictionary !== "undefined" ){
        dictionary.map( d => {
            const regix = new RegExp(d.word, "g");
            messageContent = messageContent.replace(regix, d.pronunciation);
        })
    }

    if(messageContent.length > 100){
        messageContent = messageContent.substring(0, 100)+"いかりゃく";
    }

    messageContent = messageContent
                                    //.replace(EmojiRegix , "絵文字")
                                    .replace(DiscordEmojiRegix, "絵文字")
                                    .replace(URLRegix, "URL")
                                    //.replace(DiscordUniqueId , "あいでぃー")

    return messageContent;
}