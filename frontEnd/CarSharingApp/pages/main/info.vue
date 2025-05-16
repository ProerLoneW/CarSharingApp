<template>
	<view class="container">
		<!-- 行程进行中卡片 -->
		<view v-if="isRiding" class="riding-card">
			<text class="title">行程进行中</text>
			<view class="title_divider"></view>
			<view class="info-row">
				<view class="info-item">
					<text class="info-label">{{ traveledDistance }} km</text>
					<text class="info-desc">已行驶</text>
				</view>
				<view class="info_divider"></view>
				<view class="info-item">
					<text class="info-label">{{ elapsedTime }} min</text>
					<text class="info-desc">已用时</text>
				</view>
			</view>
		</view>

		<!-- 地图部分 -->
		<map id="map" class="map-area" :longitude="longitude" :latitude="latitude" :markers="markers"
			:polyline="polyline" :scale="scale" show-location @ready="onMapReady" @markertap="handleMarkerTap">
		</map>

		<!-- 底部卡片 -->
		<view class="bottom-card">

			<view v-if="isRiding" class="combined-info-column">
				<!-- 订单信息 -->
				<view class="order-info">
					<text class="amount">
						价格：<text style="color: #e60000;">{{ orderInfo.totalAmount }}</text>元
					</text>
					<text class="remaining-info">
						剩余：<text style="color: #3db8b5;">{{ orderInfo.remainingDistance }} </text>km
						<text style="color: #3db8b5;">{{ orderInfo.remainingTime }} </text>min
					</text>
				</view>

				<!-- 分隔线 -->
				<view class="divider-line"></view>

				<!-- 司机信息 -->
				<view class="driver-info">
					<image class="driver-avatar" :src="driverInfo.avatar"></image>
					<view class="driver-details">
						<text class="license-plate">{{ driverInfo.licensePlate }}</text>
						<view class="driver-name-phone">
							<text>{{ driverInfo.driverName }}</text>
							<text style="margin-left: 20rpx;">{{ driverInfo.phoneNumber }}</text>
						</view>
						<view class="rating">
							<text style="color: #fd6d30;">★★★★</text>
							<text style="margin-left: 10rpx;">{{ driverInfo.rating }}分</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 起点项 -->
			<view v-if="!isRiding" class="start-section" @click="navigateToSearch('startPoint')">
				<text class="icon-dot green-dot">●</text>
				<text class="green-text">{{ startPoint || '同济大学四平路校区' }}</text>
				<view class="arrow-section">
					<text class="arrow-text">上车</text>
					<image class="arrow-icon" src="/static/image/arrow_right.png"></image>
				</view>
			</view>

			<!-- 终点项 -->
			<view v-if="!isRiding" class="end-section" @click="navigateToSearch('endPoint')">
				<text class="icon-dot red-dot">●</text>
				<text class="end-placeholder">{{ endPoint || '你要去哪儿？' }}</text>
			</view>

			<!-- 快捷地址设置区 -->
			<view v-if="!isRiding" class="address-shortcuts">
				<view class="shortcut-item home-item" @click="handleSettings('home')">
					<text class="shortcut-label">家</text>
					<text class="shortcut-desc">设置家的地址</text>
				</view>
				<view class="shortcut-item school-item" @click="handleSettings('school')">
					<text class="shortcut-label">学校</text>
					<text class="shortcut-desc">设置学校的地址</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {

				isRiding: false, // 是否开始行车,用于切换首页状态！！！！！
				api_key: '', // 高德地图 api 放在全局数据中方便管理
				longitude: null,
				latitude: null,
				markers: [],
				polyline: [],
				scale: 13,
				startPoint: '获取中...',
				startLngLat: [], // 初始起点经纬度
				endPoint: '', // 初始终点
				endLngLat: null, // 初始终点经纬度
				currentLocation: [121.297032, 31.267517], // 行程中的当前位置
				orderEndPoint: '同济大学嘉定校区', // 行程中的终点
				orderEndLngLat: [121.214111, 31.286406], // 行程中的终点经纬度
				orderInfo: {
					totalAmount: 30, // 订单总金额（元）
					remainingDistance: 8.5, // 剩余距离（公里）
					remainingTime: 15, // 剩余时间（分钟）
				},
				driverInfo: {
					avatar: '/static/image/driver_avatar.png', // 司机头像
					licensePlate: '沪A·12345', // 车牌号
					driverName: '张师傅', // 司机姓名
					phoneNumber: '18181812358', // 司机电话
					rating: 4.0, // 司机评分
				},
			};
		},
		onReady() {
			const app = getApp();
			this.api_key = app.globalData.api_key;
			if (this.isRiding === true) {
				this.planRouteWithCoordinates(); // 绘制从当前位置到终点的路线
			} else {
				this.getCurrentLocation(); // 调用定位函数
			}
		},
		mounted() {
			uni.$on('updateLocation', this.updateLocationFromSearch);
		},
		beforeDestroy() {
			uni.$off('updateLocation', this.updateLocationFromSearch);
		},
		methods: {
			handleSettings(type) {
				uni.showToast({
					title: '点击了设置地址功能',
					icon: 'none'
				});
			},

			handleMarkerTap(e) {
				const markerId = e.detail.markerId;

				// 找到被点击的 marker 数据
				const clickedMarker = this.markers.find(marker => marker.id === markerId);

				if (clickedMarker) {
					uni.showToast({
						title: clickedMarker.title,
						icon: 'none'
					});
				}
			},

			// 绘制起点 
			initAppMap() {
				this.markers = [{
					id: 1,
					title: this.startPoint,
					longitude: this.longitude,
					latitude: this.latitude,
					iconPath: '/static/image/point_start.png', // 使用内置图标
					width: 1,
					height: 1,
					anchor: {
						x: 0.5,
						y: 0.5
					},
				}];
			},
			// 获取当前手机定位
			getCurrentLocation() {
			    uni.getLocation({
			      type: 'wgs84', // 坐标系类型，高德API需要'gcj02'或'wgs84'，需根据实际情况调整
			      success: async (res) => {
					console.log('当前位置的经度：' + res.longitude);
					console.log('当前位置的纬度：' + res.latitude);
			        this.longitude = res.longitude;
			        this.latitude = res.latitude;
			        
			        // 调用高德逆地理编码API获取地址
			        try {
			          const address = await this.reverseGeocode(this.longitude, this.latitude);
			          this.currentAddress = address;
			          // 更新起点信息
			          this.startPoint = address;
			          this.startLngLat = [this.longitude, this.latitude];
			          // 初始化地图（使用实时经纬度）
			          this.initAppMap();
			        } catch (error) {
			          console.error('逆地理编码失败:', error);
			          this.currentAddress = '定位失败，请手动设置起点';
			        }
			      },
			      fail: (error) => {
			        console.error('定位失败:', error);
			        this.currentAddress = '定位失败，请手动设置起点';
			      }
			    });
			  },
			
			  // 逆地理编码函数（将经纬度转换为地址）
			  reverseGeocode(lng, lat) {
			    return new Promise((resolve, reject) => {
			      const url = `https://restapi.amap.com/v3/geocode/regeo?key=${this.api_key}&location=${lng},${lat}&extensions=base`;
			      
			      uni.request({
			        url,
			        method: 'GET',
			        success: (res) => {
			          if (res.data.status === '1') {
			            // 解析地址（示例：取格式化地址）
			            const address = res.data.regeocode.formatted_address;
			            resolve(address);
			          } else {
			            reject('逆地理编码失败：' + res.data.info);
			          }
			        },
			        fail: (error) => {
			          reject('逆地理编码请求失败：' + error);
			        }
			      });
			    });
			  },
			
			// 更新当前位置
			updateLocation(lng, lat) {
				this.longitude = lng;
				this.latitude = lat;
				this.markers = [{
					id: 1,
					title: this.startPoint,
					longitude: lng,
					latitude: lat,
					iconPath: "/static/image/point_start.png", // 使用内置图标
					width: 10,
					height: 10,
					anchor: {
						x: 0.5,
						y: 0.5
					},
				}];
				console.log('startpoint:', this.startPoint, this.startLngLat);
			},

			// 地理编码：将地名转换为经纬度（使用高德地理编码API）
			geocodeAddress(address) {
				return new Promise((resolve, reject) => {
					const geocodeUrl =
						`https://restapi.amap.com/v3/geocode/geo?key=${this.api_key}&address=${encodeURIComponent(address)}`;

					uni.request({
						url: geocodeUrl,
						method: 'GET',
						success: (res) => {
							if (res.data.status === "1" && res.data.geocodes && res.data.geocodes
								.length > 0) {
								const location = res.data.geocodes[0].location.split(',');
								const lngLat = [parseFloat(location[0]), parseFloat(location[
									1])]; // 经纬度 [longitude, latitude]
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
				const url =
					`https://restapi.amap.com/v3/direction/driving?key=81708c4f856b6a0c5722ae083d93afa6&origin=${startLngLat[0]},${startLngLat[1]}&destination=${endLngLat[0]},${endLngLat[1]}&strategy=0`;

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
			planRouteWithCoordinates() {
				if (this.isRiding) {
					const currentLocation = this.currentLocation;
					const orderEndLngLat = this.orderEndLngLat;

					if (!currentLocation || !orderEndLngLat) return;

					// 设置标记点
					this.markers = [{
							id: 1,
							longitude: currentLocation[0],
							latitude: currentLocation[1],
							title: '当前位置',
							iconPath: "/static/image/car.png"
						},
						{
							id: 2,
							longitude: orderEndLngLat[0],
							latitude: orderEndLngLat[1],
							title: this.orderEndPoint,
							iconPath: "/static/image/point_end.png"
						}
					];

					// 获取路径
					this.getDrivingRoute(currentLocation, orderEndLngLat).then(pathSteps => {
						this.polyline = pathSteps.map(step => ({
							points: step.polyline.split(';').map(coord => {
								const [lng, lat] = coord.split(',').map(Number);
								return {
									longitude: lng,
									latitude: lat
								};
							}),
							color: '#3388FF',
							width: 20,
							dottedLine: false
						}));

						// 调整地图视图
						this.adjustMapView();
					});
				} else {
					const startLngLat = this.startLngLat;
					const endLngLat = this.endLngLat;

					if (!startLngLat || !endLngLat) return;

					// 设置标记点
					this.markers = [{
							id: 1,
							longitude: startLngLat[0],
							latitude: startLngLat[1],
							title: this.startPoint,
							iconPath: "/static/image/point_start.png"
						},
						{
							id: 2,
							longitude: endLngLat[0],
							latitude: endLngLat[1],
							title: this.endPoint,
							iconPath: "/static/image/point_end.png"
						}
					];

					// 获取路径
					this.getDrivingRoute(startLngLat, endLngLat).then(pathSteps => {
						this.polyline = pathSteps.map(step => ({
							points: step.polyline.split(';').map(coord => {
								const [lng, lat] = coord.split(',').map(Number);
								return {
									longitude: lng,
									latitude: lat
								};
							}),
							color: '#3388FF',
							width: 20,
							dottedLine: false
						}));

						// 调整地图视图
						this.adjustMapView();
					});
				}
			},

			adjustMapView() {
				// 收集所有点（包括标记点和路径点）
				let allPoints = [];

				// 添加标记点
				this.markers.forEach(marker => {
					allPoints.push({
						longitude: marker.longitude,
						latitude: marker.latitude
					});
				});

				// 添加路径点
				this.polyline.forEach(line => {
					line.points.forEach(point => {
						allPoints.push(point);
					});
				});

				// 计算边界框
				const bounds = this.calculateBounds(allPoints);

				// 设置地图中心点为起点和终点的中间位置
				const centerLng = (bounds.minLng + bounds.maxLng) / 2;
				const centerLat = (bounds.minLat + bounds.maxLat) / 2;

				// 设置地图中心点和缩放级别
				this.longitude = centerLng;
				this.latitude = centerLat;
				this.scale = this.calculateScale(bounds); // 根据距离设置合适的缩放级别
				console.log('scale', this.scale);
			},

			calculateBounds(points) {
				let minLng = Infinity;
				let maxLng = -Infinity;
				let minLat = Infinity;
				let maxLat = -Infinity;

				points.forEach(p => {
					minLng = Math.min(minLng, p.longitude);
					maxLng = Math.max(maxLng, p.longitude);
					minLat = Math.min(minLat, p.latitude);
					maxLat = Math.max(maxLat, p.latitude);
				});

				return {
					minLng,
					maxLng,
					minLat,
					maxLat
				};
			},

			// 根据边界框大小估算缩放级别
			calculateScale(bounds) {
				const systemInfo = uni.getSystemInfoSync();
				const widthInPx = systemInfo.windowWidth;

				const deltaLng = bounds.maxLng - bounds.minLng;
				const deltaLat = bounds.maxLat - bounds.minLat;

				// 添加 padding 防止贴边
				const padding = 0.2;
				const paddedDeltaLng = deltaLng * (1 + padding);
				const paddedDeltaLat = deltaLat * (1 + padding);

				// 每个经度约 111319 米，每个纬度约 110574 米
				const metersPerPixel = (paddedDeltaLng * 111319 + paddedDeltaLat * 110574) / widthInPx;

				// 缩放级别估算
				const baseZoomLevel = 17;
				let scale = baseZoomLevel - Math.log(metersPerPixel) / Math.LN2;

				// 返回合理范围内的 scale
				return Math.max(3, Math.min(18, Math.floor(scale)));
			},

			// 导航到搜索页面
			navigateToSearch(type) {
				uni.navigateTo({
					url: `/pages/main/search?searchType=${type}`
				});
			},

			// 从搜索页面更新位置
			updateLocationFromSearch(data) {
				const {
					type,
					location,
					lngLat
				} = data;

				if (type === 'startPoint') {
					this.startPoint = location;
					this.startLngLat = lngLat;
				} else if (type === 'endPoint') {
					this.endPoint = location;
					this.endLngLat = lngLat;
				}

				// 更新地图位置
				this.updateLocation(lngLat[0], lngLat[1]);

				// 如果终点已设置，则规划路径
				if (this.endPoint && this.startPoint) {
					this.planRouteWithCoordinates();
				}
			},
		},
		computed: {
			traveledDistance() {
				// 示例：假设已行驶 15km
				return 15;
			},
			elapsedTime() {
				// 示例：假设已用时 8.5min
				return 8.5;
			}
		}
	};
</script>

<style scoped>
	.container {
		position: relative;
		width: 100%;
		height: 100vh;
		background-color: #f5f5f5;
		display: flex;
		flex-direction: column;
	}

	.map-area {
		width: 100%;
		flex: 1;
		height: calc(100vh - 460rpx);
	}

	.bottom-card {
		width: 100%;
		padding: 20rpx 30rpx;
		background-color: #ffffff;
		border-top-left-radius: 24rpx;
		border-top-right-radius: 24rpx;
		box-shadow: 0 -2rpx 20rpx rgba(0, 0, 0, 0.08);
		z-index: 999;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		gap: 20rpx;
	}

	.icon-dot {
		font-size: 20rpx;
		margin-right: 10rpx;
	}

	.green-dot {
		color: #00c800;
	}

	.red-dot {
		color: #e60000;
	}

	.start-section {
		display: flex;
		align-items: center;
		padding: 24rpx 30rpx;
		background-color: #ffffff;
		border-radius: 30rpx;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
		position: relative;
	}

	.green-text {
		color: #00c800;
		font-weight: bold;
		font-size: 28rpx;
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.arrow-section {
		display: flex;
		align-items: center;
		color: #000;
		font-size: 28rpx;
	}

	.arrow-text {
		color: #000;
		margin-right: 8rpx;
	}

	.arrow-icon {
		width: 20rpx;
		height: 20rpx;
	}

	.end-section {
		display: flex;
		align-items: center;
		padding: 24rpx 30rpx;
		background-color: #ffffff;
		border-radius: 30rpx;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
		font-size: 28rpx;
		color: #333;
		font-weight: bold;
	}

	.end-placeholder {
		color: #333;
	}

	.address-shortcuts {
		display: flex;
		justify-content: space-between;
	}

	.shortcut-item {
		flex: 1;
		margin: 0 10rpx;
		padding: 20rpx;
		background-color: #ffffff;
		border-radius: 15rpx;
		text-align: left;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
	}

	.home-item {
		margin-left: 0%;
		margin-right: 1%;
	}

	.school-item {
		margin-left: 1%;
		margin-right: 0%;
	}

	.shortcut-label {
		font-size: 28rpx;
		font-weight: bold;
		color: #333;
		display: block;
		margin-bottom: 10rpx;
	}

	.shortcut-desc {
		font-size: 24rpx;
		color: #999;
	}

	.riding-card {
		background-color: #fff;
		border-radius: 20rpx;
		padding: 30rpx 20rpx;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
	}

	.title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
		margin-top: 20rpx;
		margin-bottom: 20rpx;
	}

	.title_divider {
		width: 1000rpx;
		height: 3rpx;
		background-color: #888;
		margin-bottom: 20rpx;
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		color: #333;
		width: 100%;
		box-sizing: border-box;
	}

	.info-item {
		flex: 1;
		text-align: center;
	}

	.info_divider {
		width: 3rpx;
		height: 100rpx;
		background-color: #bbb;
	}

	.info-label {
		font-size: 36rpx;
		font-weight: bold;
		color: #333;
		display: block;
		margin-bottom: 8rpx;
	}

	.info-desc {
		font-size: 24rpx;
		color: #999;
	}

	.distance {
		color: #00c800;
	}

	.time {
		color: #e60000;
	}

	.combined-info-column {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		justify-content: space-between;
		height: 100%;
		margin-top: 20rpx;
	}

	.order-info {
		display: flex;
		justify-content: space-between;
		font-size: 40rpx;
		color: #333;
		gap: 40rpx;
	}

	.amount {
		margin-left: 60rpx;
		font-weight: bold;
	}

	.remaining-info {
		font-weight: bold;
	}

	.divider-line {
		width: 100%;
		height: 2rpx;
		background-color: #ccc;
		margin-top: 30rpx;
		margin-bottom: 10rpx;
	}

	.driver-info {
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		gap: 80rpx;
	}

	.driver-avatar {
		width: 110rpx;
		height: 110rpx;
		border-radius: 50%;
		margin-left: 60rpx;
	}

	.driver-details {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
	}

	.license-plate {
		font-size: 40rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 10rpx;
	}

	.driver-name-phone {
		display: flex;
		justify-content: space-between;
		font-size: 22rpx;
		color: #333;
	}

	.rating {
		font-size: 20rpx;
		color: #333;
		margin-top: 10rpx;
	}
</style>