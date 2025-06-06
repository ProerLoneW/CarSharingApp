<template>
  <view class="salaryflow-container">
    <!-- 顶部导航栏 -->
    <view class="top-bar">
      <view class="back-button" @tap="goBack">
        <image src="/static/image/icon_back.png" class="back-icon"></image>
      </view>
      <text class="title">工资流水</text>
    </view>

    <!-- 弹窗遮罩层 -->
    <view v-if="showFilterPanel" class="overlay" @tap="closeFilterPanel"></view>

    <!-- 弹窗筛选面板 -->
    <view v-if="showFilterPanel" class="filter-popup">
      <image
        src="/static/image/icon_close.png"
        class="filter-close-icon"
        @tap="closeFilterPanel"
      />
      <view class="filter-row">
        <text class="filter-label">日期范围:</text>
        <input type="date" v-model="startDate" placeholder="例:2025-04-27" />
        <text>——</text>
        <input type="date" v-model="endDate" placeholder="例:2025-04-28" />
      </view>
      <view class="filter-actions">
        <button class="apply-button" @tap="applyFilters">应用</button>
        <button class="reset-button" @tap="resetFilters">重置</button>
      </view>
    </view>

    <!-- 图表区域 -->
    <view class="chart-wrapper">
      <view class="chart-header">
        <text class="chart-title">流水柱状图</text>
        <view class="chart-actions">
          <view 
            class="chart-toggle-button" 
            :style="{ backgroundColor: incomeType === '拼车收入' ? '#4CAF50' : '#2196F3' }" 
            @tap="toggleIncomeType">
            <text :style="{ color: incomeType === '拼车收入' ? '#fff' : '#fff' }">
              {{ incomeType === '拼车收入' ? '显示提现' : '显示拼车收入' }}
            </text>
          </view>
          <view class="chart-filter-button" @tap="showFilter">
            <image src="/static/image/icon_filter_blue.png" class="filter-icon" />
          </view>
        </view>
      </view>
      <qiun-data-charts
        canvasId="barChart"
        type="column"
        :chartData="chartData"
        :opts="chartOpts"
        :canvas2d="true"
        :ontouch="true"
        style="height: 300px;"
      />
    </view>

    <!-- 流水列表 -->
    <scroll-view scroll-y class="flow-list">
      <view v-if="filteredFlows.length === 0" class="no-data">
        <text>没有流水记录</text>
      </view>

      <view class="flow-item" v-for="(flow, index) in filteredFlows" :key="index" @tap="goToFlowDetail(flow)">
        <view class="order-top-row">
          <text class="flow-id-bold">流水号 {{ flow.id }}</text>
        </view>
        <view class="order-middle-column">
          <text class="flow-date-gray">{{ flow.date }}</text>
          <text class="flow-amount-bold">¥{{ flow.amount }}</text>
          <view class="order-details">
            <text class="order-details-text">流水详情</text>
            <image src="/static/image/arrow_right.png" class="order-details-icon" />
          </view>
        </view>
        <view class="order-bottom-row">
          <view class="flow-type-item">
            <text class="flow-type-label">流水类型</text>
            <text class="flow-type-detail" :style="getFlowTypeStyle(flow.type)">{{ flow.type }}</text>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import qiunDataCharts from '@/uni_modules/qiun-data-charts/components/qiun-data-charts/qiun-data-charts.vue';

