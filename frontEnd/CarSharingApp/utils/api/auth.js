import request from '../request.js'; // 引入封装好的请求函数

// 用户注册
export function signup(nickname, phone_number, password_login) {
  return request({
    url: '/signup', // 注册接口
    method: 'POST',
    data: {
      nickname: nickname,
      phone_number: phone_number,
      password_login: password_login
    }
  }).then(response => {
    // 注册成功后的处理
    if (response.status === 200 && response.data.message) {
      uni.showToast({
        title: response.data.message,
        icon: 'success'
      });
      return response.data; // 返回注册成功信息
    } else {
      // 错误处理，如昵称已被使用
      if (response.data.error) {
        uni.showToast({
          title: response.data.error,
          icon: 'none'
        });
        throw new Error(response.data.error);
      }
    }
  }).catch(error => {
    console.error('注册失败', error);
    throw error;
  });
}

// 用户登录
export function login(phone_number, password_login) {
  return request({
    url: '/login', // 登录接口
    method: 'POST',
    data: {
      phone_number: phone_number,
      password_login: password_login
    }
  }).then(response => {
    // 登录成功后的处理
    if (response.status === 200 && response.data.user_id) {
      // 登录成功后，存储用户ID
      uni.setStorageSync('user_id', response.data.user_id);
      uni.showToast({
        title: '登录成功',
        icon: 'success'
      });
      return response.data; // 返回用户ID
    } else {
      // 错误处理，如用户不存在
      if (response.data.error) {
        uni.showToast({
          title: response.data.error,
          icon: 'none'
        });
        throw new Error(response.data.error);
      }
    }
  }).catch(error => {
    console.error('登录失败', error);
    throw error;
  });
}

// 用户登出
export function logout() {
  return request({
    url: '/logout', // 登出接口
    method: 'POST'
  }).then(response => {
    // 登出成功后的处理
    if (response.status === 200 && response.data.message) {
      // 清除存储的用户信息
      uni.removeStorageSync('user_id');
      uni.showToast({
        title: response.data.message,
        icon: 'success'
      });
      return true; // 返回登出成功
    } else {
      // 错误处理
      if (response.data.error) {
        uni.showToast({
          title: response.data.error,
          icon: 'none'
        });
        throw new Error(response.data.error);
      }
    }
  }).catch(error => {
    console.error('登出失败', error);
    throw error;
  });
}

//How to use
// import { signup, login, logout } from './auth';

// // 注册
// signup('JohnDoe', '1234567890', 'my_password').then(data => {
//   console.log('注册成功', data);
// }).catch(error => {
//   console.error('注册失败', error);
// });

// // 登录
// login('1234567890', 'my_password').then(data => {
//   console.log('登录成功', data);
// }).catch(error => {
//   console.error('登录失败', error);
// });

// // 登出
// logout().then(() => {
//   console.log('登出成功');
// }).catch(error => {
//   console.error('登出失败', error);
// });
