import request from '../request.js'; // 导入封装的请求函数

// 登录
export function login(username, password) {
  return request({
    url: '/login', // 登录的接口地址
    method: 'POST',
    data: {
      username: username,
      password: password
    }
  }).then(response => {
    // 登录成功后的处理
    if (response.status === 200 && response.data.token) {
      // 存储登录信息
      uni.setStorageSync('token', response.data.token);
      uni.setStorageSync('user', response.data.user);
      return response.data; // 返回登录的用户数据
    } else {
      throw new Error('登录失败');
    }
  }).catch(error => {
    // 处理登录失败的情况
    uni.showToast({
      title: '登录失败',
      icon: 'none'
    });
    throw error; // 抛出错误
  });
}

// 登出
export function logout() {
  return request({
    url: '/logout', // 登出的接口地址
    method: 'POST'
  }).then(response => {
    // 登出成功后的处理
    if (response.status === 200) {
      // 清除存储的用户信息和 token
      uni.removeStorageSync('token');
      uni.removeStorageSync('user');
      uni.showToast({
        title: '登出成功',
        icon: 'success'
      });
      return true; // 返回登出成功
    } else {
      throw new Error('登出失败');
    }
  }).catch(error => {
    // 处理登出失败的情况
    uni.showToast({
      title: '登出失败',
      icon: 'none'
    });
    throw error; // 抛出错误
  });
}



//How to use
// import { login, logout } from './auth';

// // 登录
// login('username', 'password').then(userData => {
//   console.log('登录成功', userData);
// }).catch(error => {
//   console.error('登录失败', error);
// });

// // 登出
// logout().then(() => {
//   console.log('登出成功');
// }).catch(error => {
//   console.error('登出失败', error);
// });
