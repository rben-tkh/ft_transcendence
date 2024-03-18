FROM node:18-alpine AS front-build

WORKDIR /usr/src/app

COPY package.json ./

COPY tsconfig.json ./

RUN npm install 

COPY . .

RUN rm -rf ./tsconfig.tsbuildinfo

EXPOSE 3000

ENTRYPOINT [ "npm", "run", "start" ]
