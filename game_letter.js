// ==========================================
// game_letter.js — 앞뒤 맞추기 서바이벌 게임 모듈
// ==========================================

const LETTER_LIMIT_TIME = 5.0;
const letter_alphabet = 'abcdefghijklmnopqrstuvwxyz';
const letter_hangul = 'ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ';

let letterCurrentSet = '';
let letterTargetIndex = -1;
let letterPrev = '';
let letterNext = '';
let letterStep = 0;

let letterStartTime = 0;
let letterTimerInterval = null;
let letterIsPlaying = false;

let letterStreak = 0;
let lastLetterUploadedId = null;


// ==========================================
// 1. 게임 초기화 및 문제 생성
// ==========================================
function initLetterGame() {
    letterStreak = 0;
    const scoreEl = document.getElementById('letter-current-score');
    if (scoreEl) scoreEl.textContent = 0;

    const startBtn = document.getElementById('letter-start-btn');
    if (startBtn) startBtn.style.display = 'none';

    nextLetterQuestion();
}

function nextLetterQuestion() {
    letterIsPlaying = true;
    letterStep = 0;

    const timerEl = document.getElementById('letter-timer');
    if (timerEl) {
        timerEl.classList.remove('letter-danger');
        timerEl.textContent = `${LETTER_LIMIT_TIME.toFixed(2)}초`;
    }

    const resultEl = document.getElementById('letter-result-message');
    if (resultEl) {
        resultEl.className = 'letter-result success';
        resultEl.textContent = letterStreak > 0 ? `정답! ${letterStreak}연승 중!` : '';
    }

    const instrEl = document.getElementById('letter-instruction');
    if (instrEl) instrEl.textContent = '앞 글자 채우기 단계를 진행 중입니다.';

    if (Math.random() < 0.5) {
        letterCurrentSet = letter_alphabet;
        letterTargetIndex = Math.floor(Math.random() * 24) + 1;
    } else {
        letterCurrentSet = letter_hangul;
        letterTargetIndex = Math.floor(Math.random() * 12) + 1;
    }

    const target = letterCurrentSet[letterTargetIndex];
    letterPrev = letterCurrentSet[letterTargetIndex - 1];
    letterNext = letterCurrentSet[letterTargetIndex + 1];

    const quizArea = document.getElementById('letter-quiz-area');
    if (quizArea) {
        quizArea.innerHTML = `
            <div class="letter-blank-box" id="letter-left-box"></div>
            <div id="letter-target-letter">${target}</div>
            <div class="letter-blank-box" id="letter-right-box"></div>
        `;
    }

    const choices = [letterPrev, letterNext];
    while (choices.length < 6) {
        const rand = letterCurrentSet[Math.floor(Math.random() * letterCurrentSet.length)];
        if (!choices.includes(rand) && rand !== target) choices.push(rand);
    }
    choices.sort(() => Math.random() - 0.5);

    const container = document.getElementById('letter-choices-container');
    if (container) {
        container.innerHTML = '';
        choices.forEach(letter => {
            const btn = document.createElement('button');
            btn.className = 'letter-choice-btn';
            btn.textContent = letter;
            btn.onclick = () => handleLetterChoice(letter, btn);
            container.appendChild(btn);
        });
    }

    clearInterval(letterTimerInterval);
    letterStartTime = performance.now();
    letterTimerInterval = setInterval(updateLetterCountdown, 10);
}


// ==========================================
// 2. 타이머 및 입력 처리
// ==========================================
function updateLetterCountdown() {
    const elapsed = (performance.now() - letterStartTime) / 1000;
    let remaining = LETTER_LIMIT_TIME - elapsed;
    const timerEl = document.getElementById('letter-timer');

    if (remaining <= 0) {
        remaining = 0;
        if (timerEl) timerEl.textContent = '0.00초';
        letterGameOver('TIMEOUT');
    } else {
        if (timerEl) {
            timerEl.textContent = `${remaining.toFixed(2)}초`;
            if (remaining <= 1.5) timerEl.classList.add('letter-danger');
        }
    }
}

