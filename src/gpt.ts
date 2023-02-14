// @ts-ignore
import { ChatGPTClient } from '@waylaidwanderer/chatgpt-api'
import consola from 'consola'
// @ts-ignore
import inquirer from 'inquirer'
import { getOptions } from './options'

export const getChatGptResponse = async (diff: string) => {
	const { conventionalCommits, lite } = getOptions()

	let prompt = `I want you to act like a git commit message writer.
I will input a git diff and your job is to convert it into a useful commit message.
Return nothing else but only the commit message without quotes.
Return a short, concise, present-tense complete sentence, with fewer than 50 characters the better.
${
	conventionalCommits
		? 'The commit message should follow the conventional commits. E.g. feat: allow provided config object to extend other configs; fix: prevent racing of requests'
		: ''
}
The diffs are below: \n\n`

	prompt += diff

	if (!lite) {
		consola.info('Generating commit message with AI...')
	}

	let breakLoop = false

	let res: Awaited<ReturnType<typeof generateMessage>> | undefined
	let message: string = ''
	while (!breakLoop) {
		res = await generateMessage(
			res?.conversationId ? 'Regenerate one' : prompt,
			{
				conversationId: res?.conversationId,
				messageId: res?.messageId,
			},
		)

		if (lite) {
			break
		}

		message = res.response.trim()
		console.log('\n')
		consola.success(`AI commit message: \n\n${message}\n`)

		const confirmationMessage = await inquirer.prompt([
			{
				name: 'useCommitMessage',
				message: 'Use this commit message? ([Y]es / [n]o / [r]egenerate)',
				choices: ['Y', 'y', 'R', 'r', 'N', 'n'],
				default: 'y',
			},
		])

		switch (confirmationMessage.useCommitMessage) {
			case 'Y':
			case 'y':
				breakLoop = true
				break
			case 'R':
			case 'r':
				break
			case 'N':
			case 'n':
				process.exit(0)
			default:
				break
		}
	}

	if (lite) {
		console.log(message)
	}

	return message
}

const generateMessage = async (
	diff: string,
	{
		conversationId,
		messageId,
	}: {
		conversationId?: string
		messageId?: string
	} = {},
): Promise<{
	response: string
	conversationId: string
	messageId: string
}> => {
	const cookie = ``

	const clientOptions = {
		reverseProxyUrl: 'https://chatgpt.hato.ai/completions',
		modelOptions: {
			model: 'text-davinci-002-render',
		},
		parentMessageId: messageId,
		conversationId,
		// debug: true,
	}

	const chatGptClient = new ChatGPTClient(cookie, clientOptions)

	const res = await chatGptClient.sendMessage(diff)
	if (!res.response) {
		consola.error(
			'Error while communicating with the AI. Please report this issue on https://github.com/Songkeys/aimmit/issues',
		)
		process.exit(1)
	}

	return res
}
