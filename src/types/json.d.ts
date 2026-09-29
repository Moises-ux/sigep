declare module '*.json' {
  const value: any;
  export default value;
}

declare module '*/serviceAccountKey.json' {
  const value: {
    type?: string;
    project_id?: string;
    private_key_id?: string;
    private_key: string;
    client_email: string;
    client_id?: string;
    auth_uri?: string;
    token_uri?: string;
    auth_provider_x509_cert_url?: string;
    client_x509_cert_url?: string;
  };
  export default value;
}
