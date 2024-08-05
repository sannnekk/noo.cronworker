import { DBConnection } from '@modules/Core/DB/DBConnection'

function getAnswerText(answer: any): string {
  switch (answer.type) {
    case 'text':
      return `"${answer.text}"`
    case 'number':
      return `"${answer.number}"`
    case 'date':
      return `"${answer.date}"`
    case 'choice':
      return `"${answer.choices}"`
    case 'rating':
      return `"${answer.rating}"`
    case 'file':
      return `"${process.env.CDN_URL + answer.src}"`
    default:
      return '-'
  }
}

export async function getPollData(
  connection: DBConnection,
  binding: any
): Promise<string> {
  const selector = JSON.parse(binding.entity_selector)
  //const selectorProp: string = selector.prop
  const selectorValue: string = selector.value

  const poll = await connection.query(
    `SELECT * FROM poll WHERE id = '${selectorValue}' LIMIT 1`
  )
  const pollQuestions = await connection.query(
    `SELECT * FROM poll_question WHERE pollId = '${selectorValue}' ORDER BY 'order' ASC`
  )

  const pollAnswers = await connection.query(
    `SELECT 
    poll_answer.user_auth_identifier as user_auth_identifier,
    poll_answer.question_type as type,
    poll_answer.questionId as questionId,
    poll_question.order as questionOrder,
    poll_answer.text as text,
    poll_answer.number as number,
    poll_answer.date as date,
    poll_answer.choices as choices,
    poll_answer.rating as rating,
    media.src as src
   FROM poll_answer 
	 LEFT JOIN poll_question ON poll_question.id = poll_answer.questionId 
	 LEFT JOIN media ON media.pollAnswerId = poll_answer.id
	 WHERE poll_question.pollId = '${selectorValue}'`
  )

  const title = poll.at(0).title as string
  const head = pollQuestions
    .sort((q1: any, q2: any) => {
      return parseInt(q1.order) - parseInt(q2.order)
    })
    .map(
      (question: any) =>
        `"${question.text}, ${question.description.replaceAll('\n', ' ')}"`
    )
  const answerRows = {} as Record<string, Record<string, string>>

  for (const answer of pollAnswers) {
    const identifier = answer.user_auth_identifier
    const questionId = answer.questionId
    const order = answer.questionOrder

    if (!answerRows[identifier]) {
      answerRows[identifier] = {}
    }

    answerRows[identifier][`${order}-${questionId}`] = getAnswerText(answer)
  }

  //writeFileSync('tmp.json', JSON.stringify(answerRows, null, 2))

  let data = ''

  for (const [identifier, answers] of Object.entries(answerRows)) {
    const sortedAnswers = Object.keys(answers)
      .sort()
      .map((key) => answers[key])

    data += `${sortedAnswers.join(',')},,${identifier}\n`
  }

  return `
	${title.replaceAll('\n', ' ')},
	${head.join(',')},
	${data},
	`
}
