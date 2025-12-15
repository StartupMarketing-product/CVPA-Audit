FROM node:20-slim

RUN apt-get update && apt-get install -y curl ca-certificates procps --no-install-recommends \
 && curl -L -o /usr/local/share/ca-certificates/russian_trusted_root_ca_pem.crt "https://gu-st.ru/content/lending/russian_trusted_root_ca_pem.crt" \
 && update-ca-certificates \
 && echo "net.ipv4.tcp_keepalive_time = 30" >> /etc/sysctl.conf \
 && echo "net.ipv4.tcp_keepalive_intvl = 10" >> /etc/sysctl.conf \
 && echo "net.ipv4.tcp_keepalive_probes = 6" >> /etc/sysctl.conf \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev
COPY src ./src

ENV NODE_EXTRA_CA_CERTS=/usr/local/share/ca-certificates/russian_trusted_root_ca_pem.crt
ENV NODE_TLS_REJECT_UNAUTHORIZED=1
ENV PORT=8080

EXPOSE 8080
CMD ["npm", "start"]
