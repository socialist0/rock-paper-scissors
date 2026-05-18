// 1. 내 프로젝트의 진짜 주소 (ID 값을 주소 형태로 조립했습니다)
const supabaseUrl = 'https://zqocsmfeigllyzqladkqj.supabase.co'; 

// 2. 내 프로젝트의 진짜 anon API 키 (엄청 긴 암호 텍스트)
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpxb2NzbWZlaWdsbHpxbGFka3FqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2ODcxNzYsImV4cCI6MjA5NDI2MzE3Nn0.RC6XmK9zSaX5BnXYz_-rUFu2YMOq4_pOw7qDPELdnIk'; 

// 3. 자바스크립트가 사용할 수 있도록 연결 객체 생성 (언더바 _supabase 유지!)
const _supabase = supabase.createClient(supabaseUrl, supabaseKey);