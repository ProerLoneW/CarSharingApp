// 数据库的总体信息文件
const db = {
	dbName: 'car_sharing',
	dbPath: '_doc/car_sharing.db',
	isOpen: false,

	// create
	createDatabase() {
		return new Promise((resolve, reject) => {
			this.isOpen = this.checkOpen();
			console.log("数据库是否已打开:", this.isOpen);
			// 如果重复打开就不和数据库连接了
			if (this.isOpen) {
				resolve();
			} else {
				this.openSqlite().then((e) => {
					resolve(e);
				}).catch((error) => {
					reject(error);
				});
			}
		})
	},

	// 数据库初始化，建所有表
	async initDatabase() {
		// 调用所有表的 createTable 函数
	},

	/**
		 * 通用sql处理方法
		 * @param {String} sql sql语句
		 * @example 创建表 DB.executeSql(sql语句)
		 * let sql = `CREATE TABLE IF NOT EXISTS app_user (
	                user_id INTEGER PRIMARY KEY AUTOINCREMENT,
	            );`;
		 * await DB.executeSql(sql);
		 */
	executeSql(sql) {
		//console.log('执行sql', sql);
		return new Promise((resolve, reject) => {
			plus.sqlite.executeSql({
				name: this.dbName,
				sql,
				success(e) {
					resolve(e);
				},
				fail(e) {
					reject(e);
				}
			});
		})
	},

	/**
	 * 判断数据库是否打开
	 * @returns {Boolean} 打开为 true，未打开为 false
	 */
	checkOpen() {
		var open = plus.sqlite.isOpenDatabase({
			name: this.dbName,
			path: this.dbPath
		})
		return open;
	},

	/**
	 * 打开数据库，没有则创建
	 */
	openSqlite() {
		return new Promise((resolve, reject) => {
			plus.sqlite.openDatabase({
				name: this.dbName,
				path: this.dbPath,
				success: async (e) => {
					// 启用外键支持					
					try {
						await this.executeSql('PRAGMA foreign_keys = ON;');
						console.log('外键启用成功');

						resolve(e);
					} catch (error) {
						reject(error);
					}
				},
				fail(e) {
					reject(e);
				}
			})
		})
	},

	/**
	 * 关闭数据库
	 */
	closeSqlite() {
		return new Promise((resolve, reject) => {
			plus.sqlite.closeDatabase({
				name: this.dbName,
				success(e) {
					resolve(e);
				},
				fail(e) {
					reject(e);
				}
			})
		})
	},

	/**
	 * 数据库建表 sql:'CREATE TABLE IF NOT EXISTS dbTable("id" varchar(50),"name" TEXT) 
	 * 创建 CREATE TABLE IF NOT EXISTS 、 dbTable 是表名，不能用数字开头、括号里是表格的表头
	 * @param {Object} dbTable 表名
	 * @param {Object} data 表列
	 * @example 创建表 DB.createTable(表名, 表的列)
	 * let sql = '"date" DATE  PRIMARY KEY,"money" INTEGER,"notes" text,"info" text';
	 * await DB.createTable('records', sql);
	 */
	createTable(dbTable, data) {
		return new Promise((resolve, reject) => {
			// executeSql: 执行增删改等操作的SQL语句
			plus.sqlite.executeSql({
				name: this.dbName,
				sql: `CREATE TABLE IF NOT EXISTS ${dbTable}(${data})`,
				success(e) {
					resolve(e);
				},
				fail(e) {
					reject(e);
				}
			})
		})
	},

	/**
	 * 数据库删表
	 * @param {Object} dbTable 表名
	 * @description 数据库删表 sql:'DROP TABLE dbTable'
	 */
	dropTable(dbTable) {
		return new Promise((resolve, reject) => {
			plus.sqlite.executeSql({
				name: this.dbName,
				sql: `DROP TABLE ${dbTable}`,
				success(e) {
					resolve(e);
				},
				fail(e) {
					reject(e);
				}
			})
		})
	},

	// 向表格里添加数据 sql:'INSERT INTO dbTable VALUES('x','x','x')'			对应新增
	// 或者 sql:'INSERT INTO dbTable ('x','x','x') VALUES('x','x','x')'	具体新增
	
	/**
	 * 向表格里添加数据
	 * @param {String} dbTable 表名
	 * @param {String} data 列值
	 * @param {String} condition 表头列名
	 * @example  
	 * let sql = `'${item.money}','${item.notes}','${item.time}'`;
	 * let condition = "'money','notes','time'";
	 * await DB.insertTableData("records", sql, condition);
	 */
	insertTableData(dbTable, data, condition) {
		// 判断有没有传参
		if (dbTable !== undefined && data !== undefined) {
			// 判断传的参是否有值
			var bol = (JSON.stringify(data) == "{}");
			if (!bol) {
				if (condition == undefined) {
					var sql = `INSERT INTO ${dbTable} VALUES('${data}')`;
				} else {
					var sql = `INSERT INTO ${dbTable} (${condition}) VALUES(${data})`;
				}
				// console.log(sql);
				return new Promise((resolve, reject) => {
					// 表格添加数据
					plus.sqlite.executeSql({
						name: this.dbName,
						sql: sql,
						success(e) {
							resolve(e);
						},
						fail(e) {
							reject(e);
						}
					})
				})
			} else {
				return new Promise((resolve, reject) => {
					reject("错误添加")
				})
			}
		} else {
			return new Promise((resolve, reject) => {
				reject("错误添加")
			})
		}
	},

	/**
	 * 根据条件向表格里添加数据  有数据更新、无数据插入
	 * (建表时需要设置主键) 例如 --- "roomid" varchar(50) PRIMARY KEY
	 * @param {String} dbTable 表名
	 * @param {String} data 列值
	 * @param {String} condition 表头列名
	 * @example  
	 * let sql = `'${item.money}','${item.notes}','${item.time}'`;
	 * let condition = "'money','notes','time'";
	 * await DB.insertTableData("records", sql, condition);
	 */
	insertOrReplaceData(dbTable, data, condition) {
		// 判断有没有传参
		if (dbTable !== undefined && data !== undefined) {
			if (condition == undefined) {
				var sql = `INSERT OR REPLACE INTO ${dbTable} VALUES('${data}')`;
			} else {
				var sql = `INSERT OR REPLACE INTO ${dbTable} (${condition}) VALUES(${data})`;
			}
			// console.log(sql);
			return new Promise((resolve, reject) => {
				// 表格添加数据
				plus.sqlite.executeSql({
					name: this.dbName,
					sql: sql,
					success(e) {
						resolve(e);
					},
					fail(e) {
						reject(e);
					}
				})
			})
		} else {
			return new Promise((resolve, reject) => {
				reject("错误添加")
			})
		}
	},

	/**
	 * 查询获取数据库里的数据 sql:'SELECT * FROM dbTable WHERE lname = 'lvalue''
	 * @param {String} dbTable 表名
	 * @param {String} [condition = ''] 查找条件
	 * @example
	 * const searchCondition = `WHERE date = '${day}'`
	 * await DB.selectTableData('表名', searchCondition);
	 */
	selectTableData(dbTable, condition = '') {
		if (dbTable !== undefined) {
			var sql = `SELECT * FROM ${dbTable} ${condition}`;
			return new Promise((resolve, reject) => {
				// 表格查询数据  执行查询的SQL语句
				plus.sqlite.selectSql({
					name: this.dbName,
					sql: sql,
					success(e) {
						resolve(e);
					},
					fail(e) {
						reject(e);
					}
				})
			})
		} else {
			return new Promise((resolve, reject) => {
				reject("错误查询")
			});
		}
	},

	/**
	 * 删除表里的数据 sql:'DELETE FROM dbTable WHERE lname = 'lvalue''
	 * @param {String} dbTable 表名
	 * @param {String} [condition = ''] 查找条件
	 * @example
	 * const searchCondition = `WHERE date = '${day}'`
	 * await DB.deleteTableData('表名', searchCondition);
	 */
	deleteTableData(dbTable, condition = '') {
		if (dbTable !== undefined) {
			var sql = `DELETE FROM ${dbTable} ${condition}`;
			return new Promise((resolve, reject) => {
				// 删除表数据
				plus.sqlite.executeSql({
					name: this.dbName,
					sql: sql,
					success(e) {
						resolve(e);
					},
					fail(e) {
						reject(e);
					}
				})
			})
		} else {
			return new Promise((resolve, reject) => {
				reject("错误删除")
			});
		}
	},

	// 修改数据表里的数据 sql:"UPDATE dbTable SET 列名 = '列值',列名 = '列值' WHERE lname = 'lvalue'"
	// 修改 UPDATE 、 dbTable 是表名, data: 要修改的列名=修改后列值, lname,lvalue 是查询条件的列名和列值
	updateTableData(dbTable, data, lname, lvalue) {
		if (lname == undefined) {
			var sql = `UPDATE ${dbTable} SET ${data}`;
		} else {
			var sql = `UPDATE ${dbTable} SET ${data} WHERE ${lname} = '${lvalue}'`;
		}
		// WHERE 前面是要修改的列名、列值，后面是条件的列名、列值
		return new Promise((resolve, reject) => {
			// 修改表数据
			plus.sqlite.executeSql({
				name: this.dbName,
				sql: sql,
				success(e) {
					resolve(e);
				},
				fail(e) {
					reject(e);
				}
			})
		})
	},
	// 修改数据表里的数据，支持组合查询
	// conditions 是包含多个条件键值对的对象，如 { project_id: 1, flange_id: 2 }
	updateTableData_multiCondition(dbTable, data, conditions) {
		let sql = `UPDATE ${dbTable} SET ${data}`;

		// 如果 conditions 参数存在且有内容，构建 WHERE 子句
		if (conditions && Object.keys(conditions).length > 0) {
			const conditionStr = Object.keys(conditions).map(key => `${key} = '${conditions[key]}'`).join(' AND ');
			sql += ` WHERE ${conditionStr}`;
		}

		return new Promise((resolve, reject) => {
			// 修改表数据
			plus.sqlite.executeSql({
				name: this.dbName,
				sql: sql,
				success(e) {
					resolve(e);
				},
				fail(e) {
					reject(e);
				}
			})
		});
	},

	// 获取指定数据条数  sql:"SELECT * FROM dbTable ORDER BY 'id' DESC LIMIT 15 OFFSET 'num'"
	// dbTable 表名, ORDER BY 代表排序默认正序, id 是排序的条件 DESC 代表倒序，从最后一条数据开始拿
	// LIMIT 15 OFFSET '${num}',这句的意思是跳过 num 条拿 15 条数据, num 为跳过多少条数据是动态值
	// 例 初始num设为0，就从最后的数据开始拿15条，下次不拿刚获取的数据，所以可以让num为15，这样就能一步一步的拿完所有的数据
	pullSQL(dbTable, id, num) {
		return new Promise((resolve, reject) => {
			plus.sqlite.selectSql({
				name: this.dbName,
				sql: `SELECT * FROM ${dbTable} ORDER BY '${id}' DESC LIMIT 15 OFFSET '${num}'`,
				success(e) {
					resolve(e);
				},
				fail(e) {
					reject(e);
				}
			})
		})
	},

	/**
	 * 根据列值插入对象数组到表里
	 * @param {String} dbTable 表名
	 * @param {Array} column 代表要插入的表的列名数组
	 * @param {Array} data 代表要插入的数据，是一个对象数组
	 * @example
	 * const column = ["project_user_id","project_id","user_id"];
	 * data=[{"projectUserId": 1,"projectId": 1,"userId": 1,},{"projectUserId": 2,"projectId": 1,"userId": 100,},]
	 */
	async insertByColumn(dbTable, column, data) {
		for (let item of data) {
			const fields = Object.keys(item).filter(field => column.includes(
				field)); // 获取对象的所有字段名；过滤不需要的字段
			const values = fields.map(field => `'${item[field]}'`).join(
				', '); // 将字段值拼接为 SQL 格式
			const condition = fields.map(field => `"${field}"`).join(', '); // 字段名拼接
			try {
				// 调用 insertTableData 方法插入数据
				await this.insertOrReplaceData(dbTable, values, condition);
				console.log(`数据插入成功: ${dbTable}`);
			} catch (error) {
				console.error(`数据插入失败: ${dbTable},字段：${condition},数据：${values}`, error);
			}
		}
	},

	/**
	 * 获取最后插入记录的自增主键
	 * @param {String} dbTable 表名
	 * @returns {Promise} 返回插入记录的自增主键
	 */
	getLastInsertId(dbTable) {
		return new Promise((resolve, reject) => {
			const sql = `SELECT last_insert_rowid() AS lastId FROM ${dbTable}`;
			plus.sqlite.selectSql({
				name: this.dbName,
				sql: sql,
				success(e) {
					resolve(e);
				},
				fail(e) {
					reject(e);
				}
			});
		});
	},
	
	/**
	 * 获取表中有多少条数据
	 * @param {String} dbTable 表名
	 * @returns {Promise} 返回插入记录的自增主键
	 */
	getCount(dbTable) {
		return new Promise((resolve, reject) => {
			const sql = `SELECT COUNT(*) FROM ${dbTable}`;
			plus.sqlite.selectSql({
				name: this.dbName,
				sql: sql,
				success(e) {
					resolve(e);
				},
				fail(e) {
					reject(e);
				}
			});
		});
	},

	/**
	 * 获取表中最大主键
	 * @param {String} dbTable 表名
	 * @param {String} primaryKeyColumn 主键列名
	 * @returns {Promise} 返回最大主键
	 */
	getMaxPrimaryKey(dbTable, primaryKeyColumn) {
		if (dbTable !== undefined) {
			var sql = `SELECT MAX(${primaryKeyColumn}) AS maxId FROM ${dbTable}`;
			return new Promise((resolve, reject) => {
				// 表格查询数据  执行查询的SQL语句
				plus.sqlite.selectSql({
					name: this.dbName,
					sql: sql,
					success(e) {
						resolve(e);
					},
					fail(e) {
						reject(e);
					}
				})
			})
		} else {
			return new Promise((resolve, reject) => {
				reject("错误查询")
			});
		}
	},

}

// 默认导出 db
export default db;