# Stage 1: Build the Angular app
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration production

# Stage 2: Serve using NGINX
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Try copying the browser directory first (Angular 17+ application builder)
# If it's an older version, it will just be dist/restaurant-pos. We'll use a wildcard to catch either
COPY --from=build /app/dist/restaurant-pos/browser* /usr/share/nginx/html/
COPY --from=build /app/dist/restaurant-pos /usr/share/nginx/html/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
