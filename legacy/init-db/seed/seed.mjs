// Seed idempotente do legado: cria o usuario admin via API.
//
// Roda como servico one-shot (`seed`) no docker compose, DEPOIS que auth e
// brain ficam saudaveis. Usa so a API publica — nao depende de schema interno.
//
// Credenciais via env (com defaults de dev):
//   SEED_ADMIN_USERNAME=admin  SEED_ADMIN_PASSWORD=admin123
//   SEED_ADMIN_ROLE=admin      SEED_ADMIN_EMAIL=admin@arthemis.local
//   SEED_PROPONENT_NAME / SEED_PROPONENT_EMAIL
const AUTH = process.env.AUTH_URL ?? 'http://auth:6769';
const BRAIN = process.env.BRAIN_URL ?? 'http://brain:8081';

const USERNAME = process.env.SEED_ADMIN_USERNAME ?? 'admin';
const PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'admin123';
const ROLE = process.env.SEED_ADMIN_ROLE ?? 'admin';
const EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@arthemis.local';
const PROPONENT_NAME = process.env.SEED_PROPONENT_NAME ?? 'Arthemis Admin Org';
const PROPONENT_EMAIL = process.env.SEED_PROPONENT_EMAIL ?? 'admin@arthemis.local';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitHealthy(url, name, timeoutMs = 120000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        console.log(`[seed] ${name} saudavel (${url})`);
        return;
      }
    } catch { /* tenta de novo */ }
    await sleep(2000);
  }
  throw new Error(`[seed] timeout esperando ${name} em ${url}`);
}

async function postJSON(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* corpo nao-JSON */ }
  return { status: res.status, ok: res.ok, data, text };
}

async function main() {
  await waitHealthy(`${AUTH}/health`, 'auth');
  await waitHealthy(`${BRAIN}/health`, 'brain');

  // 1) Usuario no auth (credenciais + JWT). Se ja existir (409), so loga.
  let sub = null;
  const reg = await postJSON(`${AUTH}/register/`, { username: USERNAME, password: PASSWORD, role: ROLE });
  if (reg.status === 201 && reg.data?.sub) {
    sub = reg.data.sub;
    console.log(`[seed] admin criado no auth (sub=${sub})`);
  } else if (reg.status === 409) {
    const login = await postJSON(`${AUTH}/login/`, { username: USERNAME, password: PASSWORD });
    if (!login.ok || !login.data?.token) throw new Error(`[seed] admin ja existe mas login falhou: ${login.status} ${login.text}`);
    const [, payload] = login.data.token.split('.');
    sub = JSON.parse(Buffer.from(payload, 'base64url').toString()).sub;
    console.log(`[seed] admin ja existia no auth (sub=${sub})`);
  } else {
    throw new Error(`[seed] /register falhou: ${reg.status} ${reg.text}`);
  }

  // 2) Proponente no brain (obrigatorio p/ criar usuario: proponent_id FK).
  //    GET /proponent/ lista; se vazio, cria um.
  const listRes = await fetch(`${BRAIN}/proponent/`);
  let proponentId = null;
  if (listRes.ok) {
    const list = await listRes.json();
    if (Array.isArray(list) && list.length > 0) proponentId = list[0].id ?? list[0].ID;
  }
  if (proponentId == null) {
    const created = await postJSON(`${BRAIN}/proponent/create`, { Name: PROPONENT_NAME, Email: PROPONENT_EMAIL });
    if (!created.ok) throw new Error(`[seed] /proponent/create falhou: ${created.status} ${created.text}`);
    proponentId = typeof created.data === 'number' ? created.data : created.data?.id ?? created.data?.ID;
    console.log(`[seed] proponente criado (id=${proponentId})`);
  } else {
    console.log(`[seed] proponente ja existia (id=${proponentId})`);
  }

  // 3) Perfil no brain (liga sub do auth ao proponente). Se ja existir, ignora.
  const user = await postJSON(`${BRAIN}/user/create`, {
    id: sub, proponent_id: proponentId, username: USERNAME, email: EMAIL, role: ROLE,
  });
  if (user.ok) {
    console.log(`[seed] perfil criado no brain (username=${USERNAME})`);
  } else if (user.status === 400 && /duplicate|unique|já|already|exist/i.test(user.text)) {
    console.log(`[seed] perfil ja existia no brain (username=${USERNAME})`);
  } else {
    throw new Error(`[seed] /user/create falhou: ${user.status} ${user.text}`);
  }

  console.log(`[seed] OK — entre em /login com ${USERNAME} / ${PASSWORD.replace(/./g, '*')}`);
}

main().catch((err) => { console.error(err.message); process.exit(1); });
