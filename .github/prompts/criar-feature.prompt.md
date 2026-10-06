---
description: Planeja, implementa e valida uma nova funcionalidade no DMS seguindo as convenções do projeto.
name: criar-feature
argument-hint: descrição da funcionalidade e comportamento esperado
agent: agent
---

# Criar feature no DMS

Implemente a funcionalidade descrita: `${input:feature:descreva a funcionalidade e o comportamento esperado}`.

Antes de alterar arquivos:

- Leia as instruções em `.github/copilot-instructions.md` e inspecione os arquivos, testes e comandos existentes diretamente relacionados à funcionalidade.
- Identifique o fluxo afetado e preserve o comportamento existente fora do escopo solicitado.
- Se um requisito essencial estiver ambíguo e não puder ser inferido do projeto, pergunte antes de decidir. Caso contrário, adote a solução mais simples compatível com as convenções existentes.

Durante a implementação:

- Faça a menor alteração coesa que entregue a funcionalidade de ponta a ponta; evite refatorações e abstrações não necessárias.
- No backend, mantenha o fluxo `routes -> controllers -> services -> repositories`, em CommonJS, e trate erros nos limites HTTP e de filesystem.
- Armazene arquivos enviados somente no filesystem local em `backend/storage` usando `multer` com `diskStorage`; mantenha metadados em memória nesta fase. Não introduza armazenamento externo.
- No frontend, use componentes funcionais e Hooks, mantenha chamadas HTTP via `fetch` no serviço apropriado e use o prefixo `/api`.
- Reutilize dependências e padrões já presentes. Não adicione dependências sem necessidade.
- Atualize ou crie testes focados nos comportamentos novos e nos casos de erro relevantes. No backend, use `node:test` e `node:assert`; no frontend, siga apenas o setup de testes que já existir.
- Atualize a documentação somente se a funcionalidade mudar instruções ou contratos documentados.

Ao concluir:

- Execute os testes e verificações relevantes disponíveis nos `package.json` afetados.
- Corrija falhas causadas pela implementação e informe claramente qualquer verificação que não pôde ser executada.
- Resuma o que mudou, os arquivos principais e os comandos de validação executados.
