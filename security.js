// 🤫 외부인은 절대 모르는 나만의 비밀 키 (보안 문자열)
const SECRET_SALT = "my_super_secret_circle_game_2026";

/**
 * 🔒 점수 변조 방지: 이름과 점수를 비밀키와 섞어 암호화 해시(토큰) 생성
 */
async function generateVerificationHash(name, score) {
  const msgBuffer = new TextEncoder().encode(`${name}-${score}-${SECRET_SALT}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * ⏳ [가위바위보 전용] 트래픽 스팸 방지: 로컬 스토리지를 이용해 1초 연속 제출 차단
 */
function canSubmitRpsScore() {
  const lastSubmitTime = localStorage.getItem('last_submit_time_rps');
  if (!lastSubmitTime) return true;

  const cooldownTime = 1 * 1000; // ⏱️ 가위바위보는 1초 제한
  const timePassed = Date.now() - parseInt(lastSubmitTime);

  if (timePassed < cooldownTime) {
    // 1초 제한이므로 굳이 alert를 띄워 흐름을 끊기보다는 부드럽게 무시(false 리턴)하도록 처리합니다.
    return false;
  }
  return true;
}

/**
 * ⏳ [원 그리기 전용] 트래픽 스팸 방지: 로컬 스토리지를 이용해 20초 연속 제출 차단
 */
function canSubmitCircleScore() {
  const lastSubmitTime = localStorage.getItem('last_submit_time_circle');
  if (!lastSubmitTime) return true;

  const cooldownTime = 20 * 1000; // ⏱️ 원 그리기는 20초 제한
  const timePassed = Date.now() - parseInt(lastSubmitTime);

  if (timePassed < cooldownTime) {
    const timeLeft = Math.ceil((cooldownTime - timePassed) / 1000);
    alert(`과도한 연속 제출은 제한됩니다. ${timeLeft}초 후에 다시 시도해 주세요!`);
    return false;
  }
  return true;
}

/**
 * 🔒 [가위바위보 전용] 제출 성공 시 로컬 스토리지에 시간 잠금 기록
 */
function lockRpsSubmitTime() {
  localStorage.setItem('last_submit_time_rps', Date.now().toString());
}

/**
 * 🔒 [원 그리기 전용] 제출 성공 시 로컬 스토리지에 시간 잠금 기록
 */
function lockCircleSubmitTime() {
  localStorage.setItem('last_submit_time_circle', Date.now().toString());
}