import BugCommand from './BugCommand';
import HelpCommand from './HelpCommand';
import PingCommand from './PingCommand';
import MooCommand from './MooCommand';
import MentionCommand from './MentionCommand';
import SendCommand from './SendCommand';
import SearchCommand from './SearchCommand';
import ShutdownCommand from './ShutdownCommand';

export default class CommandRegistry {
	public static BUG_COMMAND = new BugCommand();
	public static HELP_COMMAND = new HelpCommand();
	public static MENTION_COMMAND = new MentionCommand();
	public static MOO_COMMAND = new MooCommand();
	public static PING_COMMAND = new PingCommand();
	public static SEND_COMMAND = new SendCommand();
	public static SEARCH_COMMAND = new SearchCommand();
	public static SHUTDOWN_COMMAND = new ShutdownCommand();
}