function handleLetterChoice(letter, btn) {
    if (!letterIsPlaying) return;

    if (letterStep === 0) {
        if (letter === letterPrev) {
            letterStep = 1;
            btn.classList.add('letter-selected');

            const leftBox = document.getElementById('letter-left-box');
            if (leftBox) {
                leftBox.textContent = letterPrev;
                leftBox.style.borderStyle = 'solid';
                leftBox.style.borderColor = '#ed8936';
            }

            const instrEl = document.getElementById('letter-instruction');
            if (instrEl) instrEl.textContent = '잘하셨어요! 이제 뒷 글자를 선택하세요.';
        } else {
            letterGameOver('WRONG');
        }
    } else if (letterStep === 1) {
        if (letter === letterNext) {
            const rightBox = document.getElementById('letter-right-box');
            if (rightBox) rightBox.textContent = letterNext;

            letterStreak++;
            const scoreEl = document.getElementById('letter-current-score');
            if (scoreEl) scoreEl.textContent = letterStreak;

            letterIsPlaying = false;
            clearInterval(letterTimerInterval);
            setTimeout(nextLetterQuestion, 150);
        } else {
            letterGameOver('WRONG');
        }
    }
}


// ==========================================
// 3. 게임 오버 — 닉네임 분기 포함
// ==========================================
function letterGameOver(reason) {
    clearInterval(letterTimerInterval);
    letterIsPlaying = false;

    const timerEl = document.getElementById('letter-timer');
    if (timerEl) timerEl.classList.remove('letter-danger');

    const resultEl = document.getElementById('letter-result-message');
    if (resultEl) {
        resultEl.className = 'letter-result fail';
        resultEl.textContent = reason === 'TIMEOUT'
            ? `⏰ 시간 초과! 게임 종료 (${letterStreak}연승)`
            : `💥 틀렸습니다! 게임 종료 (${letterStreak}연승)`;
    }

    const instrEl = document.getElementById('letter-instruction');
    if (instrEl) instrEl.textContent = '아쉽네요! 정답을 확인하고 다시 도전해 보세요.';

    const leftBox = document.getElementById('letter-left-box');
    const rightBox = document.getElementById('letter-right-box');
    if (leftBox) { leftBox.textContent = letterPrev; leftBox.style.color = '#3182ce'; }
    if (rightBox) { rightBox.textContent = letterNext; rightBox.style.color = '#38a169'; }

    document.querySelectorAll('.letter-choice-btn').forEach(btn => {
        btn.classList.remove('letter-selected');
        if (btn.textContent === letterPrev) {
            btn.style.cssText += 'background-color:#3182ce;color:white;border-color:#3182ce;';
        } else if (btn.textContent === letterNext) {
            btn.style.cssText += 'background-color:#38a169;color:white;border-color:#38a169;';
        }
    });

    const startBtn = document.getElementById('letter-start-btn');
    if (startBtn) {
        startBtn.textContent = '다시 도전하기';
        startBtn.style.display = 'block';
    }

    if (letterStreak > 0) {
        handleLetterGameOver(letterStreak);
    } else {
        lastLetterUploadedId = null;
    }
}

async function handleLetterGameOver(score) {
    if (!initSupabase()) return;

    // 1. 순위 계산
    const { data: allData } = await window._supabase
        .from('abc_rank')
        .select('score')
        .order('score', { ascending: false });

    const top10 = allData ? allData.slice(0, 10) : [];
    const rank = top10.length < 10 ? allData.filter(r => r.score > score).length + 1 : top10.filter(r => r.score > score).length + 1;
    // 2. 닉네임 분기
    const doSave = async (nickname) => {
        await uploadLetterScore(score, nickname);

        // 3. suddenwinner 조건 — 저장 완료 후 이동
        if (score >= ABC_THRESHOLD) {
            sessionStorage.setItem('abc_celebration_verified', 'true');
            sessionStorage.setItem('abc_celebration_score', score.toString());
            setTimeout(() => {
                window.location.href = `suddenwinner.html?game=abc&score=${score}`;
            }, 800);
        }
    };

    if (currentUsername) {
        await doSave(currentUsername);
    } else if (rank <= 10) {
        showNicknameModal(score, rank, doSave);
    } else {
        await doSave('outranker');
    }
}

