// 引入数据库操作模块（自定义封装的 db.js）
import db from "@/utils/db.js";

/**
 * 根据条件对象生成 SQL 的 WHERE 子句
 * @param {Object} conditions - 形如 { key: value }
 * @returns {String} - SQL 条件字符串，如 "WHERE id = '1' AND name = 'Tom'"
 */
function formatConditions(conditions) {
  if (!conditions || Object.keys(conditions).length === 0) return '';
  return 'WHERE ' + Object.entries(conditions).map(([k, v]) => `${k} = '${v}'`).join(' AND ');
}

/**
 * 根据更新数据对象生成 SQL 的 SET 子句
 * @param {Object} data - 形如 { key: value }
 * @returns {String} - SQL 赋值字符串，如 "score = '90', name = 'Tom'"
 */
function formatSetClause(data) {
  return Object.entries(data).map(([k, v]) => `${k} = '${v}'`).join(', ');
}

/**
 * 通用表操作模块函数，为任意表创建封装好的操作方法
 * @param {String} tableName - 表名
 * @param {String} columns - 表字段定义（用于建表）
 * @returns {Object} - 拥有增删改查等方法的表操作对象
 */
function createTableModule(tableName, columns) {
  return {
    // 删除旧表并创建新表
    async createTable() {
      await db.executeSql(`DROP TABLE IF EXISTS ${tableName}`);
      return db.createTable(tableName, columns);
    },

    // 插入数据（支持单条或多条）
    async insertData(data) {
      if (!Array.isArray(data)) data = [data]; // 单条也转数组
      const column = Object.keys(data[0]);      // 自动提取字段名
      await db.insertByColumn(tableName, column, data);
    },

    // 查询整张表所有数据
    async selectAll() {
      return await db.selectTableData(tableName);
    },

    // 条件查询（使用 WHERE）
    async selectWhere(conditions) {
      const conditionStr = formatConditions(conditions);
      return await db.selectTableData(tableName, conditionStr);
    },

    // 条件更新
    async updateData(data, conditions) {
      const setStr = formatSetClause(data);
      return await db.updateTableData_multiCondition(tableName, setStr, conditions);
    },

    // 条件删除
    async deleteWhere(conditions) {
      const conditionStr = formatConditions(conditions);
      return await db.deleteTableData(tableName, conditionStr);
    },

    // 删除整张表
    async dropTable() {
      return await db.dropTable(tableName);
    },

    // 获取记录总数
    async getCount() {
      return await db.getCount(tableName);
    },

    // 获取最近一次插入的主键 ID
    async getLastInsertId() {
      return await db.getLastInsertId(tableName);
    },

    // 获取某个主键字段的最大值
    async getMaxPrimaryKey(primaryKey) {
      return await db.getMaxPrimaryKey(tableName, primaryKey);
    },

    // 分页查询（按主键偏移）
    async pullWithPagination(id, offset = 0, limit = 15) {
      return await db.pullSQL(tableName, id, offset);
    }
  };
}

// 以下是各个表的定义，每张表通过 createTableModule 统一生成操作接口

export const UsersTable = createTableModule("users", `
  user_id INTEGER PRIMARY KEY AUTOINCREMENT,
  nickname TEXT NOT NULL,
  avatar TEXT,
  level INTEGER DEFAULT 1,
  role TEXT NOT NULL,
  credit_score INTEGER DEFAULT 100,
  total_distance REAL DEFAULT 0.0,
  carpool_count INTEGER DEFAULT 0,
  phone_number TEXT UNIQUE NOT NULL,
  password_login TEXT NOT NULL,
  password_pay TEXT,
  verified BOOLEAN DEFAULT FALSE
`);

export const ChatGroupsTable = createTableModule("chat_groups", `
  group_id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  group_name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
`);

export const GroupMembersTable = createTableModule("group_members", `
  member_id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  role TEXT NOT NULL
`);

export const ChatMessagesTable = createTableModule("chat_messages", `
  message_id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  message_text TEXT NOT NULL,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
`);

export const WalletsTable = createTableModule("wallets", `
  user_id INTEGER PRIMARY KEY,
  balance REAL DEFAULT 0.0,
  wechat_account TEXT UNIQUE,
  is_wechat_bound BOOLEAN DEFAULT FALSE,
  alipay_account TEXT UNIQUE,
  is_alipay_bound BOOLEAN DEFAULT FALSE
`);

export const TransactionsTable = createTableModule("transactions", `
  transaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  transaction_time DATETIME DEFAULT CURRENT_TIMESTAMP
`);

export const OrdersTable = createTableModule("orders", `
  order_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  start_location TEXT NOT NULL,
  end_location TEXT NOT NULL,
  status TEXT NOT NULL,
  fare REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
`);

// 批量创建所有表（在数据库初始化时调用）
export async function createAllTables() {
  await UsersTable.createTable();
  await ChatGroupsTable.createTable();
  await GroupMembersTable.createTable();
  await ChatMessagesTable.createTable();
  await WalletsTable.createTable();
  await TransactionsTable.createTable();
  await OrdersTable.createTable();
}

/* ========== 使用示例 ==========

import { UsersTable, OrdersTable ,createAllTables} from '@/utils/tables';

// 初始化数据库并创建所有表
await createAllTables();

// 插入新用户
await UsersTable.insertData({
  nickname: '小明',
  role: '乘客',
  phone_number: '13800001111',
  password_login: '123456'
});

// 条件查询
const drivers = await UsersTable.selectWhere({ role: '司机' });

// 更新用户积分
await UsersTable.updateData({ credit_score: 95 }, { user_id: 1 });

// 删除某条订单
await OrdersTable.deleteWhere({ order_id: 42 });

// 查询所有消息
const messages = await ChatMessagesTable.selectAll();

// 获取钱包最大 user_id
const maxId = await WalletsTable.getMaxPrimaryKey('user_id');

*/
