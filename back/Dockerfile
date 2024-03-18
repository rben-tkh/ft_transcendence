# Utilisez la même image de base que celle de votre application backend
FROM node:18-alpine as back-build

# Créez le répertoire de travail
WORKDIR /usr/src/app

RUN npm install -g npm@latest @nestjs/cli 

# Copiez les fichiers de configuration
COPY package.json ./

COPY tsconfig.json ./

# Installez les dépendances
RUN npm install --legacy-peer-deps

# Copiez le reste des fichiers
COPY . .

# Exposez le port 3000
EXPOSE 3001

COPY ./src/script/script.sh /

RUN chmod 755 /script.sh

# Démarrez l'application
ENTRYPOINT [  "sh", "/script.sh" ]
