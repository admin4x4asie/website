FROM node:6
MAINTAINER Laurent Renard <laurent34azerty@gmail.com>
COPY . /app
WORKDIR /app
ENV NODE_ENV=production
RUN npm install --production
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]