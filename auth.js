// Diagnostic version: update the page before attempting the external import.
const statusNode = document.getElementById('status');
if (statusNode) statusNode.textContent = 'Step 1: auth.js started.';
let supabase;
try {
  const library = await Promise.race([
    import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.8/+esm'),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase library import timed out.')), 10000))
  ]);
  if (statusNode) statusNode.textContent = 'Step 2: Supabase library loaded.';
  supabase = library.createClient(
    'https://pbczagafrazaylcaepqy.supabase.co',
    'sb_publishable_xMDpDophp-dacKxk0Qggiw_339u1rIe'
  );
  if (statusNode) statusNode.textContent = 'Step 3: Supabase client created.';
} catch (error) {
  if (statusNode) {
    statusNode.textContent = 'Authentication startup failed: ' + (error?.message || 'Unknown error');
    statusNode.className = 'status error';
  }
  throw error;
}
const $ = id => document.getElementById(id);
const page = location.pathname.split('/').pop().replace(/\.html$/, '') + '.html';
const base = 'https://cravefolio.pages.dev';

function notice(message, error = false) {
  const el = $('status');
  if (el) {
    el.textContent = message;
    el.className = error ? 'status error' : 'status';
  }
}

function messageOf(error) {
  return error?.message || 'Something went wrong. Please try again.';
}

// Attach form handlers before checking the current session.
$('signup')?.addEventListener('submit', async e => {
  e.preventDefault();
  notice('Creating account…');
  const { data, error } = await supabase.auth.signUp({
    email: $('signup-email').value.trim(),
    password: $('signup-password').value,
    options: { emailRedirectTo: base + '/account.html' }
  });
  if (error) return notice(messageOf(error), true);
  if (data.session) location.assign('/account.html');
  else notice('Check your email for a confirmation link, then return to sign in.');
});

$('signin')?.addEventListener('submit', async e => {
  e.preventDefault();
  notice('Signing in…');
  const { error } = await supabase.auth.signInWithPassword({
    email: $('signin-email').value.trim(),
    password: $('signin-password').value
  });
  if (error) return notice(messageOf(error), true);
  location.assign('/account.html');
});

$('reset')?.addEventListener('click', async () => {
  const email = $('signin-email').value.trim();
  if (!email) return notice('Enter your email in the sign-in field first.', true);
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: base + '/reset-password.html'
  });
  notice(error ? messageOf(error) : 'If the address has an account, a reset email will arrive.', !!error);
});

$('password-reset')?.addEventListener('submit', async e => {
  e.preventDefault();
  const { error } = await supabase.auth.updateUser({ password: $('new-password').value });
  notice(error ? messageOf(error) : 'Password updated. You can visit your account.', !!error);
});

$('signout')?.addEventListener('click', async () => {
  const { error } = await supabase.auth.signOut();
  if (error) return notice(messageOf(error), true);
  location.replace('/login.html');
});

function showAccount(session) {
  if (!session?.user) {
    location.replace('/login.html');
    return;
  }
  if ($('email')) $('email').textContent = session.user.email || 'Unknown';
  if ($('identifier')) $('identifier').textContent = session.user.id;
  notice('Account information loaded.');
}

// A timeout prevents the account page from showing Loading forever.
async function initialize() {
  notice('Step 4B: Page detected as ' + page);
  if (page !== 'account.html' && page !== 'login.html') return;
  notice('Step 4: Checking your account session…');
  let timeoutId;
  try {
    const result = await Promise.race([
      supabase.auth.getSession(),
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Session check timed out. Please reload this page.')), 10000);
      })
    ]);
    if (result.error) throw result.error;
    const session = result.data.session;
    notice('Step 5: Session check completed.');
    if (page === 'account.html') showAccount(session);
    else if (session) location.replace('/account.html');
  } catch (error) {
    if (page === 'account.html') {
      if ($('email')) $('email').textContent = 'Unable to load account';
      if ($('identifier')) $('identifier').textContent = 'Please refresh this page';
    }
    notice(messageOf(error), true);
    console.error('Cravefolio authentication initialization:', error);
  } finally {
    clearTimeout(timeoutId);
  }
}

notice('Step 4A: Reached initialization.');
initialize().catch(error => {
  notice('Initialization failed: ' + error.message, true);
  console.error(error);
});
