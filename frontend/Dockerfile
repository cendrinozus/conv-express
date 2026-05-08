FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps && chmod -R +x node_modules/.bin
COPY . .
RUN REACT_APP_API_URL=/api DISABLE_ESLINT_PLUGIN=true NODE_OPTIONS=--openssl-legacy-provider node node_modules/react-scripts/bin/react-scripts.js build

FROM httpd:2.4
COPY --from=builder /app/build /usr/local/apache2/htdocs/

RUN echo "LoadModule rewrite_module modules/mod_rewrite.so" >> /usr/local/apache2/conf/httpd.conf && \
    echo "LoadModule proxy_module modules/mod_proxy.so" >> /usr/local/apache2/conf/httpd.conf && \
    echo "LoadModule proxy_http_module modules/mod_proxy_http.so" >> /usr/local/apache2/conf/httpd.conf && \
    echo "ProxyPass /api http://backend:5000/api" >> /usr/local/apache2/conf/httpd.conf && \
    echo "ProxyPassReverse /api http://backend:5000/api" >> /usr/local/apache2/conf/httpd.conf && \
    sed -i 's/AllowOverride None/AllowOverride All/g' /usr/local/apache2/conf/httpd.conf

RUN printf '<IfModule mod_rewrite.c>\n  RewriteEngine On\n  RewriteBase /\n  RewriteRule ^index\\.html$ - [L]\n  RewriteCond %%{REQUEST_FILENAME} !-f\n  RewriteCond %%{REQUEST_FILENAME} !-d\n  RewriteRule . /index.html [L]\n</IfModule>\n' > /usr/local/apache2/htdocs/.htaccess

EXPOSE 80
