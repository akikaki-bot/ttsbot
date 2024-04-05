import { APISelectMenuOption, ActionRowBuilder , StringSelectMenuBuilder } from "discord.js";



export class ResolveStringSelectMenuBuilder {
    
    constructor(){}
    
    public resolveStringSelect( customId : string , APIOption : APISelectMenuOption[] ){
        return new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(
            new StringSelectMenuBuilder().setCustomId(customId).setOptions(
                ...APIOption
            )
        )
    }
}

