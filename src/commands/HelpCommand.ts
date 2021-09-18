import { Message, MessageEmbed } from 'discord.js';
import PrefixCommand from './PrefixCommand';
import BotConfig from '../BotConfig';

export default class HelpCommand extends PrefixCommand {
	public readonly aliases = ['help'];

	public async run( message: Message ): Promise<boolean> {
		try {
			const embed = new MessageEmbed();
			embed.setTitle( '<:mojira:821162280905211964> **MojiraBot help** <:mojira:821162280905211964>' )
				.setDescription(
					`This is a bot that links to a Mojira ticket when its ticket number is mentioned.
					Currently, the following projects are supported: ${ BotConfig.projects.join( ', ' ) }
					To prevent the bot from linking a ticket, preface the ticket number with an exclamation mark.`.replace( /\t/g, '' ) )
				.addField( 'Important notice',
					`This is a fork of the Mojira Discord bot (<https://github.com/mojira/mojira-discord-bot>). You can find the Mojira Discord at <https://discord.gg/rpCyfKV>.
					The original bot is only used in the Mojira Discord, and contains things that aren't relevant to other servers. This fork keeps the main point of linking Mojira tickets easily on Discord, but takes away the parts that aren't relevant.
					This fork can be found here: <https://github.com/UserTeemu/mojira-discord-bot>.`
				).addField( 'Bot Commands',
					`\`!jira help\` - Sends this message.
					
					\`!jira ping\` - Sends a message to check if the bot is running.
					
					\`!jira search <text>\` - Searches for text and returns the results from the bug tracker.`
				)
				.setFooter( message.author.tag, message.author.avatarURL() );
			await message.channel.send( embed );
		} catch {
			return false;
		}

		if ( message.deletable ) {
			try {
				await message.delete();
			} catch {
				return true;
			}
		}

		return true;
	}

	public asString(): string {
		return '!jira help';
	}
}
