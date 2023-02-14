// @ts-ignore
import { ChatGPTClient } from '@waylaidwanderer/chatgpt-api'
import consola from 'consola'
// @ts-ignore
import inquirer from 'inquirer'
import { getOptions } from './options'
import boxen from 'boxen'

export const getChatGptResponse = async (diff: string) => {
	const { conventionalCommits, emoji, lite } = getOptions()

	const prompt = `I want you to act like a git commit message writer.
I will input a git diff and your job is to convert it into a useful commit message.
Return nothing else but only ONE commit message without quotes or backticks.
Return a short, concise, present-tense, complete sentence.
The length of message should be fewer than 50 characters if possible.
${
	conventionalCommits
		? 'The commit message should follow the conventional commits. The format is <type>[optional scope]: <description>. A type can be one of the following: build, chore, ci, docs, feat, fix, perf, refactor, revert, style, or test.'
		: ''
}
${
	emoji
		? 'The commit message should include an emoji. The emoji should be the first character of the message.'
		: ''
}
The diffs are below:

\`\`\`diff
${diff}
\`\`\
`

	if (!lite) {
		consola.info('Generating commit message with AI...')
	}

	let breakLoop = false

	let message: string = ''
	while (!breakLoop) {
		message = await generateMessage(prompt)

		if (lite) {
			break
		}

		consola.success(
			boxen(message, { padding: 1, margin: 1, title: 'AI Commit Message' }),
		)

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
				consola.info('Generating commit message with AI...')
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

const generateMessage = async (diff: string): Promise<string> => {
	const payload = {
		model: 'text-davinci-003',
		prompt: diff,
		temperature: 0.7,
		top_p: 1,
		frequency_penalty: 0,
		presence_penalty: 0,
		max_tokens: 200,
		stream: false,
		n: 1,
	}

	const { reverseProxyUrl, key, lite } = getOptions()
	let url = reverseProxyUrl ?? 'https://api.openai.com/v1/completions'
	if (!reverseProxyUrl && !key && !lite) {
		consola.warn(
			'No API key found. Please set the AIMMIT_API_KEY environment variable. A fallback to the free reverse proxy will be used.',
		)
		url = 'https://gpt.song.work/aimmit'
	}

	const response = await fetch(url, {
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${key ?? ''}`,
		},
		method: 'POST',
		body: JSON.stringify(payload),
	})

	if (!response.ok) {
		consola.error(
			'Error while communicating with the AI. Please report this issue on https://github.com/Songkeys/aimmit/issues',
			{ response: await response.text() },
		)
		process.exit(1)
	}

	const json: any = await response.json()

	const aiCommit = json.choices[0].text

	return aiCommit.replace(/(\r\n|\n|\r)/gm, '')
}
