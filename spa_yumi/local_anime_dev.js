// 引入核心库
const script0 = document.createElement('script');
script0.src = 'https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js';
const script2 = document.createElement('script');
script2.src = 'https://cdn.jsdelivr.net/npm/pixi.js@7.x/dist/pixi.min.js';
const script5 = document.createElement('script');
script5.src = 'https://cdn.jsdelivr.net/gh/RaSan147/pixi-live2d-display@v0.5.0-ls-7/dist/cubism4.min.js';

// 开始加载第一个脚本
document.head.appendChild(script0);

let model4;
const cubism4Model = "https://static.yangth25.workers.dev/spa_yumi/327/327.model3.json"

// 添加标志来控制手动动作播放
let isManualMotionPlaying = false;

// 设置动作组 - 根据模型文件，动作组名为"bow"
const motionGroup = "bow";
// 动作索引映射 - 根据模型文件中的顺序
const motionIndices = {
    'bow': 0
};

// 表情索引映射 - 根据模型文件中的顺序
const expressionIndices = {
    'smile': 0  // 6smile.exp3.json 对应索引0
};

// 添加标志来控制表情播放
let isExpressionPlaying = false;

// 表情文件路径映射
const expressionFiles = {
    'smile': 'https://static.yangth25.workers.dev/spa_yumi/327/expressions/6smile.exp3.json'
};

// 缓存动作和表情的持续时间
const motionDurationCache = {};
const expressionDurationCache = {};

// 重置表情参数
const resetExpressionParameters = (expressionData) => {
    if (!expressionData.Parameters || !model4.internalModel || !model4.internalModel.coreModel) {
        return;
    }
    
    const ids = model4.internalModel.coreModel._parameterIds;
    const values = model4.internalModel.coreModel._parameterValues;
    
    for (const param of expressionData.Parameters) {
        const idx = ids.indexOf(param.Id);
        if (idx !== -1) {
            const originalValue = values[idx];
            // 根据Blend模式重置参数
            if (param.Blend === 'Add') {
                // 如果是Add模式，需要减去之前添加的值
                values[idx] -= param.Value;
                console.log(`Reset parameter ${param.Id} from ${originalValue} to ${values[idx]} (Add mode)`);
            } else if (param.Blend === 'Multiply') {
                // 如果是Multiply模式，需要除以之前乘的值
                values[idx] /= param.Value;
                console.log(`Reset parameter ${param.Id} from ${originalValue} to ${values[idx]} (Multiply mode)`);
            } else {
                // 如果是Normal模式，重置为默认值（通常是0）
                values[idx] = 0;
                console.log(`Reset parameter ${param.Id} from ${originalValue} to 0 (Normal mode)`);
            }
        }
    }
};

// 回归初始状态
const returnToIdle = () => {
    if (!model4) {
        console.log('Model not ready yet');
        return;
    }
    
    try {
        console.log('Returning to idle state');
        
        // 停止所有当前动作
        if (typeof model4.stopMotions === 'function') {
            model4.stopMotions();
        }
        
        // 重置表情参数 - 重置所有可能被表情影响的参数
        if (model4.internalModel && model4.internalModel.coreModel) {
            const ids = model4.internalModel.coreModel._parameterIds;
            const values = model4.internalModel.coreModel._parameterValues;
            
            // 重置可能被表情影响的参数
            const parametersToReset = ['Param72', 'Param71']; // 从表情文件中看到的参数
            for (const paramId of parametersToReset) {
                const idx = ids.indexOf(paramId);
                if (idx !== -1) {
                    values[idx] = 0; // 重置为默认值
                }
            }
        }
        
        // 重置表情（如果有的话）
        if (model4.expressions && model4.expressions.length > 0) {
            model4.expression(0); // 使用第一个表情作为默认表情
        }
        
        // 清除播放标志
        isManualMotionPlaying = false;
        isExpressionPlaying = false;
        
        console.log('Returned to idle state');
    } catch (error) {
        console.error('Failed to return to idle state:', error);
    }
};

