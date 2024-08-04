import mysql from 'mysql'

export class DBConnection {
  private connection: mysql.Pool

  public constructor() {
    this.connection = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    })
  }

  public async query(query: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.connection.query(query, (err, results) => {
        if (err) {
          reject(err)
        } else {
          resolve(results)
        }
      })
    })
  }
}
