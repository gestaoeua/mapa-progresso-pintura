# Mapa de Progresso — Gestão à Vista

Painel interativo, **somente leitura**, para acompanhar o status de pintura de cada sala em uma planta baixa. Qualquer pessoa com o link consegue visualizar a planta, os marcadores, o status e as observações de cada sala — mas ninguém consegue editar nada pelo site. A edição é feita só na planilha, por quem tiver acesso a ela.

## Arquitetura

```
Google Sheets (banco de dados)
        │  (leitura)
        ▼
Google Apps Script — doGet() somente, retorna JSON
        │  (fetch GET, no navegador de quem visita o site)
        ▼
GitHub Pages — site estático (React + Vite)
```

- **Google Sheets** guarda os dados (aba `Salas`). É onde as pessoas autorizadas atualizam status, observações etc.
- **Google Apps Script** é o único "backend". Ele só tem uma função (`doGet`), que lê a planilha e devolve os dados em JSON. Não existe nenhuma rota de escrita (POST/PUT/PATCH/DELETE) — portanto é impossível alterar a planilha através do site.
- **GitHub Pages** hospeda o site estático (HTML/CSS/JS gerado pelo Vite). A cada carregamento da página, o navegador busca os dados mais recentes diretamente da planilha (via Apps Script).

Não há nenhum token, senha ou credencial no repositório. A URL do Apps Script não é secreta — ela é um endpoint público, mas só de leitura, então não há risco em ela ficar visível no código.

---

## Passo 1 — Criar a planilha no Google Sheets

