# Site Nando Denon

Este é o website oficial do Nando Denon, com sistema de dashboard online para gerenciamento de conteúdo.

## Funcionalidades

- Site público com apresentação do artista
- Sistema de mensagens para contato
- Agenda de eventos e shows
- Galeria de fotos e vídeos
- Dashboard administrativo para gerenciamento de todo o conteúdo
- Sistema online para gerenciamento de dados

## Como Implantar no Vercel

### 1. Crie uma conta no Vercel

Se você ainda não tem uma conta, cadastre-se em [vercel.com](https://vercel.com).

### 2. Instale o Vercel CLI (opcional)

```bash
npm install -g vercel
```

### 3. Faça login no Vercel CLI (opcional)

```bash
vercel login
```

### 4. Implante no Vercel

Existem duas opções para implantar:

#### Opção 1: Usando o CLI

No diretório do projeto, execute:

```bash
vercel
```

#### Opção 2: Usando o GitHub (recomendado)

1. Faça upload do seu código para um repositório GitHub
2. Acesse [vercel.com/new](https://vercel.com/new)
3. Importe seu projeto do GitHub
4. Conclua a configuração para implantar

### 5. Configurações do Ambiente

É recomendado configurar uma variável de ambiente para a chave de API:

- Nome: `API_KEY`
- Valor: Uma chave secreta de sua escolha (para produção, use uma chave forte)

### 6. Armazenamento de Dados

Por padrão, o sistema usa um arquivo JSON para armazenar dados no Vercel. Para produção, considere configurar:

- Uma integração com MongoDB ou outro banco de dados
- Ou um serviço de armazenamento como Supabase ou Firebase

## Desenvolvimento Local

Para executar o projeto localmente:

```bash
# Instale as dependências
npm install

# Execute o servidor de desenvolvimento
npm run dev
```

O site estará disponível em `http://localhost:3000`.

## Credenciais de Acesso

Para acessar o dashboard administrativo, use:

- Usuário: `admin`
- Senha: `admin`

**Importante:** Em um ambiente de produção, altere estas credenciais!

## Tecnologias Utilizadas

- HTML, CSS e JavaScript
- Express.js para a API
- Vercel para hospedagem

## Estrutura do Projeto

- `/js/site-data.js` - Gerenciamento de dados do site
- `/api/index.js` - API para armazenamento dos dados
- `/dashboard.html` - Dashboard administrativo
- Demais arquivos HTML - Páginas do site

## Licença

Este projeto é proprietário e não pode ser redistribuído sem autorização. 