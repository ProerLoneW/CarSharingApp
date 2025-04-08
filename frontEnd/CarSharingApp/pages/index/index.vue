<template>
  <view class="content">
    <!-- 输入起点和终点 -->
    <view class="input-area">
      <input v-model="startPoint" placeholder="请输入起点" />
      <input v-model="endPoint" placeholder="请输入终点" />
      <button @click="planRoute">规划路径</button>
    </view>

    <!-- H5 用 AMap API -->
    <div v-if="platform === 'h5'" id="mapContainer" style="width: 100%; height: 500px;"></div>

    <!-- App 用原生 map -->
    <map v-else
      style="width: 100%; height: 500px;"
      :longitude="longitude"
      :latitude="latitude"
      :markers="markers"
      :polyline="polyline"
      scale="13">
    </map>
  </view>
</template>

<script>
export default {
  data() {
    return {
      platform: process.env.VUE_APP_PLATFORM, // 获取当前平台
      longitude: 116.397428, // 默认经度（天安门）
      latitude: 39.90923, // 默认纬度（天安门）
      markers: [], // 地图上的标记
      polyline: [], // 路径
      startPoint: '', // 起点
      endPoint: '', // 终点
    };
  },
  mounted() {
    if (this.platform === 'h5') {
      this.loadMapScript().then(() => {
        this.initH5Map();
      }).catch(error => {
        console.error('地图脚本加载失败：', error);
      });
    }

    // 在组件加载后初始化同济大学嘉定校区位置
    this.getTongjiUniversityLocation().then((location) => {
      this.longitude = location[0];
      this.latitude = location[1];
    }).catch(error => {
      console.error("获取同济大学嘉定校区位置失败：", error);
    });
  },
  methods: {
    // 加载高德地图 JS 脚本（仅在H5平台使用）
    loadMapScript() {
      return new Promise((resolve, reject) => {
        if (typeof AMap !== 'undefined') {
          resolve();
        } else {
          const script = document.createElement('script');
          script.src = 'https://webapi.amap.com/maps?v=2.0&key=d31589b1c32fb3c269b2700f8d050e43&plugin=AMap.Driving,AMap.Geocoder';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        }
      });
    },

    // 初始化 H5 地图
    initH5Map() {
      this.map = new AMap.Map("mapContainer", {
        center: [this.longitude, this.latitude],
        zoom: 13,
      });
    },

    // 获取同济大学嘉定校区经纬度
    async getTongjiUniversityLocation() {
      const address = "同济大学嘉定校区";
      const geocodeUrl = `https://restapi.amap.com/v3/geocode/geo?key=81708c4f856b6a0c5722ae083d93afa6&address=${encodeURIComponent(address)}`;

      try {
        const res = await uni.request({
          url: geocodeUrl,
          method: 'GET',
        });
        if (res.data.status === "1" && res.data.geocodes && res.data.geocodes.length > 0) {
          const location = res.data.geocodes[0].location.split(',');
          return [parseFloat(location[0]), parseFloat(location[1])]; // 经纬度 [longitude, latitude]
        } else {
          throw new Error('未找到同济大学嘉定校区的位置');
        }
      } catch (error) {
        console.error(error);
        return [116.397428, 39.90923]; // 默认的经纬度，如果发生错误，使用默认值
      }
    },

    // 地理编码：将地名转换为经纬度（使用高德地理编码API）
    geocodeAddress(address) {
      return new Promise((resolve, reject) => {
        const geocodeUrl = `https://restapi.amap.com/v3/geocode/geo?key=81708c4f856b6a0c5722ae083d93afa6&address=${encodeURIComponent(address)}`;

        uni.request({
          url: geocodeUrl,
          method: 'GET',
          success: (res) => {
            if (res.data.status === "1" && res.data.geocodes && res.data.geocodes.length > 0) {
              const location = res.data.geocodes[0].location.split(',');
              const lngLat = [parseFloat(location[0]), parseFloat(location[1])]; // 经纬度 [longitude, latitude]
              resolve(lngLat);
            } else {
              reject('地理编码失败：未找到该地点');
            }
          },
          fail: (error) => {
            reject(`地理编码请求失败：${error}`);
          }
        });
      });
    },

    // 通过高德 Web 服务 API 获取路径规划
    getDrivingRoute(startLngLat, endLngLat) {
      const url = `https://restapi.amap.com/v3/direction/driving?key=81708c4f856b6a0c5722ae083d93afa6&origin=${startLngLat[0]},${startLngLat[1]}&destination=${endLngLat[0]},${endLngLat[1]}&strategy=0`;

      return new Promise((resolve, reject) => {
        uni.request({
          url: url,
          method: 'GET',
          success: (res) => {
            if (res.data.status === "1" && res.data.route) {
              resolve(res.data.route.paths[0].steps);
            } else {
              reject('路径规划失败');
            }
          },
          fail: (error) => {
            reject('路径规划请求失败：' + error);
          }
        });
      });
    },

    // 规划路径
    async planRoute() {
      if (this.startPoint && this.endPoint) {
        console.log("开始地理编码...");

        try {
          // 获取起点和终点经纬度
          const startLngLat = await this.geocodeAddress(this.startPoint); // 获取起点经纬度
          const endLngLat = await this.geocodeAddress(this.endPoint); // 获取终点经纬度

          console.log("起点经纬度:", startLngLat);
          console.log("终点经纬度:", endLngLat);

          // H5 环境下使用高德地图 API 绘制路径
          if (this.platform === 'h5') {
            this.map.clearMap(); // 清除已有的地图标记和路径
            new AMap.Marker({
              position: startLngLat,
              map: this.map,
              title: '起点',
            });
            new AMap.Marker({
              position: endLngLat,
              map: this.map,
              title: '终点',
            });

            const pathSteps = await this.getDrivingRoute(startLngLat, endLngLat);
            const path = pathSteps.map(step => {
              return step.polyline.split(';').map(coord => {
                const [lng, lat] = coord.split(',').map(Number);
                return new AMap.LngLat(lng, lat);
              });
            });

            path.forEach(p => {
              new AMap.Polyline({
                path: p,
                strokeColor: "#3388FF", // 线条颜色
                strokeOpacity: 1, // 透明度
                strokeWeight: 6, // 线条宽度
                map: this.map
              });
            });
          } else {
            // 在原生 map 组件中，绘制路径和标记
            this.markers = [
              { longitude: startLngLat[0], latitude: startLngLat[1], title: '起点' },
              { longitude: endLngLat[0], latitude: endLngLat[1], title: '终点' },
            ];

            const pathSteps = await this.getDrivingRoute(startLngLat, endLngLat);
            this.polyline = pathSteps.map(step => {
              return {
                points: step.polyline.split(';').map(coord => {
                  const [lng, lat] = coord.split(',').map(Number);
                  return { longitude: lng, latitude: lat };
                }),
                color: '#3388FF', // 线条颜色
                width: 6,
                dottedLine: false
              };
            });
          }
        } catch (error) {
          console.error('路径规划失败：', error);
        }
      } else {
        console.log("请输入有效的起点和终点！");
      }
    },
  }
};
</script>

<style>
.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.input-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

.input-area input {
  margin-bottom: 10px;
  padding: 10px;
  width: 200px;
}

.input-area button {
  padding: 10px;
  background-color: #007aff;
  color: white;
  border: none;
  border-radius: 5px;
}

#mapContainer {
  width: 100%;
  height: 500px;
}
</style>
