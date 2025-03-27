// 引入核心库
const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/gh/mikeyang01/static_hosting/dnp/anime_core.js';
let model4;
const cubism4Model = "https://cdn.jsdelivr.net/gh/mikeyang01/static_hosting@master/no_crossed_arms/haru/haru_greeter_t03.model3.json";

script.onload = () => {
    // 脚本加载完成后再初始化
    initializeAvatar();
};
document.head.appendChild(script);


async function initializeAvatar() {
    const app = new PIXI.Application({
        view: document.getElementById("canvas"),
        autoStart: true,
        resizeTo: window,
        backgroundAlpha: 0,
    });    
    model4 = await PIXI.live2d.Live2DModel.from(cubism4Model);
    app.stage.addChild(model4);
    model4.scale.set(0.01);
    model4.x = -50;

    // 添加静态图片
    const nekomata = PIXI.Sprite.from('https://cdn.jsdelivr.net/gh/mikeyang01/static_hosting/dnp/nekomata.png');
    app.stage.addChild(nekomata);
    // 调整图片大小和位置
    nekomata.scale.set(1);
    // 根据实际需要调整缩放比例
    nekomata.x = -200;
    nekomata.y = -120;
}

// 提供给main.js使用的说话函数
window.avatarSpeak = function(audioUrl, onFinish, onError) {
    model4.speak(audioUrl, {
        volume: 1,
        expression: 4,
        resetExpression: true,
        crossOrigin: "anonymous",
        onFinish: onFinish,
        onError: onError
    });
};