// 触发指定表情
const triggerSpecificExpression = async (expressionName = 'smile', onComplete = null) => {
    if (!model4) {
        console.log('Model not ready yet');
        return;
    }
    
    try {
        console.log(`Triggering expression: ${expressionName}`);
        
        // 设置表情播放标志
        isExpressionPlaying = true;
        
        // 获取表情文件路径
        const expressionFile = expressionFiles[expressionName];
        if (!expressionFile) {
            throw new Error(`Expression file not found for: ${expressionName}`);
        }
        
        console.log(`Loading expression from: ${expressionFile}`);
        
        // 加载表情文件
        const response = await fetch(expressionFile);
        if (!response.ok) {
            throw new Error(`Failed to load expression file: ${response.status}`);
        }
        
        const expressionData = await response.json();
        console.log(`Expression data loaded:`, expressionData);
        
        // 使用预加载的持续时间
        let duration = expressionDurationCache[expressionName];
        if (!duration) {
            duration = 1000;
        }
        console.log(`Using expression duration: ${duration}ms`);
        
        // 应用表情到模型 - 使用正确的方法
        if (expressionData.Parameters) {
            const ids = model4.internalModel.coreModel._parameterIds;
            const values = model4.internalModel.coreModel._parameterValues;
            for (const param of expressionData.Parameters) {
                const idx = ids.indexOf(param.Id);
                if (idx !== -1) {
                    if (param.Blend === 'Add') {
                        values[idx] += param.Value;
                    } else if (param.Blend === 'Multiply') {
                        values[idx] *= param.Value;
                    } else {
                        values[idx] = param.Value;
                    }
                    console.log(`Set parameter ${param.Id} to ${values[idx]} (blend: ${param.Blend})`);
                } else {
                    console.warn(`Parameter ${param.Id} not found in model`);
                }
            }
            console.log(`Expression ${expressionName} applied via coreModel parameter array`);
        } else {
            throw new Error('No parameters found in expression data');
        }
        
        // 根据表情实际持续时间设置回调
        setTimeout(() => {
            // 重置表情参数，确保表情能够恢复
            resetExpressionParameters(expressionData);
            
            isExpressionPlaying = false;
            if (onComplete && typeof onComplete === 'function') {
                onComplete();
            }
        }, duration + 200); // 额外等待200ms确保表情完全应用
    } catch (error) {
        console.error('Failed to apply expression:', error);
        isExpressionPlaying = false;
        if (onComplete && typeof onComplete === 'function') {
            onComplete();
        }
    }
};

// 手动触发指定动作
const triggerSpecificMotion = async (motionName = 'bow', onComplete = null) => {
    if (!model4) {
        console.log('Model not ready yet');
        return;
    }
    
    try {
        console.log(`Manual trigger - Playing specific motion: ${motionName}`);
        
        // 设置手动动作标志
        isManualMotionPlaying = true;
        
        // 先停止所有当前动作
        if (typeof model4.stopMotions === 'function') {
            console.log('Stopping all current motions');
            model4.stopMotions();
        }
        
        // 等待一小段时间确保动作停止
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // 获取动作索引
        const motionIndex = motionIndices[motionName];
        if (motionIndex === undefined) {
            throw new Error(`Motion ${motionName} not found in motion indices`);
        }
        
        console.log(`Playing motion: ${motionName} with index: ${motionIndex}`);
        
        // 使用预加载的持续时间
        let duration = motionDurationCache[motionName];
        if (!duration) {
            duration = 2000;
        }
        console.log(`Using motion duration: ${duration}ms`);
        
        // 使用正确的API调用方式：motion(groupName, index, priority)
        const result = model4.motion(motionGroup, motionIndex, 3); // 优先级3表示强制播放
        
        if (result && typeof result.then === 'function') {
            await result;
        }
        
        console.log(`Motion ${motionName} triggered successfully`);
        
        // 根据动作实际持续时间设置回调
        setTimeout(() => {
            isManualMotionPlaying = false;
            if (onComplete && typeof onComplete === 'function') {
                onComplete();
            }
        }, duration + 200); // 额外等待200ms确保动作完全结束
        
    } catch (error) {
        console.error('Failed to play manual motion:', error);
        isManualMotionPlaying = false;
        if (onComplete && typeof onComplete === 'function') {
            onComplete();
        }
    }
};

