// ==========================================
// 0. 전역 변수 설정 (중복 변수를 피하기 위해 완전히 비워둠)
// ==========================================
let currentUsername = "";
let evaluationMents = []; 

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
    
    // 변수명 충돌을 원천 차단하기 위해 내부 로컬 변수명을 _masterUrl, _masterKey로 우회 변경
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
// 1. 플랫폼 초기화 및 파일 프리로딩 이벤트
// ==========================================
window.addEventListener('load', async () => {
    initSupabase();
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
        input.placeholder = "한글 최대 5자 / 영어 최대 16자";
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
    if (byteLength > 16) {
        alert(`닉네임이 너무 깁니다! (현재: ${byteLength}바이트 / 최대: 16바이트)\n* 영문·숫자는 최대 16자, 한글은 최대 5자까지 가능합니다.`);
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