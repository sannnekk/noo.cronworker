import { DBConnection } from './Core/DB/DBConnection'
import { Frequency } from './Core/Types/System'
import { syncGoogleDocsBindings } from './GoogleDocsBindings'

if (!process.env.FREQUENCY) {
  throw new Error('FREQUENCY env var is required')
}

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error(
    'GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET env vars are required'
  )
}

const frequency = process.env.FREQUENCY as Frequency

// connect to db
const connection = new DBConnection()

await syncGoogleDocsBindings(connection, frequency)

connection.close()
process.exit(0)
