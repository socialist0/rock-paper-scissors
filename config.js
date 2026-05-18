// 본인의 진짜 Supabase 주소와 키를 적어주세요!
const supabaseUrl = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpxb2NzbWZlaWdsbHpxbGFka3FqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2ODcxNzYsImV4cCI6MjA5NDI2MzE3Nn0.RC6XmK9zSaX5BnXYz_-rUFu2YMOq4_pOw7qDPELdnIk'; 
const supabaseKey = 'sb_publishable_822gHu3gQf6ghFgT0zX-iA_KCUL7CjX'; 

// 맨 밑줄은 아까 수정한 대로 _supabase 유지!
const _supabase = supabase.createClient(supabaseUrl, supabaseKey);