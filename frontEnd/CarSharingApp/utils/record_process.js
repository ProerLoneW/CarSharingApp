import request from './request.js'; // 引入封装好的请求函数

// 增加记录
export function addRecord(table_name, record_data) {
  return request({
    url: '/add', // 增加记录接口
    method: 'POST',
    data: {
      table_name: table_name,
      record_data: record_data
    }
  }).then(response => {
    if (response.status === 200 && response.data.message) {
      uni.showToast({
        title: response.data.message,
        icon: 'success'
      });
      return response.data; // 返回新增记录的ID
    } else {
      throw new Error('增加记录失败');
    }
  }).catch(error => {
    console.error('增加记录失败', error);
    throw error;
  });
}

// 删除记录
export function deleteRecord(table_name, record_id) {
  return request({
    url: '/delete', // 删除记录接口
    method: 'DELETE',
    data: {
      table_name: table_name,
      record_id: record_id
    }
  }).then(response => {
    if (response.status === 200 && response.data.message) {
      uni.showToast({
        title: response.data.message,
        icon: 'success'
      });
      return true; // 返回删除成功
    } else {
      throw new Error('删除记录失败');
    }
  }).catch(error => {
    console.error('删除记录失败', error);
    throw error;
  });
}

// 修改记录
export function updateRecord(table_name, record_id, field, value) {
  return request({
    url: '/update', // 修改记录接口
    method: 'PUT',
    data: {
      table_name: table_name,
      record_id: record_id,
      field: field,
      value: value
    }
  }).then(response => {
    if (response.status === 200 && response.data.message) {
      uni.showToast({
        title: response.data.message,
        icon: 'success'
      });
      return true; // 返回修改成功
    } else {
      throw new Error('修改记录失败');
    }
  }).catch(error => {
    console.error('修改记录失败', error);
    throw error;
  });
}

// 查询记录（全局或局部查询）
export function queryRecords(table_name, record_id = null) {
  const url = record_id ? `/query?table_name=${table_name}&record_id=${record_id}` : `/query?table_name=${table_name}`;
  
  return request({
    url: url, // 查询记录接口
    method: 'GET'
  }).then(response => {
    if (response.status === 200 && response.data) {
      return response.data; // 返回查询结果
    } else {
      throw new Error('查询记录失败');
    }
  }).catch(error => {
    console.error('查询记录失败', error);
    throw error;
  });
}


//How to use
// 增加记录
// addRecord('users', { nickname: 'JohnDoe', phone_number: '1234567890', password_login: 'hashed_password' }).then(data => {
//   console.log('记录添加成功', data);
// }).catch(error => {
//   console.error('记录添加失败', error);
// });

// // 删除记录
// deleteRecord('users', 1).then(() => {
//   console.log('记录删除成功');
// }).catch(error => {
//   console.error('记录删除失败', error);
// });

// // 更新记录
// updateRecord('users', 1, 'nickname', 'NewJohnDoe').then(() => {
//   console.log('记录更新成功');
// }).catch(error => {
//   console.error('记录更新失败', error);
// });

// // 查询记录
// queryRecords('users').then(data => {
//   console.log('查询记录成功', data);
// }).catch(error => {
//   console.error('查询记录失败', error);
// });
