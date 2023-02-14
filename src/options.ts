import yargs from 'yargs/yargs'
import { hideBin } from 'yargs/helpers'

const argv = yargs(hideBin(process.argv))
	.option('conventional-commits', {
		alias: 'c',
		type: 'boolean',
		description: 'Use Conventional Commits',
		default: false,
	})
	.option('lite', {
		alias: 'l',
		type: 'boolean',
		description: 'Only print the commit message',
		default: false,
	})
	.option('auto-add-all', {
		alias: 'a',
		type: 'boolean',
		description: 'Automatically add all files to the commit',
		default: false,
	})
	.option('auto-push', {
		alias: 'p',
		type: 'boolean',
		description: 'Automatically push the commit to the remote',
		default: false,
	})
	.option('reverse-proxy-url', {
		alias: 'r',
		type: 'string',
		description: 'Reverse proxy URL',
		default: process.env.AIMMIT_REVERSE_PROXY_URL,
	})
	.option('key', {
		alias: 'k',
		type: 'string',
		description: 'API key',
		default: process.env.AIMMIT_API_KEY,
	})
	.option('verbose', {
		alias: 'v',
		type: 'boolean',
		description: 'Run with verbose logging',
		default: false,
	})
	.parse()

interface Options {
	conventionalCommits: boolean
	lite: boolean
	autoAddAll: boolean
	autoPush: boolean
	reverseProxyUrl: string
	key: string
	verbose: boolean
}

export const getOptions = (): Options => {
	return argv as Options
}
