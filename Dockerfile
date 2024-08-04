FROM node:20-alpine as base

# Add package file
COPY package*.json ./

# Install deps
RUN npm i --force

# Copy source
COPY /dist /dist

EXPOSE 465
EXPOSE 3000

CMD ["node", "dist/main.js"]