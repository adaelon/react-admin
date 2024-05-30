import createTableSql, { initDataSql } from './init-sql';
import appPackage from '../../../package.json';

const packageName = appPackage.name;
const dbName = `${packageName}-test-database`;
const dbVersion = 14; // 确保使用更高的版本号
let db;

const tables = ['menus', 'roles', 'users', 'role_menus', 'user_roles', 'user_collect_menus'];

async function openDB() {
    console.log(`Opening database: ${dbName}, version: ${dbVersion}`);
    return new Promise((resolve, reject) => {
        try {
            const request = indexedDB.open(dbName, dbVersion);
            console.log('Database open request initiated');

            request.onupgradeneeded = (event) => {
                console.log('Upgrading database...');
                db = event.target.result;
                createTables();
            };

            request.onsuccess = (event) => {
                console.log('Database opened successfully');
                db = event.target.result;
                resolve(db);
            };

            request.onerror = (event) => {
                console.error('Error opening database:', event.target.error);
                reject(event.target.error);
            };

            request.onblocked = () => {
                console.warn('Database open request is blocked');
            };
        } catch (error) {
            console.error('Exception during database open request:', error);
            reject(error);
        }
    });
}


function createTables() {
    console.log('Creating tables...');
    const tableCreationSql = createTableSql.split('CREATE TABLE').slice(1);
    for (const sql of tableCreationSql) {
        const tableName = sql.match(/IF NOT EXISTS (\w+)/i)?.[1] || sql.split('(')[0].trim();
        console.log(`Processing table: ${tableName}`);  // 打印每个表名
        if (!db.objectStoreNames.contains(tableName)) {
            console.log(`Creating table: ${tableName}`);
            const transaction = db.transaction(tableName, 'readwrite');
            db.createObjectStore(tableName, { keyPath: 'id', autoIncrement: true });
            const store = transaction.objectStore(tableName);
            // 为创建索引
            if (tableName === 'users') {
                store.createIndex('account', 'account', { unique: true });
            }
        } else {
            console.log(`Table ${tableName} already exists`);
        }
    }
}


async function executeSql(sql, args = [], fullResult = false) {
    if (!db) {
        db = await openDB();
    }
    console.log('Executing SQL:', sql, ', with arguments:', args);
    return new Promise((resolve, reject) => {
        const tableName = getTableNameFromSql(sql);
        console.log('Table name extracted from SQL:', tableName);
        const transaction = db.transaction(tableName, 'readwrite');
        const store = transaction.objectStore(tableName);
        let request;

        if (sql.startsWith('SELECT')) {
            request = store.getAll();
            request.onsuccess = (event) => {
                const allRecords = event.target.result;
                console.log('All records:', allRecords); // 打印所有记录
                const condition = sql.match(/WHERE\s+(.+?)(\s+ORDER BY|\s+LIMIT|\s*$)/i);
                let filteredRecords = allRecords;

                if (condition) {
                    const conditions = condition[1].split(/\s+AND\s+/i);
                    filteredRecords = allRecords.filter(record => {
                        return conditions.every(cond => {
                            const [field, operator, value] = cond.split(/\s+/);
                            if (operator.toUpperCase() === 'LIKE') {
                                const regex = new RegExp(value.replace(/%/g, '.*'), 'i');
                                return regex.test(record[field]);
                            }
                            return record[field] === args.shift();
                        });
                    });
                    console.log(conditions)
                }

                if (sql.includes('ORDER BY')) {
                    const orderBy = sql.match(/ORDER BY\s+(\w+)\s*(ASC|DESC)?/i);
                    if (orderBy) {
                        const [_, field, direction] = orderBy;
                        filteredRecords.sort((a, b) => {
                            if (direction && direction.toUpperCase() === 'DESC') {
                                return b[field] - a[field];
                            }
                            return a[field] - b[field];
                        });
                    }
                }

                if (sql.includes('LIMIT')) {
                    const limit = sql.match(/LIMIT\s+(\d+)(\s+OFFSET\s+(\d+))?/i);
                    if (limit) {
                        const [_, limitValue, , offsetValue] = limit;
                        const offset = offsetValue ? parseInt(offsetValue, 10) : 0;
                        filteredRecords = filteredRecords.slice(offset, offset + parseInt(limitValue, 10));
                    }
                }

                resolve(fullResult ? filteredRecords : filteredRecords);
            };
            request.onerror = (event) => {
                console.error('SQL execution error:', event.target.error);
                reject(event.target.error);
            };
        } else if (sql.startsWith('INSERT')) {
            const data = {};
            const columns = sql.match(/\((.*?)\)/)[1].split(',').map(col => col.trim());
            columns.forEach((col, index) => {
                data[col] = args[index];
            });
            request = store.add(data);
            request.onsuccess = (event) => {
                resolve(event.target.result);
            };
            request.onerror = (event) => {
                console.error('SQL execution error:', event.target.error);
                reject(event.target.error);
            };
        } else if (sql.startsWith('UPDATE')) {
            request = store.put(args[0]);
            request.onsuccess = (event) => {
                resolve(event.target.result);
            };
            request.onerror = (event) => {
                console.error('SQL execution error:', event.target.error);
                reject(event.target.error);
            };
        } else if (sql.startsWith('DELETE')) {
            request = store.delete(args[0].id);
            request.onsuccess = (event) => {
                resolve(event.target.result);
            };
            request.onerror = (event) => {
                console.error('SQL execution error:', event.target.error);
                reject(event.target.error);
            };
        } else {
            console.error('Unsupported SQL:', sql);
            reject('Unsupported SQL');
        }
    });
}

function getTableNameFromSql(sql) {
    const selectMatch = sql.match(/FROM\s+(\w+)/i);
    if (selectMatch) return selectMatch[1];
    const insertMatch = sql.match(/INTO\s+(\w+)/i);
    if (insertMatch) return insertMatch[1];
    const updateMatch = sql.match(/UPDATE\s+(\w+)/i);
    if (updateMatch) return updateMatch[1];
    const deleteMatch = sql.match(/FROM\s+(\w+)/i);
    if (deleteMatch) return deleteMatch[1];
    throw new Error(`Unable to determine table name from SQL: ${sql}`);
}

// 初始化数据库
async function initDB(init) {
    console.log('Initializing database...');
    await openDB();
    const hasInitData = await usersHasData();
    if (init) await dropAllTables();
    if (init || !hasInitData) await initTablesData();
    await initTablesData();
}

async function usersHasData() {
    console.log('Checking if users have data...');
    const result = await executeSql('SELECT * FROM users');
    return result.length > 0;
}

// 删除所有数据库表
async function dropAllTables() {
    console.log('Dropping all tables...');
    if (!db) {
        db = await openDB();
    }
    for (const storeName of db.objectStoreNames) {
        const tableName = storeName.match(/IF NOT EXISTS\s+(\w+)/i)?.[1] || storeName.trim();
        console.log(`Deleting table: ${tableName}`);
        db.deleteObjectStore(tableName);
    }
    createTables();
}


// 插入初始化数据
async function initTablesData() {
    console.log('Inserting initial data...');
    for (let table of tables) {
        const sql = initDataSql[table];
        await executeSplit(sql, 'INSERT INTO');
    }
}

async function executeSplit(sql, keyWord) {
    console.log(`Executing split SQL: ${sql}`);
    const arr = sql.split(keyWord).filter((item) => !!item.trim()).map((item) => keyWord + item);
    for (let sql of arr) {
        await executeSql(sql);
    }
}

export { executeSql, initDB };
