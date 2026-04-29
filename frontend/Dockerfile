FROM node:22-alpine AS base
WORKDIR /app
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
COPY package*.json ./
RUN npm config set fetch-retries 5 \
	&& npm config set fetch-retry-factor 2 \
	&& npm config set fetch-retry-maxtimeout 120000 \
	&& npm config set fetch-timeout 120000 \
	&& npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=base /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
