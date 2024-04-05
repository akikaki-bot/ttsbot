import { SlashCommandBuilder } from "discord.js";


export const CommandList = [
    new SlashCommandBuilder().setName('join').setDescription('TTS機能を有効にします。'),
    new SlashCommandBuilder().setName('leave').setDescription('TTS機能を無効にします。'),
    new SlashCommandBuilder().setName('forceshift').setDescription('キューを強制的に進めます。'),
    new SlashCommandBuilder().setName('speaker').setDescription('話者を選択します。'),
    new SlashCommandBuilder().setName('dictionary').setDescription('辞書を追加します。')
    .addStringOption(
        option => option.setName('word').setDescription('追加する単語').setRequired(true)
    ).addStringOption(
        option => option.setName('pronunciation').setDescription('発音').setRequired(true)
    ),
    new SlashCommandBuilder().setName('dictionary_delete').setDescription('辞書を削除します。')
    .addStringOption(
        option => option.setName('word').setDescription('削除する単語').setRequired(true)
    ),
    new SlashCommandBuilder().setName('dictionary_list').setDescription('辞書を表示します。'),
    new SlashCommandBuilder().setName('auto_connect').setDescription('設定したボイスチャンネルに自動接続します。')
    .addChannelOption(
        option => option.setName('channel').setDescription('ボイスチャンネル').setRequired(true)
    )
    .addChannelOption(
        option => option.setName('textchannel').setDescription('テキストチャンネル').setRequired(true)
    )
] as const;
