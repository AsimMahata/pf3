import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'root',
    database: process.env.MYSQL_DATABASE || 'pflab',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

export const initDB = async (): Promise<void> => {
    const retries = 30;
    const delay = 2000;

    for (let i = 1; i <= retries; i++) {
        let conn;
        try {
            conn = await pool.getConnection();

            await conn.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.MYSQL_DATABASE || 'pflab'}\``);
            await conn.query(`USE \`${process.env.MYSQL_DATABASE || 'pflab'}\``);

            await conn.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                    name       VARCHAR(50)  NOT NULL,
                    email      VARCHAR(255) NOT NULL UNIQUE,
                    password   VARCHAR(255) NOT NULL,
                    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `);

            await conn.query(`
                CREATE TABLE IF NOT EXISTS vaults (
                    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                    user_id     INT UNSIGNED NOT NULL,
                    name        VARCHAR(100) NOT NULL,
                    description VARCHAR(500) NOT NULL DEFAULT '',
                    color       VARCHAR(20)  NOT NULL DEFAULT '#4F46E5',
                    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT fk_vaults_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `);

            await conn.query(`
                CREATE TABLE IF NOT EXISTS credentials (
                    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                    user_id    INT UNSIGNED NOT NULL,
                    vault_id   INT UNSIGNED NULL,
                    title      VARCHAR(255) NOT NULL,
                    username   VARCHAR(255) NOT NULL,
                    password   VARCHAR(255) NOT NULL,
                    url        VARCHAR(2048) NULL,
                    notes      TEXT         NULL,
                    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    CONSTRAINT fk_creds_user  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
                    CONSTRAINT fk_creds_vault FOREIGN KEY (vault_id) REFERENCES vaults(id) ON DELETE SET NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `);

            await conn.query(`
                CREATE TABLE IF NOT EXISTS documents (
                    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                    user_id       INT UNSIGNED NOT NULL,
                    vault_id      INT UNSIGNED NOT NULL,
                    name          VARCHAR(255) NOT NULL,
                    original_name VARCHAR(255) NOT NULL,
                    mime_type     VARCHAR(100) NOT NULL,
                    size          BIGINT UNSIGNED NOT NULL,
                    file_path     VARCHAR(1024) NOT NULL,
                    upload_date   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT fk_docs_user  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
                    CONSTRAINT fk_docs_vault FOREIGN KEY (vault_id) REFERENCES vaults(id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `);

            conn.release();
            return;

        } catch (err) {
            if (conn) conn.release();

            if (i === retries) {
                throw err;
            }

            await new Promise(res => setTimeout(res, delay));
        }
    }
};

export default pool;