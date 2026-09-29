import serviceAccount from '../../scripts/serviceAccountKey.json';

function base64UrlEncode(str: string): string {
  return btoa(str).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function base64UrlEncodeBuffer(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

async function getAdminAccessToken(): Promise<string> {
  const pem = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const binaryDer = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));

  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryDer.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const header = base64UrlEncode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const claims = base64UrlEncode(
    JSON.stringify({
      iss: serviceAccount.client_email,
      scope:
        "https://www.googleapis.com/auth/identitytoolkit https://www.googleapis.com/auth/cloud-platform",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    })
  );

  const unsignedToken = `${header}.${claims}`;
  const signature = await crypto.subtle.sign(
    { name: "RSASSA-PKCS1-v1_5" },
    privateKey,
    new TextEncoder().encode(unsignedToken)
  );

  const jwt = `${unsignedToken}.${base64UrlEncodeBuffer(signature)}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const data = await res.json();
  if (!data.access_token) {
    throw new Error(data.error_description || "Erro ao obter token de administração.");
  }
  return data.access_token;
}

/**
 * Exclui a conta de autenticação de qualquer usuário no Firebase Auth usando a API de Administração.
 */
export const excluirContaAuthPorAdmin = async (uid: string): Promise<void> => {
  const token = await getAdminAccessToken();
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/projects/${serviceAccount.project_id}/accounts:delete`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ localId: uid }),
    }
  );

  if (!res.ok) {
    const errData = await res.json();
    console.error("Erro ao excluir conta no Firebase Auth via API Admin:", errData);
    throw new Error(errData?.error?.message || "Falha ao excluir a conta no Firebase Auth.");
  }
};