export default {
  components: {
    'qiun-data-charts': qiunDataCharts
  },
  data() {
    return {
      startDate: '',
      endDate: '',
      showFilterPanel: false,
      incomeType: '拼车收入',  // 新增的变量，用来控制显示类型
      flows: [
        { id: '2001', date: '2025-01-05', amount: 120, type: '拼车收入' },
        { id: '2002', date: '2025-01-18', amount: 90, type: '拼车收入' },
        { id: '2003', date: '2025-01-20', amount: 60, type: '提现' },
        { id: '2004', date: '2025-02-03', amount: 150, type: '拼车收入' },
        { id: '2005', date: '2025-02-17', amount: 100, type: '提现' },
        { id: '2006', date: '2025-02-28', amount: 130, type: '拼车收入' },
        { id: '2007', date: '2025-03-05', amount: 160, type: '拼车收入' },
        { id: '2008', date: '2025-03-15', amount: 95, type: '提现' },
        { id: '2009', date: '2025-03-22', amount: 80, type: '拼车收入' },
        { id: '2010', date: '2025-04-02', amount: 200, type: '拼车收入' },
        { id: '2011', date: '2025-04-14', amount: 110, type: '拼车收入' },
        { id: '2012', date: '2025-04-20', amount: 90, type: '提现' },
        { id: '2013', date: '2025-05-01', amount: 300, type: '拼车收入' },
        { id: '2014', date: '2025-05-10', amount: 60, type: '拼车收入' },
        { id: '2015', date: '2025-05-22', amount: 100, type: '提现' },
        { id: '2016', date: '2025-06-03', amount: 180, type: '拼车收入' },
        { id: '2017', date: '2025-06-17', amount: 70, type: '提现' },
        { id: '2018', date: '2025-06-29', amount: 150, type: '拼车收入' },
        { id: '2019', date: '2025-07-08', amount: 220, type: '拼车收入' },
        { id: '2020', date: '2025-07-19', amount: 50, type: '提现' },
        { id: '2021', date: '2025-08-02', amount: 140, type: '拼车收入' },
        { id: '2022', date: '2025-08-18', amount: 100, type: '拼车收入' },
        { id: '2023', date: '2025-08-28', amount: 60, type: '提现' },
        { id: '2024', date: '2025-09-04', amount: 175, type: '拼车收入' },
        { id: '2025', date: '2025-09-21', amount: 90, type: '拼车收入' },
        { id: '2026', date: '2025-10-10', amount: 200, type: '拼车收入' },
        { id: '2027', date: '2025-10-18', amount: 80, type: '提现' },
        { id: '2028', date: '2025-11-11', amount: 160, type: '拼车收入' },
        { id: '2029', date: '2025-11-25', amount: 70, type: '提现' },
        { id: '2030', date: '2025-12-05', amount: 190, type: '拼车收入' }
      ],
      chartData: {
        categories: [],
        series: []
      },
      chartOpts: {
        color: ['#4CAF50'],
        padding: [15, 10, 0, 15],
        enableScroll: true,
        legend: {},
        xAxis: {
          disableGrid: true,
          scrollShow: true,
          scrollAlign: 'left',
          itemCount: 5 // 同屏显示 5 个
        },
        yAxis: {
          gridType: 'dash',
          splitNumber: 5,
          min: 0
        },
        extra: {
          column: {
            type: 'group',
            width: 20
          }
        }
      }
    };
  },
  computed: {
    filteredFlows() {
      return this.flows.filter(flow => {
        const flowDate = new Date(flow.date);
        const startDate = this.startDate ? new Date(this.startDate) : null;
        const endDate = this.endDate ? new Date(this.endDate) : null;
        const withinStartDate = startDate ? flowDate >= startDate : true;
        const withinEndDate = endDate ? flowDate <= endDate : true;
        return withinStartDate && withinEndDate;
      });
    }
  },
  watch: {
    filteredFlows: {
      handler() {
        this.prepareChartData();
      },
      immediate: true
    }
  },
  methods: {
    goBack() {
      uni.navigateBack();
    },
    showFilter() {
      this.showFilterPanel = true;
    },
    applyFilters() {
      this.showFilterPanel = false;
      this.prepareChartData();
    },
    resetFilters() {
      this.startDate = '';
      this.endDate = '';
      this.showFilterPanel = false;
      this.prepareChartData();
    },
    closeFilterPanel() {
      this.showFilterPanel = false;
    },
    goToFlowDetail(flow) {
      uni.navigateTo({ url: `/pages/personal/salaryflow/detail?id=${flow.id}` });
    },
    getTypeClass(type) {
      if (type === '拼车收入') return 'income';
      if (type === '提现') return 'withdrawal';
      return '';
    },
    getFlowTypeStyle(type) {
      if (type === '拼车收入') {
        return { color: '#4CAF50' };  // 绿色
      } else if (type === '提现') {
        return { color: '#2196F3' };  // 蓝色
      } else {
        return { color: '#000' };  // 默认黑色
      }
    },
    prepareChartData() {
      const grouped = {};

      this.filteredFlows.forEach(flow => {
        if (flow.type !== this.incomeType) return; // 根据选择的类型过滤数据

        const month = flow.date.slice(0, 7); // 获取“YYYY-MM”
        if (!grouped[month]) {
          grouped[month] = 0;
        }
        grouped[month] += flow.amount;
      });

      const sortedMonths = Object.keys(grouped).sort();
      this.chartData = {
        categories: sortedMonths,
        series: [{
          name: `${this.incomeType} 每月`,
          data: sortedMonths.map(month => grouped[month])
        }]
      };

      // 动态调整柱子的颜色
      this.chartOpts.color = this.incomeType === '拼车收入' ? ['#4CAF50'] : ['#2196F3']; // 绿色或蓝色
    },
    toggleIncomeType() {
      this.incomeType = this.incomeType === '拼车收入' ? '提现' : '拼车收入'; // 切换类型
      this.prepareChartData(); // 切换后重新准备图表数据
    }
  }
};
</script>

