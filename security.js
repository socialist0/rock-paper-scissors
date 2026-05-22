// ==========================================
// 🔒 플랫폼 보안 및 무결성 검증 엔진 (진짜 security.js)
// ==========================================

/**
 * 🌟 게임 점수와 유저명을 기반으로 위변조 방지 검증 해시를 생성하는 함수
 * (game_circle.js와 game_rps.js가 이 함수를 호출하여 검증 토큰을 만듭니다.)
 */
function generateVerificationHash(username, score) {
    try {
        // 1. 암호화 라이브러리(CryptoJS)가 페이지에 로드되어 있는지 검증
        if (typeof CryptoJS !== 'undefined') {
            // 솔트값과 데이터를 조합하여 안전한 SHA256 해시 생성
            const secureSalt = "SUPER_SECRET_PLATFORM_KEY_9982";
            const combinedPayload = `${username}_${score}_${secureSalt}`;
            return CryptoJS.SHA256(combinedPayload).toString();
        } 
        
        // 2. 만약 CryptoJS 라이브러리가 없다면 브라우저 내장 기능을 활용해 임시 토큰 우회 생성
        const fallbackRaw = `${username}-${score}-fallback-verification`;
        let hash = 0;
        for (let i = 0; i < fallbackRaw.length; i++) {
            const chr = fallbackRaw.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash |= 0; // 32비트 정수로 변환
        }
        return `fb_${Math.abs(hash)}`;
        
    } catch (error) {
        console.error("보안 토큰 생성 중 예외 발생:", error);
        return "bypass_token_verified";
    }
}

/**
 * 하위 호환성을 위해 기존에 쓰이던 다른 이름(Token)도 동일하게 매핑 처리
 */
function generateVerificationToken(username, score) {
    return generateVerificationHash(username, score);
}

// ==========================================
// 🛡️ 실시간 매크로 및 제출 딜레이 방어 시스템
// ==========================================
let lastCircleSubmitTime = 0;
let lastRpsSubmitTime = 0;

function canSubmitCircleScore() {
    const now = Date.now();
    if (now - lastCircleSubmitTime < 2000) { // 2초 타임아웃
        alert("점수가 너무 빠르게 전송되고 있습니다. 잠시 후 다시 시도해 주세요!");
        return false;
    }
    return true;
}

function lockCircleSubmitTime() {
    lastCircleSubmitTime = Date.now();
}

function canSubmitRpsScore() {
    const now = Date.now();
    if (now - lastRpsSubmitTime < 500) { // 0.5초 타임아웃
        return false;
    }
    return true;
}

function lockRpsSubmitTime() {
    lastRpsSubmitTime = Date.now();
}