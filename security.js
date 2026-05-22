/**
 * 점수 조작 및 패킷 위조 방지를 위한 암호화/해시 생성 스크립트 (security.js)
 */

async function generateVerificationHash(username, score) {
    // 입력값 검증 및 데이터 정규화 (소수점 첫째 자리까지 문자열 고정)
    const normalizedScore = parseFloat(score).toFixed(1);
    const salt = "RPS_Circle_Game_TopSecret_Salt_2026!"; // 클라이언트 사이드 임시 솔트
    
    // 데이터 결합 (유저명 + 점수 + 솔트 조합으로 고유 데이터 구성)
    const message = `${username}_${normalizedScore}_${salt}`;
    
    // 브라우저 내장 Web Crypto API를 사용하여 SHA-256 해시 생성
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    
    // 버퍼 데이터를 16진수 문자열(Hex String)로 변환하여 리턴
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
}