// 预加载动作
const preloadMotions = async () => {
    for (const [motionName, motionIndex] of Object.entries(motionIndices)) {
        try {
            // 预加载动作文件
            const response = await fetch(`https://static.yangth25.workers.dev/spa_yumi/327/${motionName}.motion3.json`);
            const motionData = await response.json();
            
            // 预加载动作到模型
            await model4.motion(motionGroup, motionIndex, 0);
            console.log(`Preloaded motion: ${motionName} (index: ${motionIndex})`);
        } catch (error) {
            console.error(`Failed to preload motion ${motionName}:`, error);
        }
    }
};

// 预加载表情
const preloadExpressions = async () => {
    for (const [expressionName, expressionFile] of Object.entries(expressionFiles)) {
        try {
            // 预加载表情文件
            const response = await fetch(expressionFile);
            const expressionData = await response.json();
            
            // 缓存表情持续时间 - 为微笑表情设置固定1.5秒持续时间
            let duration;
            if (expressionName === 'smile') {
                duration = 1500; // 1.5秒
            } else {
                duration = expressionData.Meta?.Duration ? expressionData.Meta.Duration * 1000 : 1000;
            }
            expressionDurationCache[expressionName] = duration;
            
            console.log(`Preloaded expression: ${expressionName} from ${expressionFile}, duration: ${duration}ms`);
        } catch (error) {
            console.error(`Failed to preload expression ${expressionName}:`, error);
        }
    }
};

// 预加载动作持续时间
const preloadMotionDurations = async () => {
    for (const [motionName, motionIndex] of Object.entries(motionIndices)) {
        try {
            // 预加载动作文件
            const response = await fetch(`https://static.yangth25.workers.dev/spa_yumi/327/${motionName}.motion3.json`);
            const motionData = await response.json();
            
            // 缓存动作持续时间
            const duration = motionData.Meta.Duration * 1000;
            motionDurationCache[motionName] = duration;
            
            console.log(`Preloaded motion duration: ${motionName} (index: ${motionIndex}), duration: ${duration}ms`);
        } catch (error) {
            console.error(`Failed to preload motion duration ${motionName}:`, error);
        }
    }
};

