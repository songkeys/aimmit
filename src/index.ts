import { checkIsGitRepo, commit, getDiff, push } from './git'
import { getChatGptResponse } from './gpt'

const main = async () => {
	checkIsGitRepo()
	const diff = getDiff()
	const message = await getChatGptResponse(diff)
	commit(message)
	push()
}

main().catch((e) => {
	console.error(e)
})