<style scoped>
.salaryflow-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.top-bar {
  padding: 20rpx 30rpx;
  background: #fff;
  display: flex;
  align-items: center;
  box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
}

.back-button {
  margin-right: 20rpx;
}

.back-icon {
  width: 40rpx;
  height: 40rpx;
}

.title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

/* 遮罩层样式 */
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5); /* 半透明黑色 */
  z-index: 999;
}

.filter-icon {
  width: 48rpx;
  height: 48rpx;
}

/* 弹窗样式 */
.filter-popup {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%); /* 使弹窗居中 */
  width: 100%;  /* 根据需要调整宽度 */
  max-width: 620rpx; /* 设置最大宽度 */
  background: #fff;
  padding: 30rpx;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  z-index: 1000;
}

.filter-close-icon {
  position: absolute;
  top: 5rpx;
  right: 0rpx;
  width: 40rpx;
  height: 40rpx;
  opacity: 0.6;
  z-index: 1010;
}

.filter-row {
  display: flex;
  align-items: center;
  font-size: 28rpx;
  margin-bottom: 30rpx;
  flex-wrap: nowrap;
  color: #333;
}

.filter-label {
  width: 160rpx;
  flex-shrink: 0;
}

.filter-row input[type="date"] {
  flex: 1;
  margin: 0 10rpx;
  padding: 20rpx;
  font-size: 28rpx;
  background: #f5f5f5;
  border: 1px solid #ccc;
  border-radius: 20rpx;
  box-sizing: border-box;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 20rpx;
}

.apply-button,
.reset-button {
  padding: 0rpx 30rpx;
  font-size: 30rpx;
  border-radius: 24rpx;
  color: #fff;
  border: none;
  box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.08);
  margin: 0;
}


.apply-button {
  margin-right: 20rpx;
  background: #409eff;
}

.reset-button {
  background: #f56c6c;
}

.chart-wrapper {
  margin: 140rpx 20rpx 20rpx;
  background: #fff;
  padding: 20rpx;
  border-radius: 12rpx;
  box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.1);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.chart-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
}

.chart-actions {
  display: flex;
  gap: 10rpx;
}

.chat-filter-button {
  margin-left: 20rpx;
  padding: 20rpx;
  display: flex;
  align-items: center;
}

.chart-filter-button text {
  color: #fff;
  font-size: 26rpx;
}

.chart-toggle-button {
  padding: 10rpx 20rpx;
  border-radius: 30rpx;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
}

.chart-toggle-button text {
  font-size: 26rpx;
}

/* 流水列表样式 */
.flow-list {
  width: 90%;
  flex: 1;
  margin: 20rpx;
  background: #fff;
  padding: 20rpx;
  border-radius: 12rpx;
  box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.1);
}

.flow-item {
  padding: 30rpx 50rpx;
  margin-bottom: 30rpx;
  margin-right: 0rpx;
  background: #fff;
  border-radius: 12rpx;
  box-shadow: 0 0 10rpx rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.order-top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.flow-id-bold {
  font-weight: bold;
  font-size: 28rpx;
}

.order-middle-column {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.flow-date-gray {
  font-size: 22rpx;
  color: #666;
}

.flow-amount-bold {
  font-weight: bold;
  font-size: 50rpx;
  color: #333;
  margin-top: 15rpx;
  margin-bottom: 15rpx;
}

.order-details {
  display: flex;
  align-items: center;
}

.order-details-text {
  font-size: 20rpx;
  color: #666;
  margin-right: 5rpx;
}

.order-details-icon {
  width: 20rpx;
  height: 20rpx;
}

.order-bottom-row {
  display: flex;
  flex-direction: column;
  margin-top: 40rpx;
}

.flow-type-item {
  display: flex;
  margin-bottom: 10rpx;
}

.flow-type-label {
  font-size: 20rpx;
  color: #666;
  margin-right: 10rpx;
}

.flow-type-detail {
  font-size: 20rpx;
  color: #333;
}

.no-data {
  text-align: center;
  font-size: 28rpx;
  color: #999;
  margin-top: 50rpx;
}
</style>
