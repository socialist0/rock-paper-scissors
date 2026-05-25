// ==========================================
// 0. 전역 변수 설정 (중복 변수를 피하기 위해 완전히 비워둠)
// ==========================================
let currentUsername = "";
let evaluationMents = [];

// ✨ Supabase game_config 테이블에서 불러올 게임 조건 전역변수
let RPS_THRESHOLD    = 9;
let CIRCLE_THRESHOLD = 95;
let ABC_THRESHOLD    = 9;

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
// 1. 초기 실행 및 공통 유틸리티 모듈
// ==========================================
async function loadGameConfig() {
    try {
        if (!initSupabase()) return;
        
        const { data, error } = await window._supabase
            .from('game_config')
            .select('config_key, config_value');

        if (error) throw error;

        if (data && data.length > 0) {
            data.forEach(item => {
                if (item.config_key === 'rps_threshold') {
                    RPS_THRESHOLD = parseInt(item.config_value, 10);
                } else if (item.config_key === 'circle_threshold') {
                    CIRCLE_THRESHOLD = parseInt(item.config_value, 10);
                } else if (item.config_key === 'abc_threshold') {
                    ABC_THRESHOLD = parseInt(item.config_value, 10);
                }
            });
            console.log(`[Config 로드 완료] 가위바위보: ${RPS_THRESHOLD}, 원 그리기: ${CIRCLE_THRESHOLD}, 앞뒤 맞추기: ${ABC_THRESHOLD}`);
        }
    } catch (err) {
        console.warn("설정값 원격 로드 실패, 로컬 기본값으로 세팅을 수호합니다:", err);
    } finally {
        updateThresholdUI();
    }
}

function updateThresholdUI() {
    const rpsHint    = document.getElementById('rps-threshold-hint');
    const circleHint = document.getElementById('circle-threshold-hint');
    const abcHint    = document.getElementById('abc-threshold-hint');
    if (rpsHint)    rpsHint.innerText    = RPS_THRESHOLD;
    if (circleHint) circleHint.innerText = CIRCLE_THRESHOLD;
    if (abcHint)    abcHint.innerText    = ABC_THRESHOLD;
}

function initNicknamePageStyles() {
    document.body.classList.add('nickname-page');
    const loginScreen = document.getElementById('login-screen');
    const gameArea    = document.getElementById('game-area');
    if (loginScreen) loginScreen.style.display = 'flex';
    if (gameArea)    gameArea.style.display     = 'none';
}

function initNicknameInput() {
    const input = document.getElementById('username-input');
    if (!input) return;
    
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveUsername();
        }
    });
}

function validateUsername(name) {
    const korRegex = /^[가-힣ㄱ-ㅎㅏ-ㅣ]+$/;
    const engRegex = /^[a-zA-Z]+$/;

    if (korRegex.test(name)) {
        return name.length <= 4;
    } else if (engRegex.test(name)) {
        return name.length <= 8;
    }
    return false;
}

async function saveUsername() {
    const input = document.getElementById('username-input');
    if (!input) return;

    const name = input.value.trim();

    if (!name) {
        alert("닉네임을 입력해 주세요!");
        return;
    }

    if (!validateUsername(name)) {
        alert("닉네임 규칙을 확인해 주세요!\n- 한글: 4자 이내 (공백/특수문자/숫자 불가)\n- 영어: 8자 이내 (공백/특수문자/숫자 불가)");
        return;
    }

    currentUsername = name;
    
    const displayElement = document.getElementById('display-username');
    if (displayElement) displayElement.innerText = currentUsername;

    document.body.classList.remove('nickname-page');

    const loginScreen = document.getElementById('login-screen');
    const gameArea    = document.getElementById('game-area');
    if (loginScreen) loginScreen.style.display = 'none';
    if (gameArea)    gameArea.style.display     = 'block';

    if (typeof loadRpsRankings    === 'function') loadRpsRankings();
    if (typeof loadCircleRankings === 'function') loadCircleRankings();
    if (typeof loadLetterRankings === 'function') loadLetterRankings();
}

// ==========================================
// 2. 탭 전환 (3탭으로 확장)
// ==========================================
function switchGame(gameType) {
    const rpsContent    = document.getElementById('content-rps');
    const circleContent = document.getElementById('content-circle');
    const letterContent = document.getElementById('content-letter');
    const rpsTab        = document.getElementById('tab-rps');
    const circleTab     = document.getElementById('tab-circle');
    const letterTab     = document.getElementById('tab-letter');

    // 모두 숨기고 탭 비활성화
    [rpsContent, circleContent, letterContent].forEach(el => { if (el) el.style.display = 'none'; });
    [rpsTab, circleTab, letterTab].forEach(el => { if (el) el.classList.remove('active'); });

    if (gameType === 'rps') {
        if (rpsContent) rpsContent.style.display = 'flex';
        if (rpsTab)     rpsTab.classList.add('active');

    } else if (gameType === 'circle') {
        if (circleContent) circleContent.style.display = 'flex';
        if (circleTab)     circleTab.classList.add('active');
        if (typeof resizeCanvas === 'function') resizeCanvas();

    } else if (gameType === 'letter') {
        if (letterContent) letterContent.style.display = 'flex';
        if (letterTab)     letterTab.classList.add('active');
    }
}

window.addEventListener('load', () => {
    // 💡 배너 클릭 시 로그아웃 처리
    const gameBanner = document.getElementById('game-banner');
    gameBanner?.addEventListener('click', function() {
        const gameArea = document.getElementById('game-area');
        if (gameArea) gameArea.style.display = 'none';

        const loginScreen = document.getElementById('login-screen');
        if (loginScreen) loginScreen.style.display = 'flex';

        document.body.classList.add('nickname-page');
        currentUsername = null;
        
        const nicknameInput = document.getElementById('username-input');
        if (nicknameInput) {
            nicknameInput.value = '';
            nicknameInput.focus();
        }
    });

    initNicknamePageStyles();
    initNicknameInput();
    loadGameConfig();
});