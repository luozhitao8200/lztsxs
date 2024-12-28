// LeanCloud 配置
AV.init({
    appId: "UVk0dXM9MBwsGGw4k8QVHDt6-MdYXbMMI",  // AppID
    appKey: "UtOGWbGwgGmTqVW7YOGL0d7L", // AppKey
    serverURL: "https://uvk0dxm9.lc-cn-n1-shared.com" // 服务器地址
});

// 确保 LeanCloud 连接成功
async function testConnection() {
    try {
        const TestObject = AV.Object.extend('TestObject');
        const testObject = new TestObject();
        testObject.set('words', 'Hello world!');
        await testObject.save();
        console.log('LeanCloud 连接成功');
    } catch (error) {
        console.error('LeanCloud 连接失败:', error);
        alert('系统初始化失败，请刷新页面重试');
    }
}

// 测试连接
testConnection(); 