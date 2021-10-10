import { Snowflake } from 'discord.js';
import { Client as PostgresClient, QueryResult, QueryResultRow } from 'pg';
import BotConfig from '../BotConfig';
import * as log4js from 'log4js';

export default class CustomFeedDatabaseUtil {
	private static logger = log4js.getLogger( 'Database' );
	private static client: PostgresClient | null = null;

	public static async connect(): Promise<void> {
		this.client = new PostgresClient( BotConfig.databaseConfig );
		return await this.client.connect().catch( ( err ) => {
			this.logger.warn( 'Error connecting to database.', err );
		} );
	}

	public static async disconnect(): Promise<void> {
		if ( this.client != null ) {
			return await this.client.end();
		}
	}

	public static async addFeed( table: FeedTables, channel: Snowflake, filterID: number ): Promise<boolean> {
		if ( this.client == null ) return false;
		return await this.client.query( `INSERT INTO ${ table } (channel, filter_id) VALUES ($1, $2)`, [channel, filterID] )
			.then(
				() => {
					return true;
				}, ( err ) => {
					this.logger.warn( `Error adding feed for channel ${ channel } to database (table: ${ table }). Filter: ${ filterID }`, err );
					return false;
				}
			);
	}

	public static async deleteFeed<R extends QueryResultRow>( table: FeedTables, channel: Snowflake, id: number ): Promise<QueryResult<R> | null> {
		if ( this.client == null ) return null;
		return await this.client.query( `DELETE FROM ${ table } WHERE id=$1 AND channel=$2 RETURNING id, channel, filter_id`, [id, channel] )
			.catch( ( err ) => {
				this.logger.warn( `Error deleting feed (id: ${ id }, channel: ${ channel }, table: ${ table }) from database.`, err );
				return null;
			} );
	}

	public static async getChannelFeeds<R extends QueryResultRow>( table: FeedTables, channel: Snowflake ): Promise<QueryResult<R> | null> {
		if ( this.client == null ) return null;
		return await this.client.query( `SELECT id, channel, filter_id FROM ${ table } WHERE channel=$1`, [channel] )
			.catch( ( err ) => {
				this.logger.warn( `Error getting feeds (table: ${ table }) of channel (${ channel }) from database.`, err );
				return null;
			} );
	}

	public static async getFeeds<R extends QueryResultRow>( table: FeedTables ): Promise<QueryResult<R> | null> {
		if ( this.client == null ) return null;
		return await this.client.query( `SELECT id, channel, filter_id FROM ${ table }` )
			.catch( ( err ) => {
				this.logger.warn( `Error getting feeds (table: ${ table }) from database.`, err );
				return null;
			} );
	}

	public static resultAsString<R extends QueryResultRow>( result: QueryResult<R> ): string {
		const fieldNames = result.fields.map( ( field ) => field.name );
		const rows = result.rows.map( ( row ) => {
			const array = [];
			fieldNames.forEach( ( fieldName ) => array.push( row[fieldName] ) );
			return array.join( '\t' );
		} );

		if ( rows.length < 1 ) {
			rows.push( 'No rows to be displayed.' );
		}

		return 'Headers: ' + fieldNames.join( '\t' ) + '\nData:\n' + rows.join( '\n' );
	}
}

export enum FeedTables {
	Bug = 'feeds.bug'
}