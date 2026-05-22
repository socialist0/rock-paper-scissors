// ==========================================
// 0. Supabase 환경변수 직접 주입
// ==========================================
const supabaseUrl = 'https://zqocsmfeigllzqladkqj.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpxb2NzbWZlaWdsbHpxbGFka3FqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2ODcxNzYsImV4cCI6MjA5NDI2MzE3Nn0.RC6XmK9zSaX5BnXYz_-rUFu2YMOq4_pOw7qDPELdnIk';

let currentUsername = "";
let evaluationMents = []; // 멘트 저장 배열

function initSupabase() {
    if (window._supabase) return true;
    if (typeof supabase !== 'undefined') {
        window._supabase = supabase.createClient(supabaseUrl, supabaseKey);
        return true;
    }
    return false;
}

// ==========================================
// 1. 플랫폼 초기화 및 파일 프리로딩 이벤트
// ==========================================
window.addEventListener('load', async () => {
    // 1. Supabase 백엔드 먼저 연결
    initSupabase();
    
    // 2. ment.json 멘트 파일 로드
    await loadMentsFromFile(); 
    
    // 3. 각 함수가 존재하는지 확인하고 안전하게 실행
    if (typeof fetchGlobalRankings === 'function') {
        fetchGlobalRankings();
    } else {
        console.log("💡 아직 game_rps.js 로딩 전이거나 함수를 찾을 수 없습니다.");
    }
    
    if (typeof fetchCircleRankings === 'function') {
        fetchCircleRankings();
    } else {
        console.log("💡 아직 game_circle.js 로딩 전이거나 함수를 찾을 수 없습니다.");
    }
    
    if (typeof initCircleCanvas === 'function') {
        initCircleCanvas();
    }
});

// 외부 ment.json 파일을 가져오는 안전한 함수
async function loadMentsFromFile() {
    try {
        const response = await fetch('ment.json');
        evaluationMents = await response.json();
    } catch (err) {
        console.error("멘트 파일 로드 실패, 기본값으로 대체합니다:", err);
        evaluationMents = [
            {max: 100, min: 80, text: "와우, 멋지고 완벽한 동그라미입니다! 👍"},
            {max: 79, min: 40, text: "제법 원 모양을 갖추었네요! 🙂"},
            {max: 39, min: 0, text: "찌그러진 감자 발견! 다시 그려봐요! 🥔"}
        ];
    }
}

// ==========================================
// 2. 닉네임 로그인 및 게임 선택 탭 시스템
// ==========================================

/**
 * 🌟 문자열의 바이트 길이를 정확하게 계산하는 헬퍼 함수
 * (영문/숫자/공백 등 ASCII는 1바이트, 한글/이모지 등은 3바이트로 계산)
 */
function getByteLength(str) {
    return new TextEncoder().encode(str).length;
}

function saveUsername() {
    const input = document.getElementById('username-input');
    const username = input.value.trim();

    // 1. 공백 입력 검증
    if (!username) {
        alert("닉네임을 입력해 주세요!");
        return;
    }

    // 2. 🛡️ [추가] 닉네임 16바이트 길이 제한 검증
    const byteLength = getByteLength(username);
    if (byteLength > 16) {
        alert(`닉네임이 너무 깁니다! (현재: ${byteLength}바이트 / 최대: 16바이트)\n* 영문·숫자는 최대 16자, 한글은 최대 5자까지 가능합니다.`);
        return;
    }

    currentUsername = username;
    document.getElementById('display-username').innerText = currentUsername;
    
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
        rpsContent.style.display = 'flex';
        circleContent.style.display = 'none';
        rpsTab.classList.add('active');
        circleTab.classList.remove('active');
    } else {
        rpsContent.style.display = 'none';
        circleContent.style.display = 'flex';
        circleTab.classList.add('active');
        rpsTab.classList.remove('active');
        if (typeof resizeCanvas === 'function') resizeCanvas();
    }
}

// 타이틀 클릭 시 메인(닉네임 입력) 화면으로 돌아가는 이벤트
window.addEventListener('load', () => {
    const mainTitle = document.getElementById('main-title');
    
    mainTitle?.addEventListener('click', function() {
        const gameArea = document.getElementById('game-area');
        if (gameArea) {
            gameArea.style.display = 'none';
        }

        const userSetup = document.getElementById('user-setup');
        if (userSetup) {
            userSetup.style.display = 'block';
        }

        currentUsername = null;
        
        const nicknameInput = document.getElementById('username-input');
        if (nicknameInput) {
            nicknameInput.value = '';
            nicknameInput.focus();
        }
        
        console.log("실제 메인 화면(user-setup)으로 부드럽게 이동 완료했습니다!");
    });
});