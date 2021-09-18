import { Message } from 'discord.js';
import BotConfig from '../../BotConfig';
import CommandExecutor from '../../commands/CommandExecutor';
import DiscordUtil from '../../util/DiscordUtil';
import EventHandler from '../EventHandler';

export default class MessageEventHandler implements EventHandler<'message'> {
	public readonly eventName = 'message';

	private readonly botUserId: string;

	constructor( botUserId: string ) {
		this.botUserId = botUserId;
	}

	// This syntax is used to ensure that `this` refers to the `MessageEventHandler` object
	public onEvent = async ( message: Message ): Promise<void> => {
		message = await DiscordUtil.fetchMessage( message );

		if (
			// Don't reply to webhooks
			message.webhookID

			// Don't reply to own messages
			|| message.author.id === this.botUserId

			// Don't reply to non-default messages
			|| message.type !== 'DEFAULT'
		) return;

		await CommandExecutor.checkCommands( message );
	};
}