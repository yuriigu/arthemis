# Arthemis legacy - front (SvelteKit + Vite).
#
# Versao desenvolvimento: servidor Vite com hot-reload, port 5173.
FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./
# Remove a trava devEngines (npm 11 aborta o build se node != 24.12.0 exato).
RUN node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('./package.json','utf8'));delete p.devEngines;fs.writeFileSync('./package.json',JSON.stringify(p,null,2));" \
 && npm ci --no-audit --no-fund --no-engine-strict

# Copia o restante do codigo-fonte (node_modules fica na imagem).
COPY . .

# Garante que o package.json final tambem nao trave o `npm run dev`.
RUN node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('./package.json','utf8'));delete p.devEngines;fs.writeFileSync('./package.json',JSON.stringify(p,null,2));"

ENV NODE_ENV=development
ENV HOST=0.0.0.0
ENV PORT=5173
ENV NPM_CONFIG_ENGINE_STRICT=false

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
