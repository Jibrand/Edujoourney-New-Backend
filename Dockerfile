FROM node:18.9.1

# Install needed packages
RUN apt-get update && \
    apt-get install -y curl jq coreutils moreutils && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PM2 globally
RUN npm install -g pm2

WORKDIR /app

# Copy and install dependencies
COPY package.json .
RUN npm install

# Copy the rest of the code
COPY . .

# App listens on 3002 inside container
EXPOSE 3002

# Start app with PM2
CMD ["pm2-runtime", "ecosystem.config.cjs"]
