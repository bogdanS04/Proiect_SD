FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --production
COPY balancer.js ./
CMD ["npm", "start"]
