// ==========================================
// 0. 전역 변수 설정
// ==========================================
let currentUsername = "";
let evaluationMents = [];

// ✨ Supabase game_config 테이블에서 불러올 게임 조건 전역변수
let RPS_THRESHOLD = 9;
let CIRCLE_THRESHOLD = 95;
let ABC_THRESHOLD = 9;
let BLOCK_THRESHOLD = 9;

/**
 * config.js에서 이미 선언된 supabaseUrl과 supabaseKey를
 * 충돌 없이 안전하게 상속받아 연동하는 복구 엔진
 */
function initSupabase() {
    if (window._supabase) {
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
            .select('key, value');

        if (error) throw error;

        if (data && data.length > 0) {
            data.forEach(item => {
                if (item.key === 'rps_threshold') {
                    RPS_THRESHOLD = parseInt(item.value, 10);
                } else if (item.key === 'circle_threshold') {
                    CIRCLE_THRESHOLD = parseInt(item.value, 10);
                } else if (item.key === 'abc_threshold') {
                    ABC_THRESHOLD = parseInt(item.value, 10);
                } else if (item.key === 'block_threshold') {
                    BLOCK_THRESHOLD = parseInt(item.value, 10);
                }
            });
            console.log(`[Config 로드 완료] 가위바위보: ${RPS_THRESHOLD}, 원 그리기: ${CIRCLE_THRESHOLD}, 앞뒤 맞추기: ${ABC_THRESHOLD}, 블록쌓기: ${BLOCK_THRESHOLD}`);
        }
    } catch (err) {
        console.warn("설정값 원격 로드 실패, 로컬 기본값으로 세팅을 수호합니다:", err);
    } finally {
        updateThresholdUI();
    }
}

function updateThresholdUI() {
    const rpsHint = document.getElementById('rps-threshold-hint');
    const circleHint = document.getElementById('circle-threshold-hint');
    const abcHint = document.getElementById('abc-threshold-hint');
    const blockHint = document.getElementById('block-threshold-hint');
    if (rpsHint) rpsHint.innerText = RPS_THRESHOLD;
    if (circleHint) circleHint.innerText = CIRCLE_THRESHOLD;
    if (abcHint) abcHint.innerText = ABC_THRESHOLD;
    if (blockHint) blockHint.innerText = BLOCK_THRESHOLD;
}

// ==========================================
// 2. 닉네임 모달 (10위 안에 들었을 때만 호출)
// ==========================================

/**
 * 닉네임 입력 모달을 띄웁니다.
 * @param {number|string} score - 달성한 점수 (표시용)
 * @param {number} rank         - 달성한 순위 (표시용)
 * @param {function} onConfirm  - 닉네임 확정 시 호출할 콜백 (nickname: string)
 */
