FROM node:20

WORKDIR /usr/src/app

COPY package.json tsconfig.json .vscodeignore ./

RUN npm install
RUN npm install -g @vscode/vsce

COPY src ./src
COPY README.md ./
COPY *.png ./

RUN npm run compile

RUN vsce package --allow-missing-repository

CMD ["bash"]