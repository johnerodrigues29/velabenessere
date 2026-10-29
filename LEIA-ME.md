# Vela Benessere — HTML5, CSS e JavaScript

Site totalmente estático, pronto para GitHub + Cloudflare Pages. Não usa React, Next.js, PHP, Worker, Node.js, npm, banco de dados ou compilação para funcionar. Os arquivos HTML já estão prontos.

## Conteúdo

- Página inicial: `index.html`.
- Dez reviews: `recensioni/PRODUTO/index.html`.
- Seis hubs e índice de categorias: `categorie/`.
- Blog e três guias: `blog/`.
- Páginas institucionais e políticas em pastas próprias.
- CSS: `stile.css`; interações: `app.js`; configuração pública: `config.js`.
- Dez imagens otimizadas WebP: `immagini/`.
- SEO: `sitemap.xml`, `robots.txt`, metadados e JSON-LD nos HTMLs.
- Página 404: `404.html`.

## Publicar pelo GitHub e Cloudflare Pages

1. Extraia o ZIP. Envie **o conteúdo desta pasta**, incluindo `index.html`, diretamente para a raiz de um repositório no GitHub. Não envie apenas o ZIP e não envolva os arquivos em uma pasta extra.
2. No Cloudflare, crie um projeto **Pages**, conecte o GitHub e selecione esse repositório e a branch `main`.
3. Escolha o preset de framework **None**.
4. Use `exit 0` no comando de build e `.` no diretório de saída. Não há build real nem dependências para instalar.
5. Publique. O Cloudflare fornecerá o endereço do projeto no domínio `pages.dev`.
6. No editor do projeto, substitua globalmente **`https://seu-dominio.example`** pelo domínio real, sem barra no final, em todos os HTMLs, em `sitemap.xml` e em `robots.txt`. Esse endereço é um marcador, não um domínio configurado. Faça commit para atualizar a publicação.
7. Complete os dados do responsável, contatos e textos legais antes da abertura ao público. A identidade Vela é provisória.

O site espera ser servido na raiz do domínio, por exemplo `https://nome.pages.dev/`. Não foi preparado para subpastas de GitHub Pages como `/nome-do-repositorio/`. O GitHub é o repositório; Cloudflare Pages é a hospedagem.

## Formulários e popup

O frontend valida os campos e já inclui o popup de sucesso. **O envio permanece desativado**: `config.js` tem `leadEndpoint` vazio. Nenhum lead é enviado e nenhuma confirmação de recebimento é simulada.

A API Webvork exige um token privado. Não é possível protegê-lo dentro de um site somente HTML/CSS/JS público. Para ativar os leads, será necessário um endpoint seguro separado, por exemplo um Cloudflare Worker, e colocar apenas a URL desse endpoint em `config.js`. Esse backend não está incluído neste pacote estático.

Contrato esperado pelo frontend:

- POST JSON com `product` (slug), `name`, `phone`, `consent`, `website` (campo antispam vazio) e `utm`.
- Somente HTTP 2xx com JSON `{ "ok": true }` abre o popup.
- Falhas: HTTP 4xx/5xx ou `{ "ok": false, "message": "Mensagem em italiano" }`.
- Se o endpoint estiver em outro domínio, ele precisará permitir a origem exata do site via CORS e responder ao preflight.
- O backend deve mapear os slugs para os IDs, validar dados/consentimento, proteger contra abuso, guardar o token como segredo e confirmar o contrato real de sucesso da Webvork. Nunca colocar o token em `config.js`, no GitHub ou nos HTMLs.

Os textos de anteprima/serviço inativo nas páginas de produto e políticas devem ser atualizados ao ativar o serviço, depois das configurações e testes reais.

## Alterar conteúdo e adicionar artigos

Edite diretamente os arquivos HTML e faça commit no GitHub; o Cloudflare Pages atualizará a publicação conectada. Para criar um artigo, copie um dos arquivos `blog/SLUG/index.html` para uma pasta com novo slug, altere conteúdo, title, description, canonical, Open Graph, datas e JSON-LD. Adicione o link no índice do blog e na sitemap. Não copie uma avaliação ou afirmação clínica como fato sem verificar a fonte.

## Preços e material editorial

Os dez produtos mostram 39 EUR promocional e 78 EUR anterior nos HTMLs fornecidos. O preço de Testosteron Boost é condicionado a um ciclo de tratamento. Os valores não são conferidos em tempo real. As reviews são análises documentais, sem testes pessoais, estrelas ou depoimentos inventados.

## Testar

O teste mais fiel é no endereço Cloudflare Pages, ou com um servidor estático local (por exemplo Live Server no VS Code). Abrir o arquivo com duplo clique não reproduz os caminhos de uma hospedagem web. O ZIP foi validado e extraído em teste antes da entrega.
