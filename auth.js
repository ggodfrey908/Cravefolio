
const $ = id => document.getElementById(id);

const base = 'https://cravefolio.net';

// Supports both /account and /account.html,
// as well as /login and /login.html.
const page = (
  location.pathname
    .split('/')
    .filter(Boolean)
    .pop() || ''
).replace(/\.html$/, '') + '.html';

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

function setBusy(form, busy) {
  if (!form) return;

  form.dataset.busy = busy ? 'true' : 'false';

  form.querySelectorAll('button').forEach(button => {
    button.disabled = busy;
  });
}

let supabase;

// Load Supabase.
try {
  const library = await Promise.race([
    import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.8/+esm'),

    new Promise((_, reject) =>
      setTimeout(
        () => reject(
          new Error('Authentication service timed out. Please refresh.')
        ),
        10000
      )
    )
  ]);

  supabase = library.createClient(
    'https://pbczagafrazaylcaepqy.supabase.co',
    'sb_publishable_xMDpDophp-dacKxk0Qggiw_339u1rIe'
  );

} catch (error) {
  notice('Authentication could not start: ' + messageOf(error), true);
  throw error;
}

// CREATE ACCOUNT
$('signup')?.addEventListener('submit', async event => {
  event.preventDefault();

  const form = event.currentTarget;

  if (form.dataset.busy === 'true') return;

  const email = $('signup-email').value.trim();
  const password = $('signup-password').value;

  if (!email || password.length < 8) {
    return notice(
      'Enter a valid email and a password of at least 8 characters.',
      true
    );
  }

  setBusy(form, true);
  notice('Creating your account…');

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: base + '/account.html'
      }
    });

    if (error) throw error;

    if (data.session) {
      location.assign('/account.html');
      return;
    }

    notice(
      'Please check your email for a confirmation link. ' +
      'If you already have an account, try signing in or resetting your password.'
    );

  } catch (error) {
    notice(messageOf(error), true);

  } finally {
    setBusy(form, false);
  }
});

// SIGN IN
$('signin')?.addEventListener('submit', async event => {
  event.preventDefault();

  const form = event.currentTarget;

  if (form.dataset.busy === 'true') return;

  setBusy(form, true);
  notice('Signing in…');

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: $('signin-email').value.trim(),
      password: $('signin-password').value
    });

    if (error) throw error;

    location.assign('/account.html');

  } catch (error) {
    notice(messageOf(error), true);

  } finally {
    setBusy(form, false);
  }
});

// FORGOT PASSWORD
$('reset')?.addEventListener('click', async event => {
  const button = event.currentTarget;

  if (button.disabled) return;

  const email = $('signin-email')?.value.trim();

  if (!email) {
    return notice(
      'Enter your email in the sign-in field first.',
      true
    );
  }

  button.disabled = true;
  notice('Sending password reset instructions…');

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: base + '/reset-password.html'
    });

    if (error) throw error;

    notice(
      'If the address has an account, a password reset email will arrive.'
    );

  } catch (error) {
    notice(messageOf(error), true);

  } finally {
    button.disabled = false;
  }
});

// SAVE NEW PASSWORD
$('password-reset')?.addEventListener('submit', async event => {
  event.preventDefault();

  const form = event.currentTarget;

  if (form.dataset.busy === 'true') return;

  const password = $('new-password').value;

  if (password.length < 8) {
    return notice(
      'Your password must contain at least 8 characters.',
      true
    );
  }

  setBusy(form, true);
  notice('Updating password…');

  try {
    const { error } = await supabase.auth.updateUser({
      password
    });

    if (error) throw error;

    notice(
      'Password updated successfully. You can visit your account.'
    );

  } catch (error) {
    notice(messageOf(error), true);

  } finally {
    setBusy(form, false);
  }
});

// SIGN OUT
$('signout')?.addEventListener('click', async event => {
  const button = event.currentTarget;

  if (button.disabled) return;

  button.disabled = true;
  notice('Signing out…');

  try {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    location.replace('/login.html');

  } catch (error) {
    notice(messageOf(error), true);
    button.disabled = false;
  }
});

// DISPLAY ACCOUNT INFORMATION
function showAccount(session) {
  if (!session?.user) {
    location.replace('/login.html');
    return;
  }

  if ($('email')) {
    $('email').textContent = session.user.email || 'Unknown';
  }

  if ($('identifier')) {
    $('identifier').textContent = session.user.id;
  }

  notice('Account information loaded.');
}

// INITIALIZE AUTHENTICATION
async function initialize() {
  if (page !== 'login.html' && page !== 'account.html') {
    return;
  }

  let timeoutId;

  try {
    const result = await Promise.race([
      supabase.auth.getSession(),

      new Promise((_, reject) => {
        timeoutId = setTimeout(
          () => reject(
            new Error('Session check timed out. Please refresh.')
          ),
          10000
        );
      })
    ]);

    if (result.error) throw result.error;

    const session = result.data.session;

    if (page === 'account.html') {
      showAccount(session);

    } else if (session) {
      location.replace('/account.html');

    } else {
      notice('Enter your details below.');
    }

  } catch (error) {
    if (page === 'account.html') {
      if ($('email')) {
        $('email').textContent = 'Unable to load account';
      }

      if ($('identifier')) {
        $('identifier').textContent = 'Please refresh this page';
      }
    }

    notice(messageOf(error), true);

    console.error(
      'Cravefolio authentication:',
      error
    );

  } finally {
    clearTimeout(timeoutId);
  }
}

// START AUTHENTICATION
initialize().catch(error => {
  notice(
    'Authentication initialization failed: ' + messageOf(error),
    true
  );

  console.error(error);
});
