import { Message, MessageEmbed } from 'discord.js';
import PermissionRegistry from '../permissions/PermissionRegistry';
import PrefixCommand from './PrefixCommand';
import MojiraBot from '../MojiraBot';
import CustomFeedDatabaseUtil, { FeedTables } from '../util/CustomFeedDatabaseUtil';
import { URL } from 'url';
import { assert } from 'console';

export default class CustomFeedCommand extends PrefixCommand {
	public readonly aliases = ['feed'];

	public async run( message: Message, input: string ): Promise<boolean> {
		const mode = ( input.indexOf( " " ) == -1 ? input : input.substring( 0, input.indexOf( " " ) ) ).trim();
		const args = ( input.indexOf( " " ) == -1 ? "" : input.substring( input.indexOf( " " ) + 1 ) ).trim();

		if ( mode == "add" ) {
			if ( !this.checkModPermission( message ) ) return false;

			const embed = new MessageEmbed().setTitle( "Custom feed" ).setFooter( message.author.tag, message.author.avatarURL() );

			var filterID = undefined;

			// try parsing the filter id directly
			try {
				const int = parseInt( args );
				if ( Number.isSafeInteger( int ) ) {
					filterID = int;
				}
			} catch ( _err ) {}

			// try parsing from URL
			if (filterID === null || filterID === undefined) {
				try {
					const url = new URL(args);
					if ( url.host == "bugs.mojang.com" && (url.pathname == "/issues" || url.pathname.startsWith( "/issues/" )) && url.searchParams.has( "filter" ) ) {
						const int = parseInt( url.searchParams.get("filter") );
						if ( Number.isSafeInteger( int ) ) {
							filterID = int;
						}
					}
				} catch ( _err ) {}
			}

			// send error if filter ID was't parsed
			if (filterID === null || filterID === undefined) {
				await message.channel.send( embed.setDescription( "Argument is not a filter id or a Mojira URL containing one." ) );
				return false;
			}

			var filterName: String;

			try {
				const filterData = await MojiraBot.jira.filters.getFilter( { id: filterID } );
				filterID = filterData.id;
				filterName = filterData.name;
				assert( filterID !== null && filterID !== undefined && filterName !== null && filterName !== undefined );
			} catch ( err ) {
				await message.channel.send( embed.setDescription( "Seems like a filter with the specified ID doesn't exist. Is it publicly viewable? " ).addField( "Error", err ) );
				return false;
			}

			// if this point is reached, it is safe to assume that the filter ID is valid

			var success = await CustomFeedDatabaseUtil.addFeed( FeedTables.Bug, message.channel.id, filterID );
			if ( success == false ) {
				await message.channel.send( embed.setDescription( "Encountered unexpected error while saving to database." ) );
				return false;
			}

			await message.channel.send( embed.setDescription( `Successfully subscribed to filter [${ filterName }](https://bugs.mojang.com/issues/?filter=${ filterID })` ) );
			return true;
		} else if ( mode == "remove" ) {
			if ( !this.checkModPermission( message ) ) return false;

			const id = parseInt( args )
			if (isNaN(id)) {
				await message.channel.send( `Provided feed ID is not valid` )
				return false;
			}

			var result = await CustomFeedDatabaseUtil.deleteFeed( FeedTables.Bug, message.channel.id, id );
			if (result == null) {
				await message.channel.send( "Encountered unexpected error while performing database query." );
				return false;
			}

			await message.channel.send( CustomFeedDatabaseUtil.resultAsString( result ) );
			return true;
		} else if ( mode == "globallist" && PermissionRegistry.OWNER_PERMISSION.checkPermission( message.member ) ) {
			var result = await CustomFeedDatabaseUtil.getFeeds( FeedTables.Bug );
			if (result == null) {
				await message.channel.send( "Encountered unexpected error while performing database query." );
				return false;
			}
			
			await message.channel.send( CustomFeedDatabaseUtil.resultAsString( result ) );
			return true;
		} else if ( mode == "list" ) {
			var result = await CustomFeedDatabaseUtil.getChannelFeeds( FeedTables.Bug, message.channel.id );
			if (result == null) {
				await message.channel.send( "Encountered unexpected error while performing database query." );
				return false;
			}

			var rows = result.rows;

			if (rows.length < 1) {
				await message.channel.send( "No custom feeds for this channel were found." );
			} else {
				await message.channel.send( CustomFeedDatabaseUtil.resultAsString( result ) );
			}

			return true;
		} else if ( mode == "help" ) {
			const embed = new MessageEmbed()
				.setTitle( 'Custom feeds - Help' )
				.setDescription(
					"Custom feeds notify you when new interesting bugs appear! As the name suggests, custom feeds are customizable! Simply specify a search filter ID for Mojira, and we will notify you when there are any matching results. If you need help with filters, use the \`!jira feed filterhelp\` command Currently, custom feeds are channel-specific."
				).addField( "Commands",
					`\`!jira feed help\` - View help for custom feeds. (You're reading it right now!)

					\`!jira feed filterhelp\` - View help for creating a filter in Minecraft bug tracker (AKA Mojira)
					
					\`!jira feed list\` - Get all custom feeds for the current channel.

					\`!jira feed add <filter>\` - Subscribes the current channel for updates for the given filter. The filter may be provided as a filter ID (e.g. 12345) or an URL (e.g. https://bugs.mojang.com/issues/?filter=12345). This command requires you to have permission to manage messages in this server, not just this channel.
					
					\`!jira feed remove <id>\` - Removes a custom feed using its ID, which can be obtained using the list command. This command requires you to have permission to manage messages in this server, not just this channel.`
				)
				.setFooter( message.author.tag, message.author.avatarURL() );
			await message.channel.send( embed );

			return true;
		} else if ( mode == "filterhelp" ) {
			const embed = new MessageEmbed()
				.setTitle( 'How to create a publicly viewable feed in Minecraft bug tracker' )
				.setDescription(
					`The custom feeds feature of this bot uses Jira filters to get new issues. Here's some instructions to help you set up one.
					Disclaimer: The user interface of Mojira may have changed after these instructions were written.`
				).addField( "Video guide",
					"https://youtu.be/ponpfTHg38A"
				).addField( "How to create a search filter",
					`1. Log into your Mojira account (and create one if you don't already have it).
					2. Search for issues with the desired JQL (the search query you wish to use for the filter).
					3. Press the "Save as" button above the search box. Next save the search as a filter.`
				).addField( "Set a filter viewable by anyone (including MojiraBot)",
					`1. Go to Issues -> Manage Filters, and edit your filter. (Gear icon -> Edit)
					2. Under "Add viewers", select "Anyone on the web", and press the "Add" button to confirm giving everyone (including MojiraBot) permission to view the filter.
					3. Press "Save".`
				)
				.setFooter( message.author.tag, message.author.avatarURL() );
			await message.channel.send( embed );

			return true;
		} else {
			await message.channel.send( "Invalid command! Use \`!jira feed help\` for help with custom feeds." );
			return false;
		}
	}

	public asString( args: string ): string {
		return '!jira feed ' + args;
	}

	private checkModPermission(message: Message): Boolean {
		if (PermissionRegistry.MODERATOR_PERMISSION.checkPermission(message.member)) {
			return true;
		} else {
			message.channel.send( "You don't have sufficient permissions (manage messages) to do this!" );
			return false;
		}
	}
}