function showNicknameModal(score, rank, onConfirm) {
    // 기존 모달이 있으면 제거
    const existing = document.getElementById('nickname-modal-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'nickname-modal-overlay';
    overlay.innerHTML = `
        <div id="nickname-modal">
            <p class="nickname-modal-congrats">🏅 ${rank}위 달성!</p>
            <p class="nickname-modal-score">점수: <strong>${score}</strong></p>
            <p class="nickname-modal-desc">명예의 전당에 등록할 닉네임을 입력하세요</p>
            <p class="nickname-modal-rule">한글 4자 또는 영어 8자 이내<br>(공백·특수문자·숫자 불가)</p>
            <input type="text" id="nickname-modal-input" maxlength="12"
                placeholder="닉네임 입력" autocomplete="off" />
            <div class="nickname-modal-buttons">
                <button id="nickname-modal-confirm">등록하기</button>
                <button id="nickname-modal-skip">건너뛰기</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    const input = document.getElementById('nickname-modal-input');
    const confirmBtn = document.getElementById('nickname-modal-confirm');
    const skip = document.getElementById('nickname-modal-skip');

    // 포커스
    setTimeout(() => input.focus(), 100);

    function validateUsername(name) {
        const korRegex = /^[가-힣ㄱ-ㅎㅏ-ㅣ]+$/;
        const engRegex = /^[a-zA-Z]+$/;
        if (engRegex.test(name)) return name.length <= 8;
        if (korRegex.test(name)) return name.length <= 4;
        return false;
    }

    function handleConfirm() {
        input.blur();
        setTimeout(() => {
            const name = input.value.trim();
            console.log('name:', name, 'validate:', validateUsername(name)); // 추가
            if (!name) {
                input.focus();
                input.classList.add('shake');
                setTimeout(() => input.classList.remove('shake'), 400);
                input.placeholder = '닉네임을 입력해 주세요!';
                return;
            }
            if (!validateUsername(name)) {
                input.focus();
                input.classList.add('shake');
                setTimeout(() => input.classList.remove('shake'), 400);
                input.value = '';
                input.placeholder = '한글 4자 또는 영어 8자 이내';
                return;
            }
            currentUsername = name;
            overlay.remove();
            onConfirm(name);
        }, 100);
    }

    function handleSkip() {
        overlay.remove();
        onConfirm('미입력');
    }

    confirmBtn.addEventListener('click', handleConfirm);
    skip.addEventListener('click', handleSkip);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleConfirm();
        }
    });
}

// ==========================================
// 3. 탭 전환 (4탭)
// ==========================================
function switchGame(gameType) {
    const rpsContent = document.getElementById('content-rps');
    const circleContent = document.getElementById('content-circle');
    const letterContent = document.getElementById('content-letter');
    const blockContent = document.getElementById('content-block');
    const rpsTab = document.getElementById('tab-rps');
    const circleTab = document.getElementById('tab-circle');
    const letterTab = document.getElementById('tab-letter');
    const blockTab = document.getElementById('tab-block');

    [rpsContent, circleContent, letterContent, blockContent].forEach(el => { if (el) el.style.display = 'none'; });
    [rpsTab, circleTab, letterTab, blockTab].forEach(el => { if (el) el.classList.remove('active'); });

    if (gameType === 'rps') {
        if (rpsContent) rpsContent.style.display = 'flex';
        if (rpsTab) rpsTab.classList.add('active');

    } else if (gameType === 'circle') {
        if (circleContent) circleContent.style.display = 'flex';
        if (circleTab) circleTab.classList.add('active');
        if (typeof resizeCanvas === 'function') resizeCanvas();

    } else if (gameType === 'letter') {
        if (letterContent) letterContent.style.display = 'flex';
        if (letterTab) letterTab.classList.add('active');

    } else if (gameType === 'block') {
        if (blockContent) blockContent.style.display = 'flex';
        if (blockTab) blockTab.classList.add('active');
    }
}

// ==========================================
// 4. 앱 진입 — 닉네임 화면 없이 바로 게임 시작
// ==========================================
window.addEventListener('load', async () => {
    // game_config 먼저 로드 (게임 모듈보다 먼저 threshold 확보)
    await loadGameConfig();

    // 게임 화면 바로 표시
    const loginScreen = document.getElementById('login-screen');
    const gameArea = document.getElementById('game-area');
    if (loginScreen) loginScreen.style.display = 'none';
    if (gameArea) gameArea.style.display = 'block';

    // 랭킹 초기 로드
    if (typeof loadRpsRankings === 'function') loadRpsRankings();
    if (typeof loadCircleRankings === 'function') loadCircleRankings();
    if (typeof loadLetterRankings === 'function') loadLetterRankings();
    if (typeof loadBlockRankings === 'function') loadBlockRankings();

    // 기본 탭: 원 그리기
    switchGame('circle');
    const params = new URLSearchParams(window.location.search);
    const returnGame = params.get('game');
    if (returnGame) {
        switchGame(returnGame);
    }
});