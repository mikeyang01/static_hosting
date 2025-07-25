// 引入核心库
const script0 = document.createElement('script');
script0.src = 'https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js';
const script2 = document.createElement('script');
script2.src = 'https://cdn.jsdelivr.net/npm/pixi.js@7.x/dist/pixi.min.js';
const script5 = document.createElement('script');
script5.src = 'https://cdn.jsdelivr.net/gh/RaSan147/pixi-live2d-display@v0.5.0-ls-7/dist/cubism4.min.js';

let loadedScripts = 0;
const totalScripts = 3;
let app, model4;
const cubism4Model = "https://cdn.jsdelivr.net/gh/guansss/pixi-live2d-display/test/assets/haru/haru_greeter_t03.model3.json";

function notifyLoadComplete() {
    // 触发自定义事件
    const loadCompleteEvent = new CustomEvent('avatarModuleLoaded', {
        detail: {
            message: 'Avatar module loaded successfully',
            timestamp: new Date().toISOString()
        }
    });
    window.dispatchEvent(loadCompleteEvent);
    // 回调
    if (window.onAvatarModuleLoaded && typeof window.onAvatarModuleLoaded === 'function') {
        window.onAvatarModuleLoaded({
            message: 'Avatar module loaded successfully',
            timestamp: new Date().toISOString()
        });
    }
}

async function initializeAvatar() {
    app = new PIXI.Application({
        view: document.getElementById("canvas"),
        autoStart: true,
        resizeTo: window,
        backgroundColor: 16777215
    });
    model4 = await PIXI.live2d.Live2DModel.from(cubism4Model);
    app.stage.addChild(model4);
    model4.scale.set(0.2);
    model4.x = -50;
    window.dispatchEvent(new Event("avatarInitialized"));
}

async function checkAllScriptsLoaded() {
    loadedScripts++;
    if (loadedScripts === totalScripts) {
        await initializeAvatar();
        notifyLoadComplete();
    }
}

// 顺序加载依赖脚本
script0.onload = () => {
    checkAllScriptsLoaded();
    document.head.appendChild(script2);
};
script2.onload = () => {
    checkAllScriptsLoaded();
    document.head.appendChild(script5);
};
script5.onload = checkAllScriptsLoaded;
document.head.appendChild(script0);

window.avatarSpeak = function (text, onFinish, onError) {
    model4.speak(text, {
        volume: 1,
        expression: 4,
        resetExpression: true,
        crossOrigin: "anonymous",
        onFinish: onFinish,
        onError: onError
    });
};

window.setAvatarBackground = function (color) {
    if (app) {
        if (typeof color === "string" && color.startsWith("#")) {
            color = parseInt(color.replace("#", ""), 16);
        }
        app.renderer.backgroundColor = color;
    }
};

window.stopAvatarSpeaking = function () {
    if (model4) {
        model4.stopSpeaking();
    }
};