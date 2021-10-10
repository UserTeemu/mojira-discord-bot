import { Client, Intents } from 'discord.js';
import * as log4js from 'log4js';
import { Client as JiraClient } from 'jira.js';
import BotConfig from './BotConfig';
import ErrorEventHandler from './events/discord/ErrorEventHandler';
import EventRegistry from './events/EventRegistry';
import MessageEventHandler from './events/message/MessageEventHandler';
import FilterFeedTask from './tasks/FilterFeedTask';
import CachedFilterFeedTask from './tasks/CachedFilterFeedTask';
import TaskScheduler from './tasks/TaskScheduler';
import VersionFeedTask from './tasks/VersionFeedTask';
import DiscordUtil from './util/DiscordUtil';
import CustomFeedDatabaseUtil from './util/CustomFeedDatabaseUtil';

/**
 * Core class of MojiraBot
 *
 * @author violine1101
 * @since 2019-12-02
 */
export default class MojiraBot {
	public static logger = log4js.getLogger( 'MojiraBot' );

	public static client: Client = new Client( {
		partials: ['MESSAGE', 'REACTION', 'USER'],
		ws: {
			intents: Intents.NON_PRIVILEGED,
		},
	} );
	private static running = false;

	public static jira = new JiraClient( {
		host: 'https://bugs.mojang.com',
	} );

	public static async start(): Promise<void> {
		if ( this.running ) {
			this.logger.error( 'MojiraBot is still running. You can only start a bot that is not currently running.' );
			return;
		}

		// Ensure graceful shutdown
		process.on( 'SIGTERM', async () => {
			this.logger.info( 'The bot process has been terminated (SIGTERM).' );

			await MojiraBot.shutdown();
		} );

		process.on( 'SIGINT', async () => {
			this.logger.info( 'The bot process has been terminated (SIGINT).' );

			await MojiraBot.shutdown();
		} );

		try {
			const loginResult = await BotConfig.login( this.client );
			if ( !loginResult ) return;

			this.running = true;
			this.logger.info( `MojiraBot has been started successfully. Logged in as ${ this.client.user.tag }` );

			// Connect to database
			await CustomFeedDatabaseUtil.connect();

			// Register events.
			EventRegistry.setClient( this.client );
			EventRegistry.add( new ErrorEventHandler() );
			EventRegistry.add( new MessageEventHandler( this.client.user.id ) );

			// #region Schedule tasks.
			// Filter feed tasks.
			for ( const config of BotConfig.filterFeeds ) {
				if ( config.cached ) {
					TaskScheduler.addTask(
						new CachedFilterFeedTask( config, await DiscordUtil.getChannel( config.channel ) ),
						config.interval
					);
				} else {
					TaskScheduler.addTask(
						new FilterFeedTask( config, await DiscordUtil.getChannel( config.channel ) ),
						config.interval
					);
				}
			}

			// Version feed tasks.
			for ( const config of BotConfig.versionFeeds ) {
				TaskScheduler.addTask(
					new VersionFeedTask( config, await DiscordUtil.getChannel( config.channel ) ),
					config.interval
				);
			}
			// #endregion

			// TODO Change to custom status when discord.js#3552 is merged into current version of package
			try {
				await this.client.user.setActivity( '!jira help' );
			} catch ( error ) {
				MojiraBot.logger.error( error );
			}
		} catch ( err ) {
			this.logger.error( `MojiraBot could not be started: ${ err.stack }` );
			await this.shutdown();
		}
	}

	public static async shutdown(): Promise<void> {
		if ( !this.running ) {
			this.logger.error( 'MojiraBot is not running yet. You can only shut down a running bot.' );
			return;
		}

		this.logger.info( 'Initiating graceful shutdown...' );

		try {
			await CustomFeedDatabaseUtil.disconnect();
			TaskScheduler.clearAll();
			this.client.destroy();
			this.running = false;
			this.logger.info( 'MojiraBot has been successfully shut down.' );

			log4js.shutdown( ( err ) => {
				if ( err ) {
					console.log( err );
				}
				process.exit();
			} );
		} catch ( err ) {
			this.logger.error( `MojiraBot could not be shut down: ${ err }` );
		}
	}
}
