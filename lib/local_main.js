// 动态加载脚本的函数
function loadScript(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// 按顺序加载所需的脚本
async function loadDependencies() {
    const scripts = ['dev/anime_avatar.js'];

    for (const script of scripts) {
        await loadScript(script);
    }
    // 所有脚本加载完成后，初始化应用
    initializeApp();
}

// 初始化应用的函数
function initializeApp() {
    const recordButton = document.getElementById('recordButton');
    const audioPlayer = document.getElementById('audioPlayer');
    const statusText = document.getElementById('statusText');
    let mediaRecorder;
    let audioChunks = [];
    let ws;
    let audioQueue = [];
    let isPlaying = false;

    function getCookie(name) {
        let matches = document.cookie.match(new RegExp(
            "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
        ));
        return matches ? decodeURIComponent(matches[1]) : undefined;
    }

    function setCookie(name, value, options = {}) {
        options = {
            path: '/',
            ...options
        };
        if (options.expires instanceof Date) {
            options.expires = options.expires.toUTCString();
        }
        let updatedCookie = encodeURIComponent(name) + "=" + encodeURIComponent(value);
        for (let optionKey in options) {
            updatedCookie += "; " + optionKey;
            let optionValue = options[optionKey];
            if (optionValue !== true) {
                updatedCookie += "=" + optionValue;
            }
        }
        document.cookie = updatedCookie;
    }

    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    function initWebSocket() {
        let uuid = getCookie('user_uuid');
        if (!uuid) {
            uuid = generateUUID();
            setCookie('user_uuid', uuid, { 'max-age': 3600*24*365 });
        }
        ws = new WebSocket('wss://digital-life-wss.aipendant.tech/');
        ws.binaryType = 'arraybuffer';
        ws.onopen = () => {
            console.log('WebSocket connection established');
            ws.send(`UUID:${uuid}`);
        };
        ws.onmessage = async (event) => {
            if (event.data instanceof ArrayBuffer) {
                const audioBlob = new Blob([event.data], { type: 'audio/wav' });
                audioQueue.push(audioBlob);
                if (!isPlaying) {
                    isPlaying = true;
                    try {
                        await playSequence(audioQueue);
                    } catch (error) {
                        console.error('Error playing audio sequence:', error);
                    } finally {
                        isPlaying = false;
                        audioQueue = [];
                    }
                }
            } else {
                console.log('Received message from server:', event.data);
            }
        };
        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
        ws.onclose = () => {
            console.log('WebSocket connection closed');
        };
    }

    async function playSequence(audioBlobs) {
        for (const blob of audioBlobs) {
            const audioUrl = URL.createObjectURL(blob);
            await playAudioWithModel(audioUrl);
            URL.revokeObjectURL(audioUrl);
            await new Promise(resolve => setTimeout(resolve, 100)); // Short pause between audios
        }
        updateStatusText('長押しで会話を開始💬');
    }

    async function playAudioWithModel(audioUrl) {
        updateStatusText('話し中...');        
        return new Promise((resolve, reject) => {
            window.avatarSpeak(audioUrl, () => {
                console.log(`Voiceline ${audioUrl} is over`);
                statusText.textContent = '';
                resolve();
            }, (err) => {
                console.log("Error: " + err);
                statusText.textContent = 'Error occurred while speaking';
                reject(err);
            });
        });
    }
    
    function updateStatusText(message) {
        statusText.textContent = message;
    }

    let isRecording = false;
    let recordingTimeout;

    const events = {
        start: ['mousedown', 'touchstart'],
        stop: ['mouseup', 'touchend', 'mouseleave']
    };
    events.start.forEach(event => recordButton.addEventListener(event, startRecording));
    events.stop.forEach(event => recordButton.addEventListener(event, stopRecording));

    async function startRecording(event) {
        event.preventDefault();
        if (isRecording) return;

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };
        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/ogg; codecs=opus' });
            sendAudioToServer(audioBlob);
            audioChunks = [];
        };
        
        mediaRecorder.start();
        isRecording = true;
        updateStatusText('指を離して送信🎶🎵👂');        
        recordingTimeout = setTimeout(() => {
            stopRecording();
        }, 30000); // 设置最长录音时间为30秒
    }

    function stopRecording() {
        if (!isRecording) return;
        
        clearTimeout(recordingTimeout);
        mediaRecorder.stop();
        isRecording = false;
        updateStatusText('考え中...');        
    }

    function sendAudioToServer(audioBlob) {
        if (ws.readyState !== WebSocket.OPEN) {
            console.log("WebSocket is not open. Attempting to reconnect...");
            initWebSocket();
            // 将音频数据存储起来,等连接重新建立后发送
            setTimeout(() => sendAudioToServer(audioBlob), 1000);
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const arrayBuffer = reader.result;
            console.log("ArrayBuffer size:", arrayBuffer.byteLength);
            console.log("First few bytes:", new Uint8Array(arrayBuffer.slice(0, 20)));
            ws.send(arrayBuffer);
            ws.send("EOF");
        };
        reader.readAsArrayBuffer(audioBlob);
    }

    recordButton.onclick = () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            stopRecording();
        } else {
            startRecording();
        }
    };

    initWebSocket();
}

// 开始加载依赖项
loadDependencies().catch(error => {
    console.error('Failed to load dependencies:', error);
});

// Adding the code from index.js
document.addEventListener('DOMContentLoaded', function() {
    var elems = document.querySelectorAll('.modal');
    var instances = M.Modal.init(elems);
});

// 这里可以添加您的录音和状态更新逻辑
const recordButton = document.getElementById('recordButton');
const statusText = document.getElementById('statusText');
const modal = M.Modal.getInstance(document.getElementById('modal1'));

recordButton.addEventListener('mousedown', () => {
    modal.open();
});

recordButton.addEventListener('mouseup', () => {
    setTimeout(() => {
        modal.close();
    }, 20000);//最长录音20秒
});