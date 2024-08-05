import { exchangeCodeForTokens, uploadFileToGoogleDrive, reissueRefreshToken, } from './helpers.js';
import { getPollData } from './data/poll.js';
async function updateRefreshToken(dbConnection, id, refreshToken) {
    await dbConnection.query(`UPDATE google_docs_binding SET google_refresh_token = '${refreshToken}' WHERE id = '${id}'`);
}
async function unsetOauth(dbConnection, id) {
    await dbConnection.query(`UPDATE google_docs_binding SET google_oauth_token = NULL WHERE id = '${id}'`);
}
async function getCSVFromBinding(dbConnection, binding) {
    switch (binding.entity_name) {
        case 'user':
            return '<user data>';
        case 'poll_answer':
            return getPollData(dbConnection, binding);
        default:
            return 'NO DATA FOUND;';
    }
}
export async function syncGoogleDocsBindings(connection, frequency) {
    const bindings = (await connection.query(`SELECT * FROM google_docs_binding WHERE frequency = '${frequency}'`));
    for (const binding of bindings) {
        const csv = await getCSVFromBinding(connection, binding);
        try {
            const tokens = binding.google_oauth_token
                ? await exchangeCodeForTokens(binding.google_oauth_token)
                : await reissueRefreshToken(binding.google_refresh_token);
            await unsetOauth(connection, binding.id);
            if (tokens.refresh_token) {
                await updateRefreshToken(connection, binding.id, tokens.refresh_token);
            }
            await uploadFileToGoogleDrive(tokens, csv, `noo-export__${new Date().getFullYear()}.${new Date().getMonth() + 1}.${new Date().getDate()}.csv`);
        }
        catch (error) {
            // eslint-disable-next-line no-console
            console.log(error);
        }
    }
}
