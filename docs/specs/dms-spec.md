Lista de tarefas pendentes atualizada

Vou ler o modelo e a estrutura atual do projeto para alinhar a especificação com o que já existe, mantendo o plano limitado ao documento e sem incluir execução ou alteração de código de backend/frontend.

Read 

Read 

Read 

Read 

O modelo já fixa três operações centrais e metadados em memória; a estrutura do backend está separada nas quatro camadas previstas. Vou conferir a implementação e os testes existentes para que a especificação descreva contratos compatíveis, distinguindo o estado atual do escopo completo planejado.

Searched for files matching `**/backend/src/**/*.js`, 1 match

Read 

Read 

Read 

O backend está ainda como seed: só expõe `/health`, e o teste atual é apenas de fumaça; as três rotas de documentos são futuras. Antes de fechar a especificação, vou checar os pontos de entrada do frontend para deixar o plano funcional sem pressupor telas ou autenticação que ainda não existem.

Read 

Read 

Read 

O frontend também é apenas um seed e confirma React/Vite com o prefixo `/api` descrito nas instruções do projeto. Vou resolver no documento a distinção entre o prefixo de consumo do frontend e as rotas do backend, além de explicitar a limitação de identidade sem autenticação.

Read 

O conteúdo abaixo especifica o arquivo solicitado, mas não o salvei no workspace: este turno está em modo Planner, que permite apenas leitura e análise. O único arquivo previsto para criação é `docs/specs/dms-spec.md`; nenhum arquivo de backend ou frontend está previsto para alteração nesta etapa.

# Especificação - Document Management System

## 1. Objetivo

Permitir que usuários enviem, consultem e baixem seus documentos, armazenando os arquivos no filesystem local e mantendo seus metadados em memória.

## 2. Escopo

### Dentro do escopo

- Envio de um arquivo por requisição.
- Listagem dos documentos pertencentes ao usuário informado na requisição.
- Download de um documento pelo identificador, somente pelo respectivo usuário.
- Interface web simples para envio, listagem e download.
- Persistência dos arquivos em `storage` e dos metadados em memória.

### Fora do escopo

- Armazenamento externo ou em nuvem.
- Banco de dados ou persistência dos metadados após reiniciar o processo.
- Autenticação, cadastro de usuários e autorização robusta.
- Versionamento, edição e exclusão de documentos.
- Upload de múltiplos arquivos na mesma requisição.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O usuário pode enviar um documento usando `multipart/form-data`, com um único campo de arquivo chamado `file`. |
| RF-02 | O sistema atribui um identificador único ao documento e registra nome original, tamanho, data de envio e dono. |
| RF-03 | O sistema grava o arquivo no filesystem local usando `multer` com `diskStorage`; o nome físico é gerado pelo sistema, sem confiar no nome enviado pelo cliente. |
| RF-04 | O usuário pode listar seus documentos, ordenados do mais recente para o mais antigo. |
| RF-05 | O usuário pode baixar um documento pelo identificador quando ele pertence ao usuário informado na requisição. |
| RF-06 | O sistema rejeita requisições sem arquivo, sem identificador de usuário ou com arquivo acima do limite configurado. |
| RF-07 | O sistema retorna erros em formato JSON consistente para falhas das operações. |
| RF-08 | A interface permite selecionar e enviar um documento, visualizar a lista e iniciar o download de um item. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Os arquivos devem permanecer exclusivamente no filesystem local, em `storage`, usando `multer` com `diskStorage`. |
| RNF-02 | Os metadados devem ser mantidos em memória nesta fase; eles não sobrevivem à reinicialização do backend. |
| RNF-03 | As configurações operacionais devem usar variáveis de ambiente, incluindo a porta e o limite de tamanho do upload. |
| RNF-04 | O tamanho máximo inicial do arquivo é 10 MiB, configurável por `MAX_FILE_SIZE_BYTES`. |
| RNF-05 | O identificador do usuário é recebido pelo cabeçalho `X-User-Id`. Esse mecanismo identifica o dono, mas não autentica o solicitante. |
| RNF-06 | A API não deve expor o nome físico nem o caminho local do arquivo. |
| RNF-07 | A solução deve respeitar o fluxo `routes -> controllers -> services -> repositories`; camadas internas não dependem de Express ou de detalhes HTTP. |

## 5. Modelo de dados

### Metadados do documento

| Campo | Tipo | Visibilidade | Descrição |
| --- | --- | --- | --- |
| `id` | string (UUID) | API e interno | Identificador único do documento. |
| `originalName` | string | API e interno | Nome original informado para o arquivo. |
| `size` | number | API e interno | Tamanho do arquivo em bytes. |
| `uploadedAt` | string (ISO 8601) | API e interno | Data e hora do recebimento do arquivo. |
| `owner` | string | API e interno | Valor de `X-User-Id` associado ao documento. |
| `storageName` | string | Apenas interno | Nome gerado pelo sistema para localizar o arquivo em `storage`. |

