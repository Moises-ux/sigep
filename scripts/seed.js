import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, 'serviceAccountKey.json'), 'utf8')
);

initializeApp({
  credential: cert(serviceAccount),
});

const auth = getAuth();
const db = getFirestore();

async function runSeed() {
  console.log('🚀 Iniciando script de Povoamento (Seed) do SIGEP...\n');

  try {
    // 1. Criar Setores na coleção 'setores'
    console.log('📁 Criando setores...');
    const setoresData = [
      {
        id: 'setor-ti',
        nome: 'Departamento de Tecnologia da Informação',
        sigla: 'DTI',
        secretaria: 'Secretaria de Administração',
        responsavel: 'Carlos Silva',
        criado_em: FieldValue.serverTimestamp(),
      },
      {
        id: 'setor-saude',
        nome: 'Secretaria Municipal de Saúde',
        sigla: 'SEMUS',
        secretaria: 'Secretaria de Saúde',
        responsavel: 'Dra. Maria Fernanda',
        criado_em: FieldValue.serverTimestamp(),
      },
      {
        id: 'setor-educacao',
        nome: 'Secretaria Municipal de Educação',
        sigla: 'SEDUC',
        secretaria: 'Secretaria de Educação',
        responsavel: 'Prof. Roberto Souza',
        criado_em: FieldValue.serverTimestamp(),
      },
      {
        id: 'setor-almoxarifado',
        nome: 'Almoxarifado Central',
        sigla: 'ALMOX',
        secretaria: 'Secretaria de Administração',
        responsavel: 'Almoxarife Responsável',
        criado_em: FieldValue.serverTimestamp(),
      },
    ];

    for (const setor of setoresData) {
      const docRef = db.collection('setores').doc(setor.id);
      await docRef.set(setor, { merge: true });
      console.log(`   ✅ Setor criado/atualizado: ${setor.sigla} - ${setor.nome}`);
    }

    // 2. Criar Usuários no Firebase Auth e na coleção 'usuarios'
    console.log('\n👥 Criando usuários de teste...');
    const usuariosParaCriar = [
      {
        email: 'admin.ti@prefeitura.gov.br',
        password: 'Mudar@123456',
        nome: 'Administrador da TI',
        papel: 'admin',
        setor_id: 'setor-ti',
        telefone: '(83) 99999-0001',
      },
      {
        email: 'supervisor.ti@prefeitura.gov.br',
        password: 'Mudar@123456',
        nome: 'Supervisor da TI',
        papel: 'supervisor',
        setor_id: 'setor-ti',
        telefone: '(83) 99999-0002',
      },
      {
        email: 'tecnico.ti@prefeitura.gov.br',
        password: 'Mudar@123456',
        nome: 'Técnico da TI',
        papel: 'tecnico',
        setor_id: 'setor-ti',
        telefone: '(83) 99999-0003',
      },
      {
        email: 'servidor.saude@prefeitura.gov.br',
        password: 'Mudar@123456',
        nome: 'Servidor da Saúde',
        papel: 'solicitante',
        setor_id: 'setor-saude',
        telefone: '(83) 99999-0004',
      },
    ];

    for (const u of usuariosParaCriar) {
      let uid = '';

      // Tenta obter usuário existente ou criar no Auth
      try {
        const existingUser = await auth.getUserByEmail(u.email);
        uid = existingUser.uid;
        // Atualiza a senha se necessário
        await auth.updateUser(uid, {
          password: u.password,
          displayName: u.nome,
        });
        console.log(`   🔄 Conta Auth existente para ${u.email} (UID: ${uid})`);
      } catch (err) {
        if (err.code === 'auth/user-not-found') {
          const newUser = await auth.createUser({
            email: u.email,
            password: u.password,
            displayName: u.nome,
          });
          uid = newUser.uid;
          console.log(`   ✅ Conta Auth criada para ${u.email} (UID: ${uid})`);
        } else {
          throw err;
        }
      }

      // Salva perfil na coleção 'usuarios' do Firestore usando o mesmo UID
      await db.collection('usuarios').doc(uid).set(
        {
          nome: u.nome,
          email: u.email,
          papel: u.papel,
          setor_id: u.setor_id,
          telefone: u.telefone,
          ativo: true,
          criado_em: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      console.log(`   📄 Documento no Firestore criado para ${u.nome} [${u.papel}]`);
    }

    // 3. Criar Equipamentos na coleção 'equipamentos'
    console.log('\n💻 Criando equipamentos de teste...');
    const equipamentosData = [
      {
        id: 'eq-notebook-saude',
        patrimonio: 'PAT-2026-001',
        tipo: 'Notebook',
        marca: 'Dell',
        modelo: 'Latitude 3420',
        numero_serie: 'SN-DELL-9401',
        setor_id: 'setor-saude',
        status: 'operacional',
        observacoes: 'Alocado na recepção do Posto de Saúde Central',
        cadastrado_por_nome: 'Administrador da TI',
        criado_em: FieldValue.serverTimestamp(),
      },
      {
        id: 'eq-impressora-educacao',
        patrimonio: 'PAT-2026-002',
        tipo: 'Impressora',
        marca: 'HP',
        modelo: 'LaserJet Pro M404dn',
        numero_serie: 'SN-HP-8492',
        setor_id: 'setor-educacao',
        status: 'operacional',
        observacoes: 'Alocada na Diretoria de Ensino',
        cadastrado_por_nome: 'Administrador da TI',
        criado_em: FieldValue.serverTimestamp(),
      },
      {
        id: 'eq-desktop-ti',
        patrimonio: 'PAT-2026-003',
        tipo: 'Computador',
        marca: 'Dell',
        modelo: 'OptiPlex 3080',
        numero_serie: 'SN-DELL-3080',
        setor_id: 'setor-ti',
        status: 'operacional',
        observacoes: 'Bancada de desenvolvimento DTI',
        cadastrado_por_nome: 'Administrador da TI',
        criado_em: FieldValue.serverTimestamp(),
      },
    ];

    for (const eq of equipamentosData) {
      await db.collection('equipamentos').doc(eq.id).set(eq, { merge: true });
      console.log(`   ✅ Equipamento cadastrado: ${eq.patrimonio} (${eq.tipo} ${eq.marca} ${eq.modelo})`);
    }

    // 4. Criar Assistências Técnicas na coleção 'assistencias_tecnicas'
    console.log('\n🛠️ Criando assistências técnicas de teste...');
    const assistenciasData = [
      {
        id: 'assist-eletronica-silva',
        nome: 'Eletrônica & Informática Silva',
        telefone: '(83) 98888-7777',
        email: 'contato@eletronicasilva.com.br',
        endereco: 'Av. Epitácio Pessoa, 1200 - Centro',
        ativo: true,
        criado_em: FieldValue.serverTimestamp(),
      },
      {
        id: 'assist-techfix',
        nome: 'TechFix Assistência Técnica Especializada',
        telefone: '(83) 99911-2233',
        email: 'suporte@techfix.com.br',
        endereco: 'Rua das Mangueiras, 450 - Tambaú',
        ativo: true,
        criado_em: FieldValue.serverTimestamp(),
      },
    ];

    for (const ast of assistenciasData) {
      await db.collection('assistencias_tecnicas').doc(ast.id).set(ast, { merge: true });
      console.log(`   ✅ Assistência cadastrada: ${ast.nome}`);
    }

    console.log('\n🎉 Processo de Povoamento (Seed) concluído com sucesso!');
  } catch (error) {
    console.error('\n❌ Erro durante a execução do seed:', error);
    process.exit(1);
  }
}

runSeed();