// 预加载所有资源
async function preloadResources() {
    const imageResources = [        
        'https://static.yangth25.workers.dev/spa_yumi/327/327.4096/texture_00.png',
        'https://static.yangth25.workers.dev/spa_yumi/327/327.4096/texture_01.png'
    ];

    const jsonResources = [
        'https://static.yangth25.workers.dev/spa_yumi/327/327.physics3.json',
        'https://static.yangth25.workers.dev/spa_yumi/327/327.cdi3.json'
    ];

    const binaryResources = [
        'https://static.yangth25.workers.dev/spa_yumi/327/327.moc3'
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
const totalScripts = 3;

async function checkAllScriptsLoaded() {
    loadedScripts++;
    if (loadedScripts === totalScripts) {
        await preloadResources();
        await initializeAvatar();
        // 通知上层JS文件加载完成
        notifyLoadComplete();
    }
}

// 按顺序加载脚本
script0.onload = () => {
    checkAllScriptsLoaded();
    document.head.appendChild(script2);
};

script2.onload = () => {
    checkAllScriptsLoaded();
    document.head.appendChild(script5);
};

script5.onload = checkAllScriptsLoaded;

async function initializeAvatar() {
    if (typeof PIXI === 'undefined') {
        console.error('PIXI.js not loaded');
        return;
    }
    
    if (typeof PIXI.live2d === 'undefined') {
        console.error('Live2D plugin not loaded');
        return;
    }
    
    // 获取canvas容器
    const canvas = document.getElementById("canvas");
    const container = canvas.parentElement;
    
    // 计算容器尺寸
    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width || window.innerWidth;
    const containerHeight = containerRect.height || window.innerHeight;

    // 如果宽高为0，暂不初始化，监听尺寸变化
    if (containerWidth === 0 || containerHeight === 0) {
        const observer = new ResizeObserver(entries => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                if (width > 0 && height > 0) {
                    observer.disconnect();
                    initializeAvatar();
                }
            }
        });
        observer.observe(container);
        return;
    }
    
    console.log('Container dimensions:', { width: containerWidth, height: containerHeight });
    
    const app = new PIXI.Application({
        view: canvas,
        autoStart: true,
        backgroundAlpha: 0,
        width: containerWidth,
        height: containerHeight,
        resolution: 2, // 按照容器尺寸2倍渲染
    });    
    
    model4 = await PIXI.live2d.Live2DModel.from(cubism4Model, {
        autoFocus: true,
        motionPreload: "NONE",
        autoMotion: false,
        autoInteract: true
    });
    app.stage.addChild(model4);
    
    // 禁用Y轴跟踪的完整实现
    if (model4.internalModel && model4.internalModel.coreModel) {
        const coreModel = model4.internalModel.coreModel;
        
        // 1. 锁定头部Y轴参数
        const headYIndex = coreModel._parameterIds.indexOf('ParamAngleY');
        if (headYIndex !== -1) {
            coreModel._parameterValues[headYIndex] = 0;
            console.log('[YAxisLock] Locked ParamAngleY to 0');
        }
        
        // 2. 拦截参数修改
        const originalSetParameterValue = coreModel.setParameterValue;
        coreModel.setParameterValue = function(parameterId, value) {
            if (parameterId === 'ParamAngleY') {
                return; // 阻止Y轴参数修改
            }
            return originalSetParameterValue.call(this, parameterId, value);
        };
        
        // 3. 禁用focusController的Y轴跟踪
        if (model4.internalModel.focusController) {
            const originalFocus = model4.internalModel.focusController.focus;
            if (originalFocus) {
                model4.internalModel.focusController.focus = function(x, y) {
                    return originalFocus.call(this, x, 0); // Y坐标固定为0
                };
                console.log('[YAxisLock] Disabled Y-axis tracking in focusController');
            }
        }
        
        // 4. 每帧强制锁定Y轴参数
        app.ticker.add(() => {
            if (headYIndex !== -1) {
                coreModel._parameterValues[headYIndex] = 0;
            }
        });
        
        console.log('[YAxisLock] Y-axis locking system initialized');
    }
    
    // 记录模型原始宽高（只记录一次）
    const originalModelWidth = model4.width;
    const originalModelHeight = model4.height;

    // 自适应缩放和定位
    const resizeModel = () => {
        const appWidth = app.screen.width;
        const appHeight = app.screen.height;

        // 用原始宽高计算缩放比例，避免scale叠加
        const scaleW = (appWidth * 2.4) / originalModelWidth;
        const scaleH = (appHeight * 2.4) / originalModelHeight;
        let scale = Math.min(scaleW, scaleH);
        scale = Math.max(0.1, Math.min(scale, 1.0));
        model4.scale.set(scale);
        // 设置锚点为x轴中心
        if (model4.anchor) {
            model4.anchor.set(0.5, 0);
        }
        // 定位x轴中心，头顶距离顶部一定的距离
        model4.x = appWidth / 2;
        model4.y = appHeight * 0.04;
        console.log('Model resized:', {
            scale: scale,
            position: { x: model4.x, y: model4.y },
            container: { width: appWidth, height: appHeight },
            model: { width: model4.width, height: model4.height }
        });
    };
    
    // 初始调整大小
    resizeModel();

    // 监听窗口大小变化
    const handleResize = () => {
        const newContainerRect = container.getBoundingClientRect();
        const newWidth = newContainerRect.width || window.innerWidth;
        const newHeight = newContainerRect.height || window.innerHeight;
        
        app.renderer.resize(newWidth, newHeight);
        resizeModel();
    };
    window.addEventListener('resize', handleResize);
    
    // 检查可用的表情
    console.log('Available expressions:', model4.expressions);
    console.log('Avatar initialized');
    
    // 预加载动作并添加键盘事件监听
    try {
        await preloadMotions();
        await preloadExpressions();
        await preloadMotionDurations();
        console.log('All motions and expressions preloaded');
        
        // 设置初始状态
        returnToIdle();
        
        // 添加键盘事件监听
        document.addEventListener('keydown', (event) => {
            if (event.key.toLowerCase() === 'y') {
                console.log('Y key pressed - triggering bow motion');
                // 只有在没有手动动作播放时才触发新动作
                if (!isManualMotionPlaying) {
                    triggerSpecificMotion('bow');
                } else {
                    console.log('Motion already playing, ignoring Y key press');
                }
            } else if (event.key.toLowerCase() === 'x') {
                console.log('X key pressed - triggering smile expression');
                // 只有在没有表情播放时才触发新表情
                if (!isExpressionPlaying) {
                    triggerSpecificExpression('smile');
                } else {
                    console.log('Expression already playing, ignoring X key press');
                }
            }
        });
        
        console.log('Keyboard listener added - press Y to trigger bow motion, X to trigger smile expression');
    } catch (error) {
        console.error('Failed to initialize motion system:', error);
    }
}

