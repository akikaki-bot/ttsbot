import { ActionRowBuilder, CommandInteraction, Embed, EmbedBuilder, Interaction, StringSelectMenuBuilder, StringSelectMenuInteraction } from "discord.js";
import { VoiceVoxSpeakers } from "../constants/spakers";
import { ResolveStringSelectMenuBuilder } from "./resolveComponent";
import { UserDatabase } from "./database";

const db = new UserDatabase()

export class SelectSpeaker {

    /**
     * CommandInteraction
     * @param {CommandInteraction} interaction 
     */
    public async firstReply( interaction : CommandInteraction ){
        if( interaction.isCommand() ){
            const embed = new EmbedBuilder().setTitle('話者選択').setDescription('話者を選択してください。');
            const ActionRow = this.buildSpeakerList();
            await interaction.reply({ embeds : [embed] , components : [ActionRow] , ephemeral : true });
        }
    }

    /**
     * CustomId : select.speaker
     * @param {StringSelectMenuInteraction} interaction 
     */
    public async selectSpeaker( interaction : StringSelectMenuInteraction ){
        if( interaction.isStringSelectMenu() ){
            const speaker = interaction.values[0];
            const embed = new EmbedBuilder().setTitle('感情選択').setDescription('感情を選択してください。');
            const OlderActionRow = new ResolveStringSelectMenuBuilder().resolveStringSelect('select.speaker' , interaction.component.options )
            const ActionRow = this.buildEmotionListFromSpeakerName( speaker );
            await interaction.update({ embeds : [embed] , components : [OlderActionRow , ActionRow] });
        }
    }

    /**
     * CustomId : select.emotion
     * @param {StringSelectMenuInteraction} interaction 
     */
    public async setEmotion( interaction : StringSelectMenuInteraction ){
        if( interaction.isStringSelectMenu() ){
            const emotion = interaction.values[0];
            const setting = VoiceVoxSpeakers.find( speaker => speaker.styles.some( style => style.id.toString() === emotion ));
            const embed = new EmbedBuilder().setTitle('設定が完了しました。').setDescription(`話者 : ${setting.name}\n 感情 : ${setting.styles.find( style => style.id.toString() === emotion )?.name}\n に設定しました。`);
            await db.saveSpeaker( interaction.user.id , emotion.toString() );
            await interaction.update({ embeds : [embed] , components : [] });
        }
    }

    private buildSpeakerList() : ActionRowBuilder<StringSelectMenuBuilder> {
        const Speakers = VoiceVoxSpeakers.map( speaker => ({ label : speaker.name , value : speaker.name }));
        const SelectMenu = new StringSelectMenuBuilder()
            .setCustomId('select.speaker')
            .setPlaceholder('スピーカーを選択してください。')
            .addOptions(Speakers);

        const ActionRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(SelectMenu);
        return ActionRow
    }

    private buildEmotionListFromSpeakerName( name : string ) : ActionRowBuilder<StringSelectMenuBuilder> {
        const Emotions = VoiceVoxSpeakers.find( speaker => speaker.name === name )
        if( typeof Emotions === "undefined" ) {
            const SelectMenu = new StringSelectMenuBuilder().setDisabled(true).setPlaceholder('不明な話者です。');
            const ActionRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(SelectMenu);
            return ActionRow
        }

        const Emotion = Emotions.styles.map( emotion => ({ label : emotion.name , value : emotion.id.toString() }));
        const SelectMenu = new StringSelectMenuBuilder()
            .setCustomId('select.emotion')
            .setPlaceholder('表情を選択してください。')
            .addOptions(Emotion);
            

        const ActionRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(SelectMenu);
        return ActionRow
    }
}