1. Crie uma planilha nova em [sheets.google.com](https://sheets.google.com).
2. Renomeie a primeira aba para **`Salas`** (exatamente assim, sem acento, com "S" maiúsculo).
3. Importe os dados iniciais:
   - Menu **Arquivo → Importar → Fazer upload**.
   - Envie o arquivo [`data/salas-inicial.csv`](./data/salas-inicial.csv) (está neste projeto).
   - Em "Local de importação", escolha **Substituir planilha atual** (ou **Substituir aba atual**, se já estiver dentro da aba `Salas`).
   - Confirme o tipo de separador como vírgula, se perguntado.
4. Confira se a primeira linha ficou exatamente com estes cabeçalhos, nesta ordem:

   | MARK | Nome | Servico | Status | Observacao | PosicaoX | PosicaoY | Identificada | UltimaAtualizacao |
   |---|---|---|---|---|---|---|---|---|

   O Apps Script exige esses nomes de coluna exatamente assim (sem acentos, sem espaços).

### O que cada coluna significa

- **MARK** — identificador único da sala (ex.: `1-015`). Não pode ficar vazio; linhas sem MARK são ignoradas pelo painel.
- **Nome** — nome/uso da sala (ex.: "Exam Room").
- **Servico** — o serviço a fazer (texto livre, ex.: "Segunda mão").
- **Status** — um dos cinco valores abaixo (minúsculo, com underscore):

  | Valor na planilha | Como aparece no painel | Cor |
  |---|---|---|
  | `finalizado` | Finalizado | verde |
  | `em_andamento` | Em andamento | laranja |
  | `touch_up` | Touch-up | amarelo |
  | `pendente` | Pendente | vermelho |
  | `nao_cadastrada` | Não cadastrada | cinza |

  Qualquer outro valor (ou célula vazia) é tratado como `nao_cadastrada` para não quebrar o painel.

- **Observacao** — observações livres sobre a sala.
- **PosicaoX** / **PosicaoY** — posição do marcador na planta, em **porcentagem** (0 a 100) da largura/altura da imagem. Se ficarem vazios, a sala aparece na lista **"Sem marcação no mapa"** em vez de um ponto na planta.
- **Identificada** — `Sim` ou `Não`: se o MARK já foi conferido/identificado fisicamente em campo.
- **UltimaAtualizacao** — data (e hora, opcional) da última alteração daquela linha. Pode ser texto livre ou uma data de verdade do Sheets — o Apps Script formata automaticamente. O painel usa a mais recente entre todas as linhas para mostrar "Última atualização na planilha".

Para adicionar uma sala nova depois, basta inserir uma linha nova preenchendo essas colunas — não precisa mexer em nenhum código.

---

## Passo 2 — Publicar o Apps Script

1. Na planilha, vá em **Extensões → Apps Script**. Isso abre um editor vinculado à planilha.
2. Apague todo o código de exemplo (`function myFunction() {...}`) que vem por padrão.
3. Copie todo o conteúdo do arquivo [`apps-script/Code.gs`](./apps-script/Code.gs) deste projeto e cole no editor.
4. Salve o projeto (ícone de disquete ou `Ctrl+S`). Dê um nome ao projeto, por exemplo "Painel Mapa de Progresso — API".
5. Clique em **Implantar → Nova implantação**.
6. Em "Selecionar tipo", clique no ícone de engrenagem e escolha **App da Web**.
7. Configure:
   - **Executar como:** Eu (`seu-email@...`)
   - **Quem pode acessar:** Qualquer pessoa
8. Clique em **Implantar**. O Google vai pedir para autorizar o script a acessar a planilha:
   - Escolha sua conta Google.
   - Pode aparecer um aviso "O Google não verificou este app" — isso é normal para scripts pessoais/internos. Clique em **Avançado** → **Acessar [nome do projeto] (não seguro)** → **Permitir**. Você está apenas autorizando o seu próprio script a ler a sua própria planilha.
9. Copie a **URL do app da Web** que aparece (termina em `/exec`). É essa URL que o painel vai usar para buscar os dados.

> **Atualizando o script depois:** se você editar `Code.gs` no futuro, use **Implantar → Gerenciar implantações → editar (ícone de lápis) → Nova versão → Implantar** para que a URL existente passe a usar o código atualizado (criar uma implantação totalmente nova geraria uma URL diferente).

---

## Passo 3 — Configurar a URL no projeto

1. Abra o arquivo [`src/config.ts`](./src/config.ts).
2. Substitua o valor de `APPS_SCRIPT_URL` pela URL copiada no passo anterior:

   ```ts
   export const APPS_SCRIPT_URL =
     'https://script.google.com/macros/s/AKfycb.../exec';
   ```

3. Salve e faça commit dessa alteração. Essa URL não é segredo (é só leitura), então pode ficar tranquilamente versionada no repositório público.

---

## Passo 4 — Subir o projeto para o GitHub

O repositório de destino já existe e está vazio: **https://github.com/gestaoeua/mapa-progresso-pintura**

### Opção A — Usando git (mais confiável)

```bash
git init
git add .
git commit -m "Painel de progresso inicial"
git branch -M main
git remote add origin https://github.com/gestaoeua/mapa-progresso-pintura.git
git push -u origin main
```

### Opção B — Upload pelo navegador (sem usar git)

Dá para publicar só arrastando arquivos, mas exige atenção com a pasta `.github/workflows` — sem ela, o deploy automático não existe.

1. Extraia o `.zip` deste projeto no seu computador (não suba o `.zip` em si, e sim o conteúdo extraído).
2. No repositório vazio, clique em **"uploading an existing file"** (ou **Add file → Upload files**).
3. Abra a pasta extraída no Explorer do Windows e **arraste a pasta inteira** (todos os arquivos e subpastas, incluindo a pasta `.github`) para dentro da área de upload do GitHub. O Windows não esconde pastas que começam com ponto, então ela deve ir junto ao arrastar.
4. Depois do upload, confira se o arquivo `.github/workflows/deploy.yml` realmente aparece no repositório (navegue até lá pela interface). Se ele não tiver ido:
   - Clique em **Add file → Create new file**.
   - No campo do nome do arquivo, digite exatamente `.github/workflows/deploy.yml` (o GitHub cria as pastas automaticamente ao digitar as barras).
   - Cole o conteúdo do arquivo `deploy.yml` deste projeto e clique em **Commit changes**.
5. Escreva uma mensagem de commit (ex.: "Painel de progresso inicial") e confirme direto na branch `main`.

Depois de qualquer uma das duas opções, confira rapidamente no repositório se `node_modules/` e `dist/` **não** foram enviados (não deveriam existir aí — o `.gitignore` cuida disso, mas o upload manual pelo navegador não lê o `.gitignore`, então evite arrastar essas pastas se algum dia existirem localmente; como você está subindo o projeto recém-extraído do zip, elas nem existem ainda).

O base path do site (necessário para os arquivos carregarem certo dentro de `usuario.github.io/nome-do-repo/`) é calculado **automaticamente** durante o build no GitHub Actions, a partir do nome real do repositório (`mapa-progresso-pintura`) — não é preciso editar nada no `vite.config.ts`.

---

## Passo 5 — Ativar o GitHub Pages

1. No repositório, vá em **Settings → Pages**.
2. Em "Build and deployment" → "Source", escolha **GitHub Actions** (não "Deploy from a branch").
3. Dê um push para a branch `main` (ou rode o workflow manualmente em **Actions → Deploy do Painel para o GitHub Pages → Run workflow**).
4. Acompanhe a aba **Actions** até o workflow terminar com sucesso (ícone verde).
5. O link do site aparece em **Settings → Pages** assim que o primeiro deploy terminar:

   ```
   https://gestaoeua.github.io/mapa-progresso-pintura/
   ```

O workflow (`.github/workflows/deploy.yml`) já está configurado para rodar automaticamente a cada push na branch `main`.

---

## Passo 6 — Validar

Checklist rápido depois do primeiro deploy:

- [ ] O link abre sem erros e a planta baixa aparece com os marcadores nas posições corretas.
- [ ] Clicar em um marcador mostra MARK, nome, serviço, status e observação no painel lateral.
- [ ] A busca (por MARK, sala ou serviço) e os filtros por status funcionam.
- [ ] Os contadores de Touch-up e Não cadastradas aparecem no topo.
- [ ] Zoom (+/−) funciona sobre a planta.
- [ ] Testar em um tablet/celular: o layout se adapta e os marcadores continuam clicáveis.
- [ ] Alterar uma célula (por exemplo, o Status de uma sala) diretamente na planilha e recarregar a página do site: a mudança deve aparecer.
- [ ] Não existe nenhum controle de edição visível para o visitante (nenhum campo para alterar status pelo site).
- [ ] Desligar a internet ou apontar `APPS_SCRIPT_URL` para uma URL inválida mostra uma mensagem amigável de erro, em vez de tela em branco.

---

## Segurança

- O repositório **não** contém tokens, senhas ou chaves de API.
- O Apps Script só implementa `doGet()`. Não existe `doPost`/`doPut`/`doPatch`/`doDelete` que escrevam na planilha — logo, não há como alterar dados pelo site, nem por uma chamada HTTP manual.
- A única forma de editar os dados é abrindo a própria planilha no Google Sheets, com uma conta que tenha permissão de edição nela.
- Compartilhar a URL do Apps Script publicamente é seguro: ela só devolve os dados já preparados para exibição, e não aceita gravações.

---

## Estrutura do projeto

```
├── apps-script/
│   └── Code.gs              Código completo do Apps Script (backend, somente leitura)
├── data/
│   └── salas-inicial.csv    Dados iniciais das 48 salas, prontos para importar no Sheets
├── public/
│   ├── floor-plan.png       Planta baixa usada como fundo do mapa
│   └── favicon.svg
├── src/
│   ├── api.ts                Busca e normaliza os dados vindos do Apps Script
│   ├── App.tsx                Componente principal do painel
│   ├── App.css                Estilos (identidade visual original preservada)
│   ├── config.ts              URL do Apps Script (única coisa a configurar)
│   ├── types.ts                Tipos e mapeamento de status/cores
│   └── main.tsx
├── .github/workflows/deploy.yml   Build + publicação automática no GitHub Pages
└── vite.config.ts             Base path automático para GitHub Pages
```

## Rodando localmente (opcional)

```bash
npm install
npm run dev
```

Isso sobe o site em `http://localhost:5173`. Para testar de verdade, configure `APPS_SCRIPT_URL` em `src/config.ts` antes (senão o painel mostra a mensagem "Painel ainda não configurado").

## Solução de problemas

- **"Painel ainda não configurado"** — `APPS_SCRIPT_URL` em `src/config.ts` ainda está com o valor de exemplo. Siga o Passo 3.
- **Mensagem de erro ao carregar os dados** — confira se a implantação do Apps Script está com acesso "Qualquer pessoa" (Passo 2) e se a URL em `config.ts` termina em `/exec`. Teste abrir a URL diretamente no navegador: deve aparecer um JSON com `"ok": true` e a lista de salas.
- **"Colunas ausentes na aba Salas"** (aparece dentro do JSON de erro) — confira se os cabeçalhos da planilha estão escritos exatamente como `MARK, Nome, Servico, Status, Observacao, PosicaoX, PosicaoY, Identificada, UltimaAtualizacao`.
- **Uma sala não aparece no mapa** — verifique se `PosicaoX` e `PosicaoY` estão preenchidos com números entre 0 e 100. Sem eles, a sala some do mapa e aparece na lista "Sem marcação no mapa" no painel lateral.
- **Deploy do GitHub Pages falhou** — veja o log em **Actions** no GitHub. O erro mais comum é `Settings → Pages → Source` não estar definido como **GitHub Actions**.
