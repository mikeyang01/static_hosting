// 引入核心库
const script0 = document.createElement('script');
script0.src = 'https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js';

const script1 = document.createElement('script');
script1.src = 'https://cdn.jsdelivr.net/gh/dylanNew/live2d/webgl/Live2D/lib/live2d.min.js';

const script2 = document.createElement('script');
script2.src = 'https://cdn.jsdelivr.net/npm/pixi.js@7.x/dist/pixi.min.js';

const script3 = document.createElement('script');
script3.src = 'https://cdn.jsdelivr.net/gh/mikeyang01/static_hosting@remote_yumi/spa_yumi/dist/index.js';

const script4 = document.createElement('script');
script4.src = 'https://cdn.jsdelivr.net/gh/mikeyang01/static_hosting@remote_yumi/spa_yumi/dist/cubism2.js';

const script5 = document.createElement('script');
script5.src = 'https://cdn.jsdelivr.net/gh/mikeyang01/static_hosting@remote_yumi/spa_yumi/dist/cubism4.js';

let model4;
//const cubism4Model = "lib/haru/haru_greeter_t03.model3.json";
//const cubism4Model = "lib/natori/natori_pro_t06.model3.json"
//const cubism4Model = "lib/simple/runtime/simple.model3.json"//需要全屏才显示
const cubism4Model = "https://cdn.jsdelivr.net/gh/mikeyang01/static_hosting@remote_yumi/spa_yumi/327/327.model3.json"

// 预加载所有资源
async function preloadResources() {
    const imageResources = [
        'https://cdn.jsdelivr.net/gh/mikeyang01/static_hosting@remote_yumi/spa_yumi/327/327.4096/texture_00.png',
        'https://cdn.jsdelivr.net/gh/mikeyang01/static_hosting@remote_yumi/spa_yumi/327/327.4096/texture_01.png'
    ];

    const jsonResources = [
        'https://cdn.jsdelivr.net/gh/mikeyang01/static_hosting@remote_yumi/spa_yumi/327/327.physics3.json',
        'https://cdn.jsdelivr.net/gh/mikeyang01/static_hosting@remote_yumi/spa_yumi/327/327.cdi3.json',
        'https://cdn.jsdelivr.net/gh/mikeyang01/static_hosting@remote_yumi/spa_yumi/327/motion/1up.exp3.json',
        'https://cdn.jsdelivr.net/gh/mikeyang01/static_hosting@remote_yumi/spa_yumi/327/motion/3loosely_folded.exp3.json',
        'https://cdn.jsdelivr.net/gh/mikeyang01/static_hosting@remote_yumi/spa_yumi/327/motion/4cross_idle.exp3.json'
    ];

    const binaryResources = [
        'https://cdn.jsdelivr.net/gh/mikeyang01/static_hosting@remote_yumi/spa_yumi/327/327.moc3'
    ];

    // 预加载图片资源
    const imagePromises = imageResources.map(resource => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => {
                console.error(`Failed to load image: ${resource}`);
                resolve(); // 即使加载失败也继续
            };
            img.src = resource;
        });
    });

    // 预加载 JSON 资源
    const jsonPromises = jsonResources.map(resource => {
        return fetch(resource)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .catch(error => {
                console.error(`Failed to load JSON: ${resource}`, error);
                return null;
            });
    });

    // 预加载二进制资源
    const binaryPromises = binaryResources.map(resource => {
        return fetch(resource)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.arrayBuffer();
            })
            .catch(error => {
                console.error(`Failed to load binary: ${resource}`, error);
                return null;
            });
    });

    await Promise.all([
        ...imagePromises,
        ...jsonPromises,
        ...binaryPromises
    ]);
    console.log('All resources preloaded');
}

// 确保所有脚本都加载完成后再初始化
let loadedScripts = 0;
const totalScripts = 6;

async function checkAllScriptsLoaded() {
    loadedScripts++;
    if (loadedScripts === totalScripts) {
        await preloadResources();
        initializeAvatar();
    }
}

script0.onload = checkAllScriptsLoaded;
script1.onload = checkAllScriptsLoaded;
script2.onload = checkAllScriptsLoaded;
script3.onload = checkAllScriptsLoaded;
script4.onload = checkAllScriptsLoaded;
script5.onload = checkAllScriptsLoaded;

document.head.appendChild(script0);
document.head.appendChild(script1);
document.head.appendChild(script2);
document.head.appendChild(script3);
document.head.appendChild(script4);
document.head.appendChild(script5);

async function initializeAvatar() {
    if (typeof PIXI === 'undefined') {
        console.error('PIXI.js not loaded');
        return;
    }
    
    if (typeof PIXI.live2d === 'undefined') {
        console.error('Live2D plugin not loaded');
        return;
    }
    
    const app = new PIXI.Application({
        view: document.getElementById("canvas"),
        autoStart: true,
        resizeTo: window,
        backgroundAlpha: 0,
    });    
    model4 = await PIXI.live2d.Live2DModel.from(cubism4Model);
    app.stage.addChild(model4);
    model4.scale.set(0.2);
    model4.x = -50;
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