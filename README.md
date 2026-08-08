# MedClick Starter

Primeira versão navegável do projeto MedClick, com:

- Landing page responsiva
- Formulário inteligente para atestado, receita e laudo
- Cálculo automático de valores
- Área demonstrativa do paciente
- Painel administrativo demonstrativo
- Botão de ajuda no WhatsApp
- Modelo inicial do banco de dados em Prisma/PostgreSQL

## Executar

1. Instale Node.js compatível com a versão atual do Next.js.
2. Na pasta do projeto, execute:

```bash
npm install
npm run dev
```

3. Acesse `http://localhost:3000`.

Rotas:
- `/` — página inicial
- `/solicitar` — formulário
- `/paciente` — área do paciente
- `/admin` — painel administrativo

## Próxima etapa

Conectar o formulário à API e ao PostgreSQL, criar autenticação real, armazenamento privado de arquivos, controle de permissões e trilha de auditoria.

> Aviso: este pacote é um protótipo técnico. Antes de uso real, o fluxo clínico, os textos, a segurança, a privacidade e a conformidade regulatória devem ser validados por profissionais habilitados.