// 提供给main.js使用的说话函数
window.avatarSpeak = function(audioUrl, onFinish, onError) {
    model4.speak(audioUrl, {
        volume: 1,
        expression: 4,
        resetExpression: true,
        crossOrigin: "anonymous",
        onFinish: () => {
            // 说话结束后回归初始状态
            returnToIdle();
            if (onFinish) onFinish();
        },
        onError: onError
    });
};

// 加载完成通知函数
function notifyLoadComplete() {
    console.log('Live2D anime module loaded completely');
    
    // 触发自定义事件
    const loadCompleteEvent = new CustomEvent('animeModuleLoaded', {
        detail: {
            message: 'Live2D anime module loaded successfully',
            timestamp: new Date().toISOString()
        }
    });
    document.dispatchEvent(loadCompleteEvent);
    
    // 如果上层JS设置了回调函数，也调用它
    if (window.onAnimeModuleLoaded && typeof window.onAnimeModuleLoaded === 'function') {
        window.onAnimeModuleLoaded({
            message: 'Live2D anime module loaded successfully',
            timestamp: new Date().toISOString()
        });
    }
}

// 提供给其他脚本使用的动作触发函数
window.triggerMotion = function(motionName) {
    if (motionIndices[motionName] !== undefined) {
        console.log(`External trigger - Playing motion: ${motionName}`);
        triggerSpecificMotion(motionName);
    } else {
        console.error(`Motion ${motionName} not found. Available motions:`, Object.keys(motionIndices));
    }
};

// 提供给其他脚本使用的动作列表
window.getAvailableMotions = function() {
    return Object.keys(motionIndices);
};

// 提供给其他脚本使用的表情触发函数
window.triggerExpression = function(expressionName) {
    if (expressionIndices[expressionName] !== undefined) {
        console.log(`External trigger - Playing expression: ${expressionName}`);
        triggerSpecificExpression(expressionName);
    } else {
        console.error(`Expression ${expressionName} not found. Available expressions:`, Object.keys(expressionIndices));
    }
};

// 提供给其他脚本使用的表情列表
window.getAvailableExpressions = function() {
    return Object.keys(expressionIndices);
};

// 挂载在window上的bow动作调用方法
window.triggerBowMotion = function(onComplete = null) {
    console.log('triggering 「bow」 motion');
    if (!isManualMotionPlaying) {
        triggerSpecificMotion('bow', onComplete);
    } else {
        console.log('Motion already playing, ignoring bow motion call');
        if (onComplete && typeof onComplete === 'function') {
            onComplete();
        }
    }
};

// 挂载在window上的smile表情调用方法
window.triggerSmileExpression = function(onComplete = null) {
    console.log('triggering 「smile」expression');
    if (!isExpressionPlaying) {
        triggerSpecificExpression('smile', onComplete);
    } else {
        console.log('Expression already playing, ignoring smile expression call');
        if (onComplete && typeof onComplete === 'function') {
            onComplete();
        }
    }
};

// 集成的bow动作+smile表情连续播放方法
window.triggerBowAndSmile = function(onComplete = null) {
    console.log('triggering 「bow」 motion followed by 「smile」 expression');
    
    // 先执行bow动作
    window.triggerBowMotion(() => {
        console.log('Bow motion completed, now triggering smile expression');
        
        // bow动作完成后执行smile表情
        window.triggerSmileExpression(() => {
            console.log('Smile expression completed, bow and smile sequence finished');
            
            // 两个动作都完成后调用最终回调
            if (onComplete && typeof onComplete === 'function') {
                onComplete();
            }
        });
    });
};