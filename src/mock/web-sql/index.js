import createTableSql, { initDataSql } from './init-sql';
import appPackage from '../../../package.json';

const packageName = appPackage.name;
const dbName = `${packageName}-test-database`;
//const dbName = `${packageName}`;
const dbVersion = 20; // 确保使用更高的版本号
let db;

const tables = ['menus', 'roles', 'users', 'role_menus', 'user_roles', 'user_collect_menus'];

async function openDB() {
    console.log(`Opening database: ${dbName}, version: ${dbVersion+1}`);
    return new Promise((resolve, reject) => {
        try {
            console.log(dbVersion+1)
            var newVersion=dbVersion+1
            const request = indexedDB.open(dbName, newVersion);
            console.log('Database open request initiated');

            request.onupgradeneeded = (event) => {
                console.log('Upgrading database...');
                db = event.target.result;
                createTables();
                //dropAllTables();
                
               
            };

            request.onsuccess = (event) => {
                console.log('Database opened successfully');
                //initTablesData();
                db = event.target.result;
                initTablesData();
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
            
            var objectStore = db.createObjectStore(tableName, { keyPath: 'id', autoIncrement: true });
            objectStore.transaction.oncomplete = function(event){
                const transaction = db.transaction(tableName, 'readwrite');
                const store = transaction.objectStore(tableName);
                
            }
            
        } else {
            console.log(`Table ${tableName} already exists`);
        }
    }
}
function parseCondition(cond) {
    const match = cond.match(/(\w+)\s*(=|LIKE)\s*(.+)/i);
    if (match) {
        return {
            field: match[1],
            operator: match[2].toUpperCase(),
            value: match[3].replace(/'/g, ''), // 去掉单引号
        };
    }
    return null;
}
//执行带参数的sql语句
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
        // 处理 SELECT 语句
        if (sql.startsWith('SELECT')) {
            request = store.getAll();
            request.onsuccess = (event) => {
                const allRecords = event.target.result;
                console.log('All records:', allRecords); // 打印所有记录
                const condition = sql.match(/WHERE\s+(.+?)(\s+ORDER BY|\s+LIMIT|\s*$)/i);
                let filteredRecords = allRecords;
                console.log(condition)

                if (condition) {
                    const conditions = condition[1].split(/\s+AND\s+/i);
                    filteredRecords = allRecords.filter(record => {
                        return conditions.every(cond => {
                            const parsedCondition = parseCondition(cond);
                            
                            if (parsedCondition) {
                                const { field, operator, value } = parsedCondition;
                                //处理like
                                if (operator === 'LIKE') {
                                    const regex = new RegExp(value.replace(/%/g, '.*'), 'i');
                                    return regex.test(record[field]);
                                }
                                
                                return record[field] === args[0];
                            }
                            return true;
                        });
                    });
                    console.log(filteredRecords)
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
        // 处理 INSERT 语句
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
        // 处理 UPDATE 语句
        } else if (sql.startsWith('UPDATE')) {
            const [updatePart, wherePart] = sql.split('WHERE');
            const setPart = updatePart.match(/SET\s+(.+?)\s*$/i)[1];
            const conditions = wherePart.match(/(\w+)\s*=\s*\?/gi);
            const updates = setPart.split(',').map(s => s.trim().split('='));
            
            request = store.getAll();
            request.onsuccess = (event) => {
                const allRecords = event.target.result;
                const conditionFields = conditions.map(cond => cond.split('=')[0].trim());
                const conditionValues = args.slice(-conditionFields.length);

                const recordsToUpdate = allRecords.filter(record => {
                    return conditionFields.every((field, index) => record[field] === conditionValues[index]);
                });

                recordsToUpdate.forEach(record => {
                    updates.forEach(([field, value], index) => {
                        record[field.trim()] = args[index];
                    });

                    const updateRequest = store.put(record);
                    updateRequest.onsuccess = (event) => {
                        resolve(fullResult ? event.target.result : record);
                    };
                    updateRequest.onerror = (event) => {
                        console.error('SQL execution error:', event.target.error);
                        reject(event.target.error);
                    };
                });

                if (recordsToUpdate.length === 0) {
                    resolve([]);
                }
            };
            request.onerror = (event) => {
                console.error('SQL execution error:', event.target.error);
                reject(event.target.error);
            };

            return;
        // 处理 DELETE 语句
        } else if (sql.startsWith('DELETE')) {
            const condition = sql.match(/WHERE\s+(.+?)(\s+ORDER BY|\s+LIMIT|\s*$)/i);
            if (condition) {
                const [field] = condition[1].match(/(\w+)\s*=\s*(\?)/i).slice(1);
                const request = store.getAll();
                request.onsuccess = (event) => {
                    const records = event.target.result;
                    console.log(records)
                    if (records.length > 0) {
                        const deleteRequest = store.delete(records[0].id);
                        deleteRequest.onsuccess = (event) => {
                            resolve(event.target.result);
                        };
                        deleteRequest.onerror = (event) => {
                            console.error('SQL execution error:', event.target.error);
                            reject(event.target.error);
                        };
                    } else {
                        resolve(null);
                    }
                };
                request.onerror = (event) => {
                    console.error('SQL execution error:', event.target.error);
                    reject(event.target.error);
                };
            }
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
    //const hasInitData = await usersHasData();
    //if (init) await dropAllTables();
    //if (init || !hasInitData) await initTablesData();
    //console.log("drop")
    await dropAllTables();
    console.log('table')
    await initTablesData();
}

async function usersHasData() {
    console.log('Checking if users have data...');
    const result = await executeSql('SELECT * FROM users');
    return result.length > 0;
}

// 删除所有数据库表
async function dropAllTables() {
   
    return new Promise((resolve, reject) => {
        
        console.log('Dropping all tables...');
            
        for (const storeName of db.objectStoreNames) {
            console.log(`Deleting table: ${storeName}`);
            db.deleteObjectStore(storeName);
        }
        createTables();
        
    });
}
//initDB用
async function executeSqlNoArgs(sql) {
    if (!db) {
        await openDB();
    }

    return new Promise((resolve, reject) => {
        const tableName = getTableNameFromSql(sql);
        const transaction = db.transaction(tableName, 'readwrite');
        const store = transaction.objectStore(tableName);

        let request;
        if (sql.startsWith('INSERT')) {
            const values = sql.match(/\((.*?)\)/g).map(val => val.replace(/[()]/g, ''));
            const columns = values[0].split(',').map(v => v.trim());
            const data = {};
            values[1].split(',').forEach((val, idx) => {
                const trimmedVal = val.trim();
                if (/^\d+$/.test(trimmedVal)) {
                    data[columns[idx]] = parseInt(trimmedVal, 10);
                } else {
                    data[columns[idx]] = trimmedVal.replace(/'/g, '');
                }
            });
            request = store.add(data);
        } else {
            return reject('Unsupported SQL');
        }

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };

        request.onerror = (event) => {
            console.error('SQL execution error:', event.target.error);
            reject(event.target.error);
        };
    });
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
        await executeSqlNoArgs(sql);
    }
}

export { executeSql, initDB,openDB };
