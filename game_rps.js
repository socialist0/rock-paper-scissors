let rpsStreak = 0; 
let lastRpsUploadedId = null; // 🌟 내가 방금 등록한 순위를 기억하기 위한 변수 추가

async function playGame(userChoice) {
    if (!currentUsername) {
        alert("시작하기 버튼을 먼저 눌러주세요!");
        return;
    }
    if (typeof canSubmitRpsScore === 'function' && !canSubmitRpsScore()) return;

    const choices = ['rock', 'paper', 'scissors'];
    const computerChoice = choices[Math.floor(Math.random() * 3)];
    const koreanChoices = { rock: '👊 주먹', paper: '🖐️ 보', scissors: '✌️ 가위' };
    let result = '';

    if (userChoice === computerChoice) {
        // 🤝 비겼을 때: 문구만 출력하고 연승 유지, 서버 업로드 없이 '즉시 함수 종료(return)'
        result = `무승부입니다! 🤝\n현재 ${rpsStreak}연승 유지 중!`;
        document.getElementById('result-text').innerText = 
            `나: ${koreanChoices[userChoice]} vs 컴퓨터: ${koreanChoices[computerChoice]}\n\n${result}`;
        return; 
    } 
    
    if (
        (userChoice === 'rock' && computerChoice === 'scissors') ||
        (userChoice === 'paper' && computerChoice === 'rock') ||
        (userChoice === 'scissors' && computerChoice === 'paper')
    ) {
        // 🎉 이겼을 때: 연승 카운트 증가, 화면 갱신 후 종료
        rpsStreak++;
        result = `이겼습니다! 🎉\n현재 ${rpsStreak}연승 중!`;
        document.getElementById('user-score').innerText = rpsStreak;
        
    } else {
        // 😭 졌을 때: 오직 졌을 때만 연승 기록이 1 이상일 경우 서버에 저장 시도
        if (rpsStreak > 0) {
            await uploadRpsScore(rpsStreak);
        } else {
            lastRpsUploadedId = null; // 0연승일 때는 하이라이트 초기화
        }
        result = `졌습니다... 😭\n최종 기록: ${rpsStreak}연승\n\n다시 도전해 보세요!`;
        rpsStreak = 0; 
        document.getElementById('user-score').innerText = rpsStreak;
    }

    document.getElementById('result-text').innerText = 
        `나: ${koreanChoices[userChoice]} vs 컴퓨터: ${koreanChoices[computerChoice]}\n\n${result}`;
}

async function uploadRpsScore(score) {
    if (!initSupabase() || score < 0 || score > 100) return;
    try {
        let verificationHash = "";
        if (typeof generateVerificationToken === 'function') {
            verificationHash = generateVerificationToken(currentUsername, score);
        } else if (typeof generateVerificationHash === 'function') {
            verificationHash = generateVerificationHash(currentUsername, score);
        }
        
        // 🌟 저장 후 새로 생성된 행의 고유 ID(id)를 가져오도록 .select() 추가
        const { data, error } = await window._supabase.from('rankings').insert([{ 
            username: currentUsername, 
            score: score, 
            verification_token: verificationHash 
        }]).select();
        
        if (error) throw error;
        
        // 🌟 방금 등록된 데이터의 고유 ID를 전역 변수에 보관
        if (data && data.length > 0) {
            lastRpsUploadedId = data[0].id;
        }
        
        if (typeof lockRpsSubmitTime === 'function') lockRpsSubmitTime();
        fetchGlobalRankings();
    } catch (err) { 
        console.error("가위바위보 업로드 실패:", err); 
    }
}

async function fetchGlobalRankings() {
    if (!initSupabase()) return;
    try {
        const { data, error } = await window._supabase
            .from('rankings')
            .select('*')
            .order('score', { ascending: false })
            .order('created_at', { ascending: false }) // 최신 기록 우선 정렬 추가
            .limit(10);
            
        if (error) throw error;
        const rankingList = document.getElementById('rankingList');
        if (!rankingList) return;
        
        rankingList.innerHTML = data.length === 0 ? '<li>랭킹이 없습니다.</li>' : '';
        
        data.forEach((player, index) => {
            const dateString = new Date(player.created_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour12: false });
            const li = document.createElement('li');
            
            // 🌟 내 최신 등록 기록과 일치하면 원 그리기와 동일하게 초록색으로 하이라이트 효과 적용
            if (lastRpsUploadedId && player.id === lastRpsUploadedId) {
                li.style.backgroundColor = '#e6f4ea'; 
                li.style.color = '#137333';
                li.style.fontWeight = 'bold';
                li.style.borderRadius = '5px';
                li.style.padding = '4px 8px';
                li.style.transition = 'all 0.5s ease';
                li.innerHTML = `<strong>${index + 1}위.</strong> ${player.username} — 🏆 ${player.score}연승 <span style="font-size:0.85rem; color:#137333; float:right;">(${dateString})</span>`;
            } else {
                li.innerHTML = `<strong>${index + 1}위.</strong> ${player.username} — 🏆 ${player.score}연승 <span style="font-size:0.85rem; color:#888; float:right;">(${dateString})</span>`;
            }
            rankingList.appendChild(li);
        });
    } catch (err) { 
        console.error("가위바위보 랭킹 로드 실패:", err); 
    }
}