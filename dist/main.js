import { DBConnection } from './Core/DB/DBConnection.js';
import { google } from 'googleapis';
// connect to db
const connection = new DBConnection();
const bindings = (await connection.query('SELECT * FROM google_docs_binding WHERE entity_name = "poll_answer"'));
async function uploadFile(drive, csv) {
    const fileMetadata = {
        name: 'noo-export.csv',
        mimeType: 'application/vnd.google-apps.spreadsheet',
    };
    const media = {
        mimeType: 'text/csv',
        body: csv,
    };
    try {
        const response = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id',
        });
        console.log('File ID:', response.data.id);
    }
    catch (error) {
        console.error('Error uploading file:', error);
    }
}
for (const binding of bindings) {
    const entityName = binding.entity_name;
    const selector = JSON.parse(binding.entity_selector);
    if (entityName === 'poll_answer') {
        const answersSql = `
		SELECT poll_answer.text, poll_answer.number, poll_answer.date, poll_answer.choices, poll_answer.rating FROM poll_answer 
		LEFT JOIN poll_question ON poll_answer.questionId = poll_question.id
		WHERE poll_question.id = '${selector.value}'
	`;
        const answers = await connection.query(answersSql);
        const questionsSql = `
		SELECT * FROM poll_question WHERE pollId = '${selector.value}'
	`;
        const questions = await connection.query(questionsSql);
        const header = ['', ...questions.map((question) => question.text)];
        const results = [];
        const userAnswers = answers.reduce((acc, answer) => {
            if (!acc[answer.user_auth_identifier]) {
                acc[answer.user_auth_identifier] = [];
            }
            let answerText = '';
            switch (answer.question_type) {
                case 'text':
                    answerText = answer.text;
                    break;
                case 'number':
                    answerText = answer.number;
                    break;
                case 'date':
                    answerText = answer.date;
                    break;
                case 'choices':
                    answerText = answer.choices;
                    break;
                case 'rating':
                    answerText = answer.rating;
                    break;
                default:
                    answerText = '-';
                    break;
            }
            acc[answer.user_auth_identifier].push(answerText);
        }, {});
        const rows = Object.entries(userAnswers).map(([user, answers]) => {
            return [user, ...answers];
        });
        const csv = [header, ...rows].map((row) => row.join(',')).join('\n');
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({
            access_token: binding.google_oauth_token,
        });
        const drive = google.drive({ version: 'v3', auth: oauth2Client });
        try {
            uploadFile(drive, csv);
        }
        catch (error) {
            console.error('Error uploading file:', error);
        }
    }
}
