// ==========================================
// 0. 전역 변수 설정 (중복 변수를 피하기 위해 완전히 비워둠)
// ==========================================
let currentUsername = "";
let evaluationMents = [];

// ✨ Supabase game_config 테이블에서 불러올 게임 조건 전역변수
// 👉 값은 앱 시작 시 loadGameConfig()에서 자동으로 채워집니다.
// 👉 fetch 실패 시 아래 기본값(fallback)으로 동작합니다.
let RPS_THRESHOLD = 9;      // 가위바위보 축하 페이지 진입 기준 연승 수
let CIRCLE_THRESHOLD = 95;  // 원 그리기 축하 페이지 진입 기준 점수

/**
 * config.js에서 이미 선언된 supabaseUrl과 supabaseKey를
 * 충돌 없이 안전하게 상속받아 연동하는 복구 엔진
 */
function initSupabase() {
    if (window._supabase) {
        if (typeof _supabase === 'undefined') {
            window._supabase = window._supabase;
        }
        return true;
    }
    
    if (typeof supabase !== 'undefined') {
        const _masterUrl = typeof SUPABASE_URL !== 'undefined' ? SUPABASE_URL : (typeof supabaseUrl !== 'undefined' ? supabaseUrl : null);
        const _masterKey = typeof SUPABASE_ANON_KEY !== 'undefined' ? SUPABASE_ANON_KEY : (typeof supabaseKey !== 'undefined' ? supabaseKey : null);
        
        if (_masterUrl && _masterKey) {
            window._supabase = supabase.createClient(_masterUrl, _masterKey);
            return true;
        }
    }
    return false;
}

// ==========================================
// Supabase game_config 테이블에서 게임 조건 로드
// ==========================================
async function loadGameConfig() {
    if (!initSupabase()) return;
    try {
        const { data, error } = await window._supabase
            .from('game_config')
            .select('key, value');

        if (error) throw error;

        data.forEach(row => {
            if (row.key === 'rps_threshold')    RPS_THRESHOLD    = Number(row.value);
            if (row.key === 'circle_threshold') CIRCLE_THRESHOLD = Number(row.value);
        });

        // 값이 로드된 후 index.html 안내 문구를 동적으로 업데이트
        const rpsHint = document.getElementById('rps-threshold-hint');
        if (rpsHint) rpsHint.innerText = RPS_THRESHOLD;

        const circleHint = document.getElementById('circle-threshold-hint');
        if (circleHint) circleHint.innerText = CIRCLE_THRESHOLD;

    } catch (err) {
        console.warn("game_config 로드 실패, 기본값으로 동작합니다:", err);
    }
}

// ==========================================
// 1. 플랫폼 초기화 및 파일 프리로딩 이벤트
// ==========================================
window.addEventListener('load', async () => {
    initSupabase();
    await loadGameConfig();  // 게임 조건을 가장 먼저 로드
    await loadMentsFromFile(); 
    initNicknameInput();
    
    if (typeof fetchGlobalRankings === 'function') {
        fetchGlobalRankings();
    }
    if (typeof fetchCircleRankings === 'function') {
        fetchCircleRankings();
    }
    if (typeof initCircleCanvas === 'function') {
        initCircleCanvas();
    }
});

async function loadMentsFromFile() {
    try {
        const response = await fetch('ment.json');
        evaluationMents = await response.json();
    } catch (err) {
        evaluationMents = [
            {max: 100, min: 80, text: "와우, 멋지고 완벽한 동그라미입니다! 👍"},
            {max: 79, min: 40, text: "제법 원 모양을 갖추었네요! 🙂"},
            {max: 39, min: 0, text: "찌그러진 감자 발견! 다시 그려봐요! 🥔"}
        ];
    }
}

function initNicknameInput() {
    const input = document.getElementById('username-input');
    if (input) {
        // 💡 안내 문구를 한글 4자 / 영어 8자로 수정했습니다.
        input.placeholder = "한글 4자 이내 / 영어 8자 이내";
    }
}

// ==========================================
// 2. 닉네임 로그인 및 게임 선택 탭 시스템
// ==========================================
function getByteLength(str) {
    return new TextEncoder().encode(str).length;
}

function saveUsername() {
    const input = document.getElementById('username-input');
    if (!input) return;
    
    const username = input.value.trim();

    if (!username) {
        alert("닉네임을 입력해 주세요!");
        return;
    }

    const byteLength = getByteLength(username);
    // 💡 최대 바이트를 12로 변경하여 한글 4자(12바이트), 영문 8자(8바이트) 제한을 충족합니다.
    if (byteLength > 12) {
        alert(`닉네임이 너무 깁니다!\n* 영문·숫자는 최대 8자, 한글은 최대 4자까지 가능합니다.`);
        return;
    }

    currentUsername = username;
    
    const displayUsername = document.getElementById('display-username');
    if (displayUsername) {
        displayUsername.innerText = currentUsername;
    }
    
    document.getElementById('user-setup').style.display = 'none';
    document.getElementById('game-area').style.display = 'block';

    if (typeof resizeCanvas === 'function') {
        setTimeout(resizeCanvas, 50);
    }
}

function switchGame(gameType) {
    const rpsContent = document.getElementById('content-rps');
    const circleContent = document.getElementById('content-circle');
    const rpsTab = document.getElementById('tab-rps');
    const circleTab = document.getElementById('tab-circle');

    if (gameType === 'rps') {
        if (rpsContent) rpsContent.style.display = 'flex';
        if (circleContent) circleContent.style.display = 'none';
        if (rpsTab) rpsTab.classList.add('active');
        if (circleTab) circleTab.classList.remove('active');
    } else {
        if (rpsContent) rpsContent.style.display = 'none';
        if (circleContent) circleContent.style.display = 'flex';
        if (circleTab) circleTab.classList.add('active');
        if (rpsTab) rpsTab.classList.remove('active');
        if (typeof resizeCanvas === 'function') resizeCanvas();
    }
}

window.addEventListener('load', () => {
    const mainTitle = document.getElementById('main-title');
    mainTitle?.addEventListener('click', function() {
        const gameArea = document.getElementById('game-area');
        if (gameArea) gameArea.style.display = 'none';

        const userSetup = document.getElementById('user-setup');
        if (userSetup) userSetup.style.display = 'block';

        currentUsername = null;
        
        const nicknameInput = document.getElementById('username-input');
        if (nicknameInput) {
            nicknameInput.value = '';
            initNicknameInput();
            nicknameInput.focus();
        }
    });
});