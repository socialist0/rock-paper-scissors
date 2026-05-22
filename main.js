// ==========================================
// 0. 전역 변수 설정 (중복된 supabaseUrl, supabaseKey 완전 제거)
// ==========================================
let currentUsername = "";
let evaluationMents = []; // 멘트 저장 배열

/**
 * 🌟 config.js에서 이미 생성해 둔 window._supabase 객체를 
 * 개별 게임 스크립트들과 안전하게 동기화해 주는 마스터 함수
 */
function initSupabase() {
    if (window._supabase) {
        // 기존 개별 게임 코드들이 '_supabase' 변수를 바로 쓸 수 있도록 전역 스코프 바인딩
        if (typeof _supabase === 'undefined') {
            window._supabase = window._supabase;
        }
        return true;
    }
    
    // 만약 window._supabase가 없고 config.js의 변수들이 살아있다면 직접 로드 시도
    if (typeof supabase !== 'undefined' && typeof supabaseUrl !== 'undefined' && typeof supabaseKey !== 'undefined') {
        window._supabase = supabase.createClient(supabaseUrl, supabaseKey);
        return true;
    }
    
    console.error("⚠️ [에러] config.js 파일이 누락되었거나 window._supabase 객체를 바인딩할 수 없습니다.");
    return false;
}

// ==========================================
// 1. 플랫폼 초기화 및 파일 프리로딩 이벤트
// ==========================================
window.addEventListener('load', async () => {
    // 1. Supabase 백엔드 커넥션 확보
    initSupabase();
    
    // 2. ment.json 멘트 파일 로드
    await loadMentsFromFile(); 
    
    // 3. 닉네임 입력창에 플레이스홀더 바인딩 및 초기화
    initNicknameInput();
    
    // 4. 각 연동 모듈 함수가 메모리에 있는지 검증 후 실시간 탑텐 랭킹 보드 로드
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

/**
 * 🌟 닉네임 입력창 플레이스홀더 주입 함수
 */
function initNicknameInput() {
    const input = document.getElementById('username-input');
    if (input) {
        input.placeholder = "한글 최대 5자 / 영어 최대 16자";
    }
}

// ==========================================
// 2. 닉네임 로그인 및 게임 선택 탭 시스템
// ==========================================

/**
 * 문자열의 바이트 길이를 정확하게 계산하는 헬퍼 함수
 */
function getByteLength(str) {
    return new TextEncoder().encode(str).length;
}

function saveUsername() {
    const input = document.getElementById('username-input');
    if (!input) return;
    
    const username = input.value.trim();

    // 1. 공백 입력 검증
    if (!username) {
        alert("닉네임을 입력해 주세요!");
        return;
    }

    // 2. 🛡️ 닉네임 16바이트 길이 제한 검증
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
            initNicknameInput(); // 플레이스홀더 재주입
            nicknameInput.focus();
        }
        
        console.log("실제 메인 화면(user-setup)으로 부드럽게 이동 완료했습니다!");
    });
});