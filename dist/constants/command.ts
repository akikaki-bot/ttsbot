import { SlashCommandBuilder } from "discord.js";


export const CommandList : SlashCommandBuilder[] = [
    new SlashCommandBuilder().setName('join').setDescription('TTS機能を有効にします。'),
    new SlashCommandBuilder().setName('leave').setDescription('TTS機能を無効にします。'),
    new SlashCommandBuilder().setName('forceshift').setDescription('キューを強制的に進めます。'),
    new SlashCommandBuilder().setName('speaker').setDescription('話者を選択します。'),
] as const;
