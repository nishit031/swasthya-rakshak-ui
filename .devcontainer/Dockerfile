FROM node:20-bookworm

# git for tooling, docker CLI so `docker compose` (used in RUNBOOK.md) also works from inside the container.
RUN apt-get update && apt-get install -y --no-install-recommends \
        git \
        ca-certificates \
        curl \
    && install -m 0755 -d /etc/apt/keyrings \
    && curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg \
    && chmod a+r /etc/apt/keyrings/docker.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian bookworm stable" \
        > /etc/apt/sources.list.d/docker.list \
    && apt-get update && apt-get install -y --no-install-recommends docker-ce-cli docker-compose-plugin \
    && rm -rf /var/lib/apt/lists/*

# Stays root (not the image's built-in "node", uid 1000): this workspace is bind-mounted from
# the host, and hosts using directory-service UIDs (LDAP/AD, often far outside the 1000 range)
# make VS Code's UID-sync unreliable for compose-based devcontainers, causing EACCES on
# postCreateCommand's npm install. Running as root sidesteps host/container UID mismatches
# entirely and needs no per-developer configuration.
