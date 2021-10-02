import { Client } from 'discord.js';
import config from 'config';
import MojiraBot from './MojiraBot';
import { VersionChangeType } from './tasks/VersionFeedTask';
import { ClientConfig } from 'pg';

function getOrDefault<T>( configPath: string, defaultValue: T ): T {
	if ( !config.has( configPath ) ) MojiraBot.logger.debug( `config ${ configPath } not set, assuming default` );
	return config.has( configPath ) ? config.get( configPath ) : defaultValue;
}

export interface RoleConfig {
	emoji: string;
	title: string;
	desc?: string;
	id: string;
}

export interface RoleGroupConfig {
	roles: RoleConfig[];
	prompt: string;
	desc?: string;
	color: string;
	channel: string;
	message?: string;
	radio?: boolean;
}

export interface FilterFeedConfig {
	jql: string;
	channel: string;
	interval: number;
	filterFeedEmoji: string;
	title: string;
	titleSingle?: string;
	publish?: boolean;
}

export interface VersionFeedConfig {
	projects: string[];
	channel: string;
	interval: number;
	versionFeedEmoji: string;
	scope: number;
	actions: VersionChangeType[];
	publish?: boolean;
}

export default class BotConfig {
	public static debug: boolean;
	public static logDirectory: false | string;

	// TODO: make private again when /crosspost api endpoint is implemented into discord.js
	public static token: string;
	public static owners: string[];

	public static ticketUrlsCauseEmbed: boolean;
	public static quotedTicketsCauseEmbed: boolean;
	public static requiredTicketPrefix: string;
	public static forbiddenTicketPrefix: string;

	public static embedDeletionEmoji: string;

	public static maxSearchResults: number;

	public static projects: string[];

	public static filterFeeds: FilterFeedConfig[];
	public static versionFeeds: VersionFeedConfig[];

	// Custom feeds
	public static databaseConfig: ClientConfig;

	public static init(): void {
		this.debug = getOrDefault( 'debug', false );
		this.logDirectory = getOrDefault( 'logDirectory', false );

		this.token = config.get( 'token' );
		this.owners = getOrDefault( 'owners', [] );

		this.ticketUrlsCauseEmbed = getOrDefault( 'ticketUrlsCauseEmbed', false );
		this.quotedTicketsCauseEmbed = getOrDefault( 'quotedTicketsCauseEmbed', false );

		this.forbiddenTicketPrefix = getOrDefault( 'forbiddenTicketPrefix', '' );
		this.requiredTicketPrefix = getOrDefault( 'requiredTicketPrefix', '' );

		this.embedDeletionEmoji = getOrDefault( 'embedDeletionEmoji', '' );

		this.maxSearchResults = config.get( 'maxSearchResults' );

		this.projects = config.get( 'projects' );

		this.filterFeeds = config.get( 'filterFeeds' );
		this.versionFeeds = config.get( 'versionFeeds' );

		this.databaseConfig = config.get( 'databaseConfig' );
	}

	public static async login( client: Client ): Promise<boolean> {
		try {
			await client.login( this.token );
		} catch ( err ) {
			MojiraBot.logger.error( err );
			return false;
		}
		return true;
	}
}