async function uploadLetterScore(score, nickname) {
    if (!initSupabase()) return;
    try {
        let verificationHash = '';
        if (typeof generateVerificationToken === 'function') {
            verificationHash = generateVerificationToken(nickname, score);
        } else if (typeof generateVerificationHash === 'function') {
            verificationHash = generateVerificationHash(nickname, score);
        }

        const { data, error } = await window._supabase
            .from('abc_rank')
            .insert([{
                username: nickname,
                score: score,
                verification_token: verificationHash
            }])
            .select();

        if (error) throw error;

        if (data && data.length > 0) {
            lastLetterUploadedId = String(data[0].id);
        }

        if (typeof lockLetterSubmitTime === 'function') lockLetterSubmitTime();

        await fetchLetterRankings({ showMyRank: true, myScore: score });

    } catch (err) {
        console.error('앞뒤 맞추기 업로드 실패:', err);
    }
}


// ==========================================
// 4. 랭킹 조회 및 화면 표시
// ==========================================
async function fetchLetterRankings({ showMyRank = false, myScore = null } = {}) {
    if (!initSupabase()) return;
    try {
        const { data, error } = await window._supabase
            .from('abc_rank')
            .select('*')
            .order('score', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) throw error;

        const rankingList = document.getElementById('letterRankingList');
        if (!rankingList) return;

        rankingList.innerHTML = '';

        if (!data || data.length === 0) {
            rankingList.innerHTML = '<li>랭킹이 없습니다.</li>';
            return;
        }

        const uniqueRankings = [];
        const seenPairs = new Set();
        for (const player of data) {
            const key = `${player.username}_${player.score}`;
            if (!seenPairs.has(key)) {
                seenPairs.add(key);
                uniqueRankings.push(player);
            }
            if (uniqueRankings.length >= 10) break;
        }

        uniqueRankings.forEach((player, index) => {
            const dateString = formatBlockDate(player.created_at);
            const li = document.createElement('li');
            const isMyNew = lastLetterUploadedId && String(player.id) === lastLetterUploadedId;

            if (isMyNew) {
                li.style.cssText = 'background-color:#e6f4ea;color:#137333;font-weight:bold;border-radius:5px;padding:6px 10px;margin:4px 0;transition:all 0.5s ease;';
                li.innerHTML = `<strong>${index + 1}위.</strong> ${player.username} — 🏆 ${player.score}연승 <span style="font-size:0.85rem;color:#137333;float:right;">(${dateString})</span>`;
            } else {
                li.style.padding = '4px 8px';
                li.innerHTML = `<strong>${index + 1}위.</strong> ${player.username} — 🏆 ${player.score}연승 <span style="font-size:0.85rem;color:#888;float:right;">(${dateString})</span>`;
            }
            rankingList.appendChild(li);
        });

        if (showMyRank && myScore !== null && lastLetterUploadedId) {
            const allUnique = [];
            const allSeen = new Set();
            for (const player of data) {
                const key = `${player.username}_${player.score}`;
                if (!allSeen.has(key)) { allSeen.add(key); allUnique.push(player); }
            }
            const myRank = allUnique.findIndex(p => String(p.id) === lastLetterUploadedId);
            if (myRank !== -1) {
                const resultEl = document.getElementById('letter-result-message');
                if (resultEl) {
                    resultEl.textContent = myRank === 0
                        ? `💥 게임 종료!\n최종 기록: ${myScore}연승  |  내 순위: ${myRank + 1}위 🥇`
                        : `💥 게임 종료!\n최종 기록: ${myScore}연승  |  내 순위: ${myRank + 1}위`;
                }
            }
        }

    } catch (err) {
        console.error('앞뒤 맞추기 랭킹 로드 실패:', err);
    }
}

function loadLetterRankings() {
    fetchLetterRankings();
}

// ── 공통 날짜 포맷: yy/mm/dd hh:mm:ss (KST) ──
function formatBlockDate(isoString) {
    const d = new Date(isoString);
    const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    const yy = String(kst.getUTCFullYear()).slice(2);
    const mo = String(kst.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(kst.getUTCDate()).padStart(2, '0');
    const hh = String(kst.getUTCHours()).padStart(2, '0');
    const mm = String(kst.getUTCMinutes()).padStart(2, '0');
    const ss = String(kst.getUTCSeconds()).padStart(2, '0');
    return `${yy}/${mo}/${dd} ${hh}:${mm}:${ss}`;
}