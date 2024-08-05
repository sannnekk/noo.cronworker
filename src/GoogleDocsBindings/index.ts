import { DBConnection } from '@modules/Core/DB/DBConnection'
import { type Frequency } from '@modules/Core/Types/System'
import {
  exchangeCodeForTokens,
  uploadFileToGoogleDrive,
  reissueRefreshToken,
} from './helpers'
import { getPollData } from './data/poll'

async function updateRefreshToken(
  dbConnection: DBConnection,
  id: string,
  refreshToken: string
) {
  await dbConnection.query(
    `UPDATE google_docs_binding SET google_refresh_token = '${refreshToken}' WHERE id = '${id}'`
  )
}

async function unsetOauth(dbConnection: DBConnection, id: string) {
  await dbConnection.query(
    `UPDATE google_docs_binding SET google_oauth_token = NULL WHERE id = '${id}'`
  )
}

async function getCSVFromBinding(dbConnection: DBConnection, binding: any) {
  switch (binding.entity_name) {
    case 'user':
      return '<user data>'
    case 'poll_answer':
      return getPollData(dbConnection, binding)
    default:
      return 'NO DATA FOUND;'
  }
}

export async function syncGoogleDocsBindings(
  connection: DBConnection,
  frequency: Frequency
): Promise<void> {
  const bindings = (await connection.query(
    `SELECT * FROM google_docs_binding WHERE frequency = '${frequency}'`
  )) as any[]

  for (const binding of bindings) {
    const csv = await getCSVFromBinding(connection, binding)

    try {
      const tokens = binding.google_oauth_token
        ? await exchangeCodeForTokens(binding.google_oauth_token)
        : await reissueRefreshToken(binding.google_refresh_token)

      await unsetOauth(connection, binding.id)

      if (tokens.refresh_token) {
        await updateRefreshToken(connection, binding.id, tokens.refresh_token)
      }

      await uploadFileToGoogleDrive(
        tokens,
        csv,
        `noo-export__${new Date().getFullYear()}.${new Date().getMonth() + 1}.${new Date().getDate()}.csv`
      )
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.log(error)
    }
  }
}
