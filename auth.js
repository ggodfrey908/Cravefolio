
const statusNode = document.getElementById('status');

let supabase;

try {
  const library = await Promise.race([
    import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.8/+esm'),
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error('Supabase library import timed out.')),
        10000
      )
    )
  ]);

  supabase = library.createClient(
    'https://pbczagafrazaylcaepqy.supabase.co',
    'sb_publishable_xMDpDophp-dacKxk0Qggiw_339u1rIe'
  );

} catch (error) {
  if (statusNode) {
    statusNode.textContent =
      'Authentication startup failed: ' +
      (error?.message || 'Unknown error');

    statusNode.className = 'status error';
  }

  throw error;
}

const $ = id => document.getElementById(id);

const page =
  location.pathname.split('/').pop().replace(/\.html$/, '') + '.html';

const base = 'https://cravefolio.net';

// Display normal account and authentication messages.
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

// Create account.
$('signup')?.addEventListener('submit', async e => {
  e.preventDefault();

  notice('Creating account…');

  const { data, error } = await supabase.auth.signUp({
    email: $('signup-email').value.trim(),
    password: $('signup-password').value,
    options: {
      emailRedirectTo: base + '/account.html'
    }
  });

  if (error) {
    return notice(messageOf(error), true);
  }

  if (data.session) {
    location.assign('/account.html');
  } else {
    notice(
      'Check your email for a confirmation link, then return to sign in.'
    );
  }
});

// Sign in.
$('signin')?.addEventListener('submit', async e => {
  e.preventDefault();

  notice('Signing in…');

  const { error } = await supabase.auth.signInWithPassword({
    email: $('signin-email').value.trim(),
    password: $('signin-password').value
  });

  if (error) {
    return notice(messageOf(error), true);
  }

  location.assign('/account.html');
});

// Password recovery.
$('reset')?.addEventListener('click', async () => {
  const email = $('signin-email').value.trim();

  if (!email) {
    return notice(
      'Enter your email in the sign-in field first.',
      true
    );
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: base + '/reset-password.html'
  });

  notice(
    error
      ? messageOf(error)
      : 'If the address has an account, a reset email will arrive.',
    !!error
  );
});

// Update password.
$('password-reset')?.addEventListener('submit', async e => {
  e.preventDefault();

  const { error } = await supabase.auth.updateUser({
    password: $('new-password').value
  });

  notice(
    error
      ? messageOf(error)
      : 'Password updated. You can visit your account.',
    !!error
  );
});

// Sign out.
$('signout')?.addEventListener('click', async () => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    return notice(messageOf(error), true);
  }

  location.replace('/login.html');
});

// Display account information.
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

// Check the current account session.
async function initialize() {
  if (page !== 'account.html' && page !== 'login.html') {
    return;
  }

  let timeoutId;

  try {
    const result = await Promise.race([
      supabase.auth.getSession(),

      new Promise((_, reject) => {
        timeoutId = setTimeout(
          () => reject(
            new Error(
              'Session check timed out. Please reload this page.'
            )
          ),
          10000
        );
      })
    ]);

    if (result.error) {
      throw result.error;
    }

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
      'Cravefolio authentication initialization:',
      error
    );

  } finally {
    clearTimeout(timeoutId);
  }
}

// Start authentication.
initialize().catch(error => {
  notice('Initialization failed: ' + messageOf(error), true);
  console.error(error);
});
