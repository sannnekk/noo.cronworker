function getAnswerText(answer) {
    switch (answer.type) {
        case 'text':
            return answer.text;
        case 'number':
            return answer.number;
        case 'date':
            return answer.date;
        case 'choice':
            return answer.choices;
        case 'rating':
            return answer.rating;
        case 'file':
            return process.env.CDN_URL + answer.src;
        default:
            return '-';
    }
}
export async function getPollData(connection, binding) {
    const selector = JSON.parse(binding.entity_selector);
    //const selectorProp: string = selector.prop
    const selectorValue = selector.value;
    const poll = await connection.query(`SELECT * FROM poll WHERE id = '${selectorValue}' LIMIT 1`);
    const pollQuestions = await connection.query(`SELECT * FROM poll_question WHERE pollId = '${selectorValue}' ORDER BY 'order' ASC`);
    const pollAnswers = await connection.query(`SELECT * FROM poll_answer 
	 LEFT JOIN poll_question ON poll_question.id = poll_answer.questionId 
	 LEFT JOIN media ON media.pollAnswerId = poll_answer.id
	 WHERE poll_question.pollId = '${selectorValue}'`);
    const title = poll.at(0).title;
    const head = pollQuestions.map((question) => question.text);
    const answerRows = {};
    for (const answer of pollAnswers) {
        const identifier = answer.user_auth_identifier;
        const questionId = answer.questionId;
        if (!answerRows[identifier]) {
            answerRows[identifier] = {
                [questionId]: getAnswerText(answer),
            };
        }
        else {
            answerRows[identifier][questionId] = getAnswerText(answer);
        }
    }
    return `
	${title},
	${head.join(',')},
	${Object.values(answerRows)
        .map((row) => Object.values(row).join(','))
        .join('\n')},
	`;
}