`storageName` não deve ser incluído nas respostas da API. O arquivo físico deve usar um nome gerado a partir de identificador seguro, sem incorporar caminhos ou nomes fornecidos pelo cliente.

## 6. Contratos de API

As rotas abaixo são os caminhos do backend. Durante o desenvolvimento, o frontend chama os mesmos caminhos sob `/api`; o proxy do Vite remove esse prefixo.

Todas as operações exigem o cabeçalho `X-User-Id`. Ele deve ser tratado como identificador de contexto, não como prova de identidade.

### `POST /upload`

- Entrada: `multipart/form-data`, campo `file` contendo um arquivo; cabeçalho `X-User-Id`.
- Sucesso: `201 Created`, corpo JSON com os metadados públicos do documento.
- Erros: `400` para arquivo ausente ou identificador inválido; `413` para arquivo acima do limite; `500` para falha inesperada de gravação.

Exemplo de resposta:

```json
{
  "id": "uuid",
  "originalName": "relatorio.pdf",
  "size": 24576,
  "uploadedAt": "2026-10-06T12:00:00.000Z",
  "owner": "usuario-123"
}
```

### `GET /documents`

- Entrada: cabeçalho `X-User-Id`.
- Sucesso: `200 OK`, lista apenas os documentos daquele usuário, em ordem decrescente de `uploadedAt`.

```json
{
  "documents": [
    {
      "id": "uuid",
      "originalName": "relatorio.pdf",
      "size": 24576,
      "uploadedAt": "2026-10-06T12:00:00.000Z",
      "owner": "usuario-123"
    }
  ]
}
```

### `GET /documents/:id/download`

- Entrada: identificador na URL e cabeçalho `X-User-Id`.
- Sucesso: `200 OK`, conteúdo binário do arquivo, com disposição de download e nome original como nome sugerido.
- Erros: `404 Not Found` tanto para documento inexistente quanto para documento pertencente a outro usuário, sem revelar a existência de documentos alheios.

### Formato de erro

Erros de API devem usar uma estrutura consistente:

```json
{
  "error": {
    "code": "DOCUMENT_NOT_FOUND",
    "message": "Documento não encontrado."
  }
}
```

Códigos mínimos previstos: `FILE_REQUIRED`, `USER_REQUIRED`, `FILE_TOO_LARGE`, `DOCUMENT_NOT_FOUND` e `INTERNAL_ERROR`.

## 7. Decisões arquiteturais

- `routes/` registra endpoints e encaminha chamadas aos controllers.
- `controllers/` lê parâmetros, cabeçalhos e arquivos recebidos; traduz resultados e erros para HTTP.
- `services/` aplica regras de negócio, incluindo associação do documento ao usuário e autorização do download.
- `repositories/` mantém metadados em memória e encapsula o acesso aos arquivos locais.
- O upload usa `multer` com `diskStorage`; o caminho de armazenamento é local à aplicação.
- O frontend consome a API com `fetch` pelo prefixo `/api`, encaminhado pelo proxy do Vite.
- Sem autenticação, o cliente pode falsificar `X-User-Id`. O isolamento por usuário é funcional, não uma barreira de segurança para produção.

## 8. Plano de execução

Este plano descreve etapas futuras; nesta solicitação, somente o documento de especificação deve ser criado.

1. **Registrar e validar a especificação.** Criar `docs/specs/dms-spec.md` e revisar requisitos, contratos, restrições e critérios de aceite. **Aceite:** o documento cobre escopo, requisitos funcionais e não funcionais, dados, API, decisões e etapas; não inclui alterações de código.
2. **Preparar o backend e as regras de upload.** Implementar a estrutura por camadas, configuração, validação do usuário e upload local. **Aceite:** upload válido grava arquivo local e metadados; ausência de arquivo/usuário e limite excedido produzem os erros definidos.
3. **Implementar listagem e download.** Adicionar consulta filtrada por dono e entrega do conteúdo binário. **Aceite:** a listagem não mistura donos e o download retorna `404` para documento inexistente ou de outro usuário.
4. **Construir a interface e integrar a API.** Implementar envio, listagem e ação de download usando o proxy `/api`. **Aceite:** os fluxos são utilizáveis pela interface e exibem falhas da API sem travar a página.
5. **Validar o fluxo completo e as limitações documentadas.** Testar contratos, integração e comportamento após reinício. **Aceite:** testes cobrem sucesso e erros principais; fica confirmado que arquivos permanecem no disco e metadados em memória são perdidos ao reiniciar.

**Riscos:** reiniciar o backend perde os metadados, embora os arquivos permaneçam no disco; podem surgir arquivos órfãos. A identificação por cabeçalho não oferece autenticação e não deve ser considerada adequada para exposição pública sem uma etapa futura de autenticação/autorização.

6 tarefas pendentes criadas