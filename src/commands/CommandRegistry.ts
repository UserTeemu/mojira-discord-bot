import BugCommand from './BugCommand';
import CustomFeedCommand from './CustomFeedCommand';
import HelpCommand from './HelpCommand';
import PingCommand from './PingCommand';
import MooCommand from './MooCommand';
import MentionCommand from './MentionCommand';
import SearchCommand from './SearchCommand';
import ShutdownCommand from './ShutdownCommand';

export default class CommandRegistry {
	public static BUG_COMMAND = new BugCommand();
	public static CUSTOM_FEED_COMMAND = new CustomFeedCommand();
	public static HELP_COMMAND = new HelpCommand();
	public static MENTION_COMMAND = new MentionCommand();
	public static MOO_COMMAND = new MooCommand();
	public static PING_COMMAND = new PingCommand();
	public static SEARCH_COMMAND = new SearchCommand();
	public static SHUTDOWN_COMMAND = new ShutdownCommand();
}
