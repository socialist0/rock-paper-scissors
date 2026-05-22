let rpsStreak = 0; 

/**
 * 가위바위보 대결 실행 및 판정 함수
 */
async function playGame(userChoice) {
    if (!currentUsername) {
        alert("시작하기 버튼을 먼저 눌러주세요!");
        return;
    }
    
    // 🛡️ [보안 가드] security.js의 타임락 연타 방지 검증 가동
    if (typeof canSubmitRpsScore === 'function' && !canSubmitRpsScore()) return;

    const choices = ['rock', 'paper', 'scissors'];
    const computerChoice = choices[Math.floor(Math.random() * 3)];
    const koreanChoices = { rock: '👊 주먹', paper: '🖐️ 보', scissors: '✌️ 가위' };
    let result = '';

    if (userChoice === computerChoice) {
        // 무승부일 때는 랭킹에 등록하지 않고 연승(Streak)을 그대로 유지합니다.
        result = `무승부입니다! 🤝\n현재 ${rpsStreak}연승 유지 중!`;

    } else if (
        (userChoice === 'rock' && computerChoice === 'scissors') ||
        (userChoice === 'paper' && computerChoice === 'rock') ||
        (userChoice === 'scissors' && computerChoice === 'paper')
    ) {
        // 이겼을 때는 화면에 연승 카운트만 올립니다.
        rpsStreak++;
        result = `이겼습니다! 🎉\n현재 ${rpsStreak}연승 중!`;
        document.getElementById('user-score').innerText = rpsStreak;
        
    } else {
        // 오직 컴퓨터에게 완전히 '졌을 때만' 연승이 마감되므로, 이때 랭킹에 최종 반영합니다!
        if (rpsStreak > 0) {
            await uploadRpsScore(rpsStreak);
        }
        result = `졌습니다... 😭\n최종 기록: ${rpsStreak}연승\n\n다시 도전해 보세요!`;
        rpsStreak = 0; // 패배했으므로 연승 초기화
        document.getElementById('user-score').innerText = rpsStreak;
    }

    document.getElementById('result-text').innerText = 
        `나: ${koreanChoices[userChoice]} vs 컴퓨터: ${koreanChoices[computerChoice]}\n\n${result}`;
}

/**
 * Supabase 데이터베이스에 가위바위보 연승 점수 업로드
 */
async function uploadRpsScore(score) {
    // main.js의 부모 통합 초기화 상태 및 점수 범위 유효성 검증
    if (!initSupabase() || score < 0 || score > 100) return;
    
    try {
        // 🐛 [버그 수정 완료] 기존 존재하지 않던 오타 함수 generateVerificationHash를 
        // security.js에 명시된 진짜 암호화 엔진 이름인 'generateVerificationToken'으로 교체 완료했습니다!
        const verificationHash = generateVerificationToken(currentUsername, score);
        
        // Supabase 'rankings' 테이블에 안전하게 보안 토큰과 점수 주입
        const { error } = await _supabase.from('rankings').insert([{ 
            username: currentUsername, 
            score: score, 
            verification_token: verificationHash 
        }]);
        
        if (error) throw error;
        
        // 🔒 [타임락 발동] 업로드가 안전하게 완료되면 현재 디바이스 세션에 1초간 점수 제출 잠금 처리
        if (typeof lockRpsSubmitTime === 'function') {
            lockRpsSubmitTime();
        }
        
        // 실시간 글로벌 명예의 전당 보드 갱신
        fetchGlobalRankings();
        
    } catch (err) { 
        console.error("❌ 가위바위보 점수 데이터베이스 업로드 실패:", err); 
    }
}

/**
 * Supabase로부터 실시간 글로벌 TOP 10 랭킹 보드 가져오기
 */
async function fetchGlobalRankings() {
    if (!initSupabase()) return;
    
    try {
        const { data, error } = await _supabase
            .from('rankings')
            .select('*')
            .order('score', { ascending: false })
            .limit(10);
            
        if (error) throw error;
        
        const rankingList = document.getElementById('rankingList');
        rankingList.innerHTML = data.length === 0 ? '<li>랭킹이 없습니다.</li>' : '';
        
        data.forEach((player, index) => {
            const dateString = new Date(player.created_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour12: false });
            const li = document.createElement('li');
            li.innerHTML = `<strong>${index + 1}위.</strong> ${player.username} — 🏆 ${player.score}연승 <span style="font-size:0.85rem; color:#888; float:right;">(${dateString})</span>`;
            rankingList.appendChild(li);
        });
        
    } catch (err) { 
        console.error("❌ 가위바위보 랭킹보드 로드 실패:", err); 
    }
}