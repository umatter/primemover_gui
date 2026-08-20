# PrimeMover GUI -- production image.
#
# One image serves any deployment: the API endpoint is injected at CONTAINER
# START from the API_ENDPOINT environment variable, not baked in at build time.
# See httpd-pre-init/set-config.sh and src/app/app-config.ts.
#
#   docker build -t primemover-gui .
#   docker run -e API_ENDPOINT=https://pm-api.qamelab.org/api/v1 -p 8080:8080 primemover-gui

# ---------------------------------------------------------------- build stage
FROM node:22-alpine AS build

WORKDIR /src

# Dependencies first, so a source-only change does not re-run npm ci.
COPY package.json package-lock.json ./
COPY .npmrc ./
RUN npm ci --no-audit --no-fund

COPY . .

# --configuration production applies angular.json's fileReplacements, swapping
# environment.ts for environment.prod.ts. That file is only the FALLBACK; the
# real endpoint arrives via API_ENDPOINT below.
RUN npx ng build --configuration production

# ---------------------------------------------------------------- serve stage
FROM httpd:2.4-alpine

# mod_rewrite and mod_expires/mod_headers are what spa.conf needs, and mod_deflate
# is worth having for a ~5 MB bundle. They ship with the image but are commented
# out in the stock config.
RUN sed -i \
    -e 's|^#\(LoadModule rewrite_module .*\)|\1|' \
    -e 's|^#\(LoadModule expires_module .*\)|\1|' \
    -e 's|^#\(LoadModule headers_module .*\)|\1|' \
    -e 's|^#\(LoadModule deflate_module .*\)|\1|' \
    /usr/local/apache2/conf/httpd.conf \
 && printf '\n# SPA + caching rules, kept in the repo\nInclude conf/extra/spa.conf\n\n<Directory "/usr/local/apache2/htdocs">\n    AllowOverride None\n    Require all granted\n</Directory>\n' \
    >> /usr/local/apache2/conf/httpd.conf

COPY httpd-cfg/spa.conf /usr/local/apache2/conf/extra/spa.conf
COPY --from=build /src/dist/primemover-frontend/production/ /usr/local/apache2/htdocs/

# Runtime endpoint injection. The script rewrites the empty meta tag in
# index.html in place, so it must run before httpd starts and must run in the
# document root.
COPY httpd-pre-init/set-config.sh /docker-entrypoint.d/set-config.sh
RUN printf '#!/bin/sh\nset -e\ncd /usr/local/apache2/htdocs\n. /docker-entrypoint.d/set-config.sh\nexec httpd-foreground\n' > /entrypoint.sh \
 && chmod +x /entrypoint.sh /docker-entrypoint.d/set-config.sh

# Unprivileged: nothing here needs root, and Listen 8080 avoids the <1024 bind.
RUN sed -i 's|^Listen 80$|Listen 8080|' /usr/local/apache2/conf/httpd.conf \
 && chown -R daemon:daemon /usr/local/apache2/htdocs /usr/local/apache2/logs
USER daemon

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://127.0.0.1:8080/index.html >/dev/null || exit 1

ENTRYPOINT ["/entrypoint.sh"]
