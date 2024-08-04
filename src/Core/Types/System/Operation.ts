import { DBConnection } from '@modules/Core/DB/DBConnection'

export type Operation = (DB: DBConnection) => string | void
