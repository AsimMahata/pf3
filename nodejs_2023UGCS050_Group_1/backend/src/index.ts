import { app } from './server.js';
import dotenv from 'dotenv';
import { initDB } from './config/database.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

initDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Backend-SQL running on port ${PORT} (MySQL)`);
    });
}).catch((error) => {
    console.error('Failed to connect to MySQL database:', error);
    process.exit(1);
});
