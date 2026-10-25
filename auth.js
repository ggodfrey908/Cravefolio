import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.8/+esm';
const supabase = createClient('https://pbczagafrazaylcaepqy.supabase.co', 'sb_publishable_xMDpDophp-dacKxk0Qggiw_339u1rIe');
const $ = id => document.getElementById(id);
function notice(message, error=false) { const el=$('status'); if(el){el.textContent=message;el.className=error?'status error':'status';} }
const {data:{session}} = await supabase.auth.getSession();
if(location.pathname.endsWith('/login.html') && session) location.replace('/account.html');
if(location.pathname.endsWith('/account.html')) {
 if(!session) location.replace('/login.html');
 else { $('email').textContent=session.user.email||'Unknown'; $('identifier').textContent=session.user.id; }
}
$('signup')?.addEventListener('submit', async e=>{
 e.preventDefault(); notice('Creating account…');
 const {data,error}=await supabase.auth.signUp({email:$('signup-email').value.trim(),password:$('signup-password').value,options:{emailRedirectTo:'https://cravefolio.pages.dev/account.html'}});
 if(error) return notice(error.message,true);
 if(data.session) location.assign('/account.html');
 else notice('Check your email for a confirmation link, then return to sign in.');
});
$('signin')?.addEventListener('submit', async e=>{
 e.preventDefault(); notice('Signing in…');
 const {error}=await supabase.auth.signInWithPassword({email:$('signin-email').value.trim(),password:$('signin-password').value});
 if(error) return notice(error.message,true);
 location.assign('/account.html');
});
$('reset')?.addEventListener('click',async()=>{
 const email=$('signin-email').value.trim(); if(!email) return notice('Enter your email in the sign-in field first.',true);
 const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:'https://cravefolio.pages.dev/reset-password.html'});
 notice(error?error.message:'If the address has an account, a reset email will arrive.',!!error);
});
$('password-reset')?.addEventListener('submit',async e=>{
 e.preventDefault();const {error}=await supabase.auth.updateUser({password:$('new-password').value});
 notice(error?error.message:'Password updated. You can visit your account.',!!error);
});
$('signout')?.addEventListener('click',async()=>{
 const {error}=await supabase.auth.signOut();if(error)return notice(error.message,true);location.replace('/login.html